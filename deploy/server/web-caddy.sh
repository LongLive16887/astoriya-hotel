#!/usr/bin/env bash
# Publishes the site with Caddy on a server where nothing else uses ports 80/443:
# DOMAIN=example.uz WWW=1 PORT=3001 bash web-caddy.sh (called by setup.sh).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-}"
WWW="${WWW:-0}"
port="${PORT:-3001}"
step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
apt_get() { apt-get -o DPkg::Lock::Timeout=600 "$@"; }

if ! command -v caddy >/dev/null; then
  step "Installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt_get update -qq
  apt_get install -y -qq caddy >/dev/null
fi
step "Configuring Caddy ($(caddy version | cut -d' ' -f1))"
caddyfile=/etc/caddy/Caddyfile
if [ -f "$caddyfile" ] && ! grep -q 'Managed by deploy/server/setup.sh' "$caddyfile"; then
  cp "$caddyfile" "$caddyfile.before-astoria"
  echo "Previous Caddyfile saved as $caddyfile.before-astoria"
fi
{
  sed "s/127.0.0.1:3001/127.0.0.1:$port/" "$HERE/Caddyfile"
  if [ -n "$DOMAIN" ]; then
    names="$DOMAIN"
    [ "$WWW" = "1" ] && names="$DOMAIN www.$DOMAIN"
    printf '\n%s {\n\timport astoria\n}\n' "$DOMAIN"
    [ "$WWW" = "1" ] && printf '\nwww.%s {\n\tredir https://%s{uri} permanent\n}\n' "$DOMAIN" "$DOMAIN"
    # Explicit, because the catch-all block below would otherwise answer these over plain HTTP.
    printf '\n%s {\n\tredir https://%s{uri} permanent\n}\n' "$(printf 'http://%s, ' $names | sed 's/, $//')" "$DOMAIN"
  fi
  # The server's IP address (and any other name) over plain HTTP.
  printf '\nhttp:// {\n\timport astoria\n}\n'
} > "$caddyfile.new"
caddy validate --adapter caddyfile --config "$caddyfile.new" >/dev/null
mv "$caddyfile.new" "$caddyfile"
systemctl enable caddy >/dev/null 2>&1
if systemctl is-active --quiet caddy; then systemctl reload caddy; else systemctl restart caddy; fi
