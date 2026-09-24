#!/usr/bin/env bash
# Installs a release of the Astoria site. Without arguments (run every minute by astoria-deploy.timer)
# it checks the "production" release on GitHub, published by the CI workflow for each commit on main,
# and installs it when it is new. With --file it installs a package that is already on the server.
#
# A release that does not start is rolled back and not tried again.
set -euo pipefail

ROOT=/opt/astoria
STATE=/var/lib/astoria-deploy
KEEP=5
. /etc/astoria/deploy.env
PORT="$(sed -n 's/^PORT=//p' /etc/astoria/astoria.env)"

log() { echo "astoria-deploy: $*"; }
current() { local target; target="$(readlink "$ROOT/current" 2>/dev/null)" || { echo none; return; }; basename "$target"; }
health_version() { curl -fsS --max-time 3 "http://127.0.0.1:${PORT:-3001}/api/health" 2>/dev/null | sed -n 's/.*"version":"\([^"]*\)".*/\1/p'; }

backup() {
  [ -e "$ROOT/current/server/index.mjs" ] || return 0
  runuser -u astoria -- env $(grep -v '^[[:space:]]*#' /etc/astoria/astoria.env | xargs) \
    node --disable-warning=ExperimentalWarning "$ROOT/current/server/index.mjs" backup 14 || log "backup failed"
}

switch_to() {
  ln -sfn "releases/$1" "$ROOT/current.new"
  mv -T "$ROOT/current.new" "$ROOT/current"
  systemctl restart astoria.service
}

# install <package> <commit>
install_release() {
  local package="$1" sha="$2" dir="$ROOT/releases/$2" previous
  previous="$(current)"
  if [ ! -d "$dir" ]; then
    rm -rf "$dir.tmp"
    mkdir -p "$dir.tmp"
    tar -xzf "$package" -C "$dir.tmp" --strip-components=1 --no-same-owner
    [ "$(cat "$dir.tmp/VERSION")" = "$sha" ] || { rm -rf "$dir.tmp"; log "package does not contain $sha"; return 1; }
    [ -f "$dir.tmp/server/index.mjs" ] && [ -f "$dir.tmp/dist/index.html" ] || { rm -rf "$dir.tmp"; log "package is incomplete"; return 1; }
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
      return 0
    fi
    sleep 1
  done

  log "${sha:0:12} did not start; journalctl -u astoria shows why"
  touch "$STATE/failed-$sha"
  if [ "$previous" != none ] && [ -d "$ROOT/releases/$previous" ]; then
    switch_to "$previous"
    log "rolled back to ${previous:0:12}"
  fi
  return 1
}

prune() {
  local keep_current keep_count=0
  keep_current="$(current)"
  for dir in $(ls -1dt "$ROOT"/releases/*/ 2>/dev/null); do
    name="$(basename "$dir")"
    keep_count=$((keep_count + 1))
    if [ "$keep_count" -gt "$KEEP" ] && [ "$name" != "$keep_current" ]; then rm -rf "$dir"; fi
  done
}

mkdir -p "$STATE" "$ROOT/releases"
exec 9>"$STATE/lock"
flock -n 9 || { log "another deploy is running"; exit 0; }

if [ "${1:-}" = "--file" ]; then
  package="${2:?usage: astoria-deploy --file astoria-<commit>.tar.gz}"
  sha="$(tar -xzOf "$package" astoria/VERSION | tr -d '[:space:]')"
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { log "no commit id in $package"; exit 1; }
  rm -f "$STATE/failed-$sha"
  install_release "$package" "$sha"
  exit $?
fi

base="${RELEASE_URL:-https://github.com/$REPO/releases/download/$TAG}"
latest="$(curl -fsSL --max-time 20 "$base/version.txt" 2>/dev/null | tr -d '[:space:]')" || exit 0
[[ "$latest" =~ ^[0-9a-f]{40}$ ]] || exit 0
[ "$latest" = "$(current)" ] && exit 0
[ -e "$STATE/failed-$latest" ] && exit 0

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
name="astoria-$latest.tar.gz"
curl -fsSL --max-time 300 -o "$tmp/$name" "$base/$name"
curl -fsSL --max-time 20 -o "$tmp/$name.sha256" "$base/$name.sha256"
(cd "$tmp" && sha256sum --quiet -c "$name.sha256") || { log "checksum mismatch for $name"; exit 1; }
install_release "$tmp/$name" "$latest"
