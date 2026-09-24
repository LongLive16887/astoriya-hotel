#!/usr/bin/env bash
# Installs a build of the Astoria site: astoria-deploy --file astoria-<commit>.tar.gz
# The CI/CD workflow uploads the package and runs this for every commit on main.
#
# Before switching it backs up the database; after switching it waits for /api/health to report
# the new commit. A build that does not start is rolled back to the previous one.
set -euo pipefail

ROOT=/opt/astoria
STATE=/var/lib/astoria-deploy
NODE=$ROOT/node/bin/node
KEEP=5
PORT="$(sed -n 's/^PORT=//p' /etc/astoria/astoria.env)"

log() { echo "astoria-deploy: $*"; }
current() { local target; target="$(readlink "$ROOT/current" 2>/dev/null)" || { echo none; return; }; basename "$target"; }
health_version() { curl -fsS --max-time 3 "http://127.0.0.1:${PORT:-3001}/api/health" 2>/dev/null | sed -n 's/.*"version":"\([^"]*\)".*/\1/p'; }

backup() {
  [ -e "$ROOT/current/server/index.mjs" ] || return 0
  runuser -u astoria -- env $(grep -v '^[[:space:]]*#' /etc/astoria/astoria.env | xargs) \
    "$NODE" --disable-warning=ExperimentalWarning "$ROOT/current/server/index.mjs" backup 14 || log "backup failed"
}

switch_to() {
  ln -sfn "releases/$1" "$ROOT/current.new"
  mv -T "$ROOT/current.new" "$ROOT/current"
  systemctl restart astoria.service
}

prune() {
  local keep_current count=0
  keep_current="$(current)"
  for dir in $(ls -1dt "$ROOT"/releases/*/ 2>/dev/null); do
    count=$((count + 1))
    if [ "$count" -gt "$KEEP" ] && [ "$(basename "$dir")" != "$keep_current" ]; then rm -rf "$dir"; fi
  done
}

package="${2:-}"
[ "${1:-}" = "--file" ] && [ -f "$package" ] || { echo "usage: astoria-deploy --file astoria-<commit>.tar.gz" >&2; exit 2; }

mkdir -p "$STATE" "$ROOT/releases"
exec 9>"$STATE/lock"
flock -w 300 9 || { log "another deploy is still running"; exit 1; }

sha="$(tar -xzOf "$package" astoria/VERSION | tr -d '[:space:]')"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { log "no commit id in $package"; exit 1; }
dir="$ROOT/releases/$sha"
previous="$(current)"

if [ ! -d "$dir" ]; then
  rm -rf "$dir.tmp"
  mkdir -p "$dir.tmp"
  tar -xzf "$package" -C "$dir.tmp" --strip-components=1 --no-same-owner
  [ -f "$dir.tmp/server/index.mjs" ] && [ -f "$dir.tmp/dist/index.html" ] || { rm -rf "$dir.tmp"; log "the package is incomplete"; exit 1; }
  chmod -R a+rX "$dir.tmp"
  mv "$dir.tmp" "$dir"
fi

backup
log "starting ${sha:0:12} (was ${previous:0:12})"
switch_to "$sha"
for _ in $(seq 1 30); do
  if [ "$(health_version)" = "$sha" ]; then
    log "${sha:0:12} is live"
    prune
    exit 0
  fi
  sleep 1
done

log "${sha:0:12} did not start:"
journalctl -u astoria.service -n 20 --no-pager 2>/dev/null | sed 's/^/  /' || true
if [ "$previous" != none ] && [ "$previous" != "$sha" ] && [ -d "$ROOT/releases/$previous" ]; then
  switch_to "$previous"
  log "rolled back to ${previous:0:12}"
fi
exit 1
