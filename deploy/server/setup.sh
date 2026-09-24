#!/usr/bin/env bash
# Prepares an Ubuntu/Debian server for the Astoria site and installs a release. Safe to run again:
# every step checks what is already there. Run as root from the folder this script is in:
#
#   DOMAIN=example.uz WWW=1 ADMIN_EMAIL=admin@example.uz REPO=owner/repo \
#     RELEASE=/root/astoria-setup/astoria-<commit>.tar.gz bash setup.sh
#
# DOMAIN      site domain (empty: the site answers on the server's IP over plain HTTP)
# WWW         1 to answer on www.DOMAIN as well (redirected to DOMAIN)
# ADMIN_EMAIL login of the first admin, created when there is none yet
# REPO        GitHub repository whose "production" release the deploy agent follows
# RELEASE     release package to install now (optional)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-}"
WWW="${WWW:-0}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
REPO="${REPO:?REPO is required, e.g. owner/repo}"
RELEASE="${RELEASE:-}"
NODE_MAJOR=24

step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
# Runs the site's command-line tool as the service user, with the service settings.
astoria_cli() {
  runuser -u astoria -- env $(grep -v '^[[:space:]]*#' /etc/astoria/astoria.env | xargs) \
    node --disable-warning=ExperimentalWarning /opt/astoria/current/server/index.mjs "$@"
}

[ "$(id -u)" -eq 0 ] || fail "run as root"
. /etc/os-release
case "${ID:-} ${ID_LIKE:-}" in
  *debian*|*ubuntu*) ;;
  *) fail "only Debian and Ubuntu are supported (found ${PRETTY_NAME:-unknown})" ;;
esac
echo "Server: ${PRETTY_NAME}, $(nproc) CPU, $(free -m | awk '/^Mem:/ {print $2}') MB RAM, $(df -h / | awk 'NR==2 {print $4}') free on /"

step "Checking that ports 80 and 443 are free for Caddy"
busy="$(ss -ltnpH 'sport = :80 or sport = :443' 2>/dev/null | grep -v '"caddy"' || true)"
if [ -n "$busy" ]; then
  echo "$busy"
  fail "another program already serves ports 80/443; stop it or move it behind Caddy first"
fi

step "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
# Wait for automatic updates that may be holding the package lock right after boot.
apt_get() { apt-get -o DPkg::Lock::Timeout=600 "$@"; }
apt_get update -qq
apt_get install -y -qq ca-certificates curl gnupg tar sqlite3 openssl >/dev/null

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MAJOR" ]; then
  step "Installing Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
  apt_get install -y -qq nodejs >/dev/null
fi
echo "Node.js $(node --version)"

if ! command -v caddy >/dev/null; then
  step "Installing Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt_get update -qq
  apt_get install -y -qq caddy >/dev/null
fi
echo "$(caddy version)"

step "Creating the service user and folders"
id astoria >/dev/null 2>&1 || useradd --system --home-dir /var/lib/astoria --shell /usr/sbin/nologin astoria
install -d -m 755 /opt/astoria /opt/astoria/releases /opt/astoria/bin /etc/astoria
# The data folder can be crossed but not listed by others; Caddy serves uploads/ straight from disk.
install -d -m 711 -o astoria -g astoria /var/lib/astoria
install -d -m 755 -o astoria -g astoria /var/lib/astoria/uploads
install -d -m 750 -o astoria -g astoria /var/lib/astoria/backups
install -d -m 700 /var/lib/astoria-deploy

if [ ! -f /etc/astoria/astoria.env ]; then
  cat > /etc/astoria/astoria.env <<ENV
NODE_ENV=production
HOST=127.0.0.1
PORT=3001
DATA_DIR=/var/lib/astoria
TRUST_PROXY=1
ENV
fi
printf 'REPO=%s\nTAG=production\n' "$REPO" > /etc/astoria/deploy.env

step "Installing the deploy agent and services"
install -m 755 "$HERE/astoria-deploy.sh" /opt/astoria/bin/astoria-deploy
for unit in astoria.service astoria-deploy.service astoria-deploy.timer astoria-backup.service astoria-backup.timer; do
  install -m 644 "$HERE/$unit" "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable astoria.service astoria-deploy.timer astoria-backup.timer >/dev/null 2>&1
systemctl start astoria-deploy.timer astoria-backup.timer

if [ -n "$RELEASE" ]; then
  step "Installing release $(basename "$RELEASE")"
  /opt/astoria/bin/astoria-deploy --file "$RELEASE"
fi

step "Configuring Caddy"
caddyfile=/etc/caddy/Caddyfile
if [ -f "$caddyfile" ] && ! grep -q 'Managed by deploy/server/setup.sh' "$caddyfile"; then
  cp "$caddyfile" "$caddyfile.before-astoria"
  echo "Previous Caddyfile saved as $caddyfile.before-astoria"
fi
{
  cat "$HERE/Caddyfile"
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

if command -v ufw >/dev/null && ufw status | grep -q '^Status: active'; then
  step "Opening ports 80 and 443 in ufw"
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
fi

if [ -n "$ADMIN_EMAIL" ] && [ -e /opt/astoria/current ]; then
  admins="$(astoria_cli admin:list)"
  if [ -z "$admins" ]; then
    step "Creating the first admin ($ADMIN_EMAIL)"
    out="$(astoria_cli admin:add "$ADMIN_EMAIL")"
    password="${out##*password: }"
    # The log is public: only the encrypted password is printed.
    encrypted="$(printf '%s' "$password" | openssl pkeyutl -encrypt -pubin -inkey "$HERE/bootstrap.pub" -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w0)"
    unset password out
    echo "ADMIN_PASSWORD_ENCRYPTED=$encrypted"
  else
    echo "Admins: $(echo "$admins" | cut -f1 | paste -sd ' ')"
  fi
fi

step "Checking the site"
curl -fsS http://127.0.0.1:3001/api/health && echo
curl -fsS -o /dev/null -w 'Home page through Caddy: HTTP %{http_code}\n' http://127.0.0.1/
systemctl --no-pager --lines=0 status astoria.service caddy.service astoria-deploy.timer | grep -E '●|Active:' || true
echo "Done."
