#!/usr/bin/env bash
# Prepares an Ubuntu/Debian server for the Astoria site and installs a build. Safe to run again:
# every step checks what is already there. Other projects on the server are left alone: Node.js
# goes to /opt/astoria/node (the system Node.js is not touched), and when nginx already serves
# ports 80/443 the site is added to it as one more config; Caddy is installed only on a free server.
#
# Run as root:
#   DOMAIN=example.uz WWW=1 ADMIN_EMAIL=admin@example.uz RELEASE=/tmp/…/astoria-<commit>.tar.gz bash setup.sh
#
# DOMAIN      site domain (empty: with Caddy the site answers on the server's IP over plain HTTP;
#             with nginx it is published only once there is a domain)
# WWW         1 to answer on www.DOMAIN as well (redirected to DOMAIN)
# WEB         nginx or caddy to choose the web server by hand (default: detected)
# ADMIN_EMAIL login of the first admin, created when there is none yet
# RELEASE     build package to install now (optional)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-}"
WWW="${WWW:-0}"
WEB="${WEB:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
RELEASE="${RELEASE:-}"
NODE_MAJOR=24
NODE=/opt/astoria/node/bin/node

step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
# Runs the site's command-line tool as the service user, with the service settings.
astoria_cli() {
  runuser -u astoria -- env $(grep -v '^[[:space:]]*#' /etc/astoria/astoria.env | xargs) \
    "$NODE" --disable-warning=ExperimentalWarning /opt/astoria/current/server/index.mjs "$@"
}

[ "$(id -u)" -eq 0 ] || fail "run as root"
. /etc/os-release
case "${ID:-} ${ID_LIKE:-}" in
  *debian*|*ubuntu*) ;;
  *) fail "only Debian and Ubuntu are supported (found ${PRETTY_NAME:-unknown})" ;;
esac
echo "Server: ${PRETTY_NAME}, $(nproc) CPU, $(free -m | awk '/^Mem:/ {print $2}') MB RAM, $(df -h / | awk 'NR==2 {print $4}') free on /"

step "Choosing the web server"
on_web_ports="$(ss -ltnpH 'sport = :80 or sport = :443' 2>/dev/null || true)"
if [ -z "$WEB" ]; then
  if echo "$on_web_ports" | grep -q '"nginx"'; then WEB=nginx
  elif [ -z "$on_web_ports" ] || echo "$on_web_ports" | grep -q '"caddy"'; then WEB=caddy
  else
    echo "$on_web_ports"
    fail "ports 80/443 are taken by a program other than nginx or Caddy; set WEB in deploy/config.env"
  fi
fi
[ "$WEB" = nginx ] || [ "$WEB" = caddy ] || fail "WEB must be nginx or caddy"
echo "Web server: $WEB"

step "Installing system packages"
export DEBIAN_FRONTEND=noninteractive
# Wait for automatic updates that may be holding the package lock right after boot.
apt_get() { apt-get -o DPkg::Lock::Timeout=600 "$@"; }
missing=""
for package in ca-certificates curl gnupg tar gzip sqlite3 openssl; do
  dpkg -s "$package" >/dev/null 2>&1 || missing="$missing $package"
done
[ "$WEB" = nginx ] && [ -n "$DOMAIN" ] && ! command -v certbot >/dev/null && missing="$missing certbot"
if [ -n "$missing" ]; then
  apt_get update -qq
  apt_get install -y -qq $missing >/dev/null
  echo "Installed:$missing"
fi

step "Node.js $NODE_MAJOR for the site (in /opt/astoria/node)"
case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64 | arm64) arch=arm64 ;;
  *) fail "unsupported processor $(uname -m)" ;;
esac
node_base="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
sums="$(curl -fsSL "$node_base/SHASUMS256.txt")"
node_file="$(printf '%s\n' "$sums" | awk '{print $2}' | grep -E "^node-v[0-9.]+-linux-$arch\.tar\.gz$")"
node_version="$(echo "$node_file" | sed -E 's/^node-(v[0-9.]+)-.*/\1/')"
node_updated=0
if [ "$("$NODE" --version 2>/dev/null)" != "$node_version" ]; then
  tmp="$(mktemp -d)"
  curl -fsSL -o "$tmp/$node_file" "$node_base/$node_file"
  (cd "$tmp" && printf '%s\n' "$sums" | grep " $node_file\$" | sha256sum --quiet -c -)
  mkdir -p /opt/astoria
  rm -rf /opt/astoria/node.new
  mkdir /opt/astoria/node.new
  tar -xzf "$tmp/$node_file" -C /opt/astoria/node.new --strip-components=1 --no-same-owner
  rm -rf /opt/astoria/node "$tmp"
  mv /opt/astoria/node.new /opt/astoria/node
  node_updated=1
fi
echo "Node.js $("$NODE" --version); the system Node.js is left as it is"

step "Creating the service user and folders"
id astoria >/dev/null 2>&1 || useradd --system --home-dir /var/lib/astoria --shell /usr/sbin/nologin astoria
install -d -m 755 /opt/astoria /opt/astoria/releases /opt/astoria/bin /etc/astoria
# The data folder can be crossed but not listed by others; the web server reads uploads/ directly.
install -d -m 711 -o astoria -g astoria /var/lib/astoria
install -d -m 755 -o astoria -g astoria /var/lib/astoria/uploads
install -d -m 750 -o astoria -g astoria /var/lib/astoria/backups
install -d -m 700 /var/lib/astoria-deploy

if [ ! -f /etc/astoria/astoria.env ]; then
  cat > /etc/astoria/astoria.env <<ENV
NODE_ENV=production
HOST=127.0.0.1
PORT=3100
DATA_DIR=/var/lib/astoria
TRUST_PROXY=1
ENV
fi
grep -q '^PORT=' /etc/astoria/astoria.env || echo 'PORT=3100' >> /etc/astoria/astoria.env
port="$(sed -n 's/^PORT=//p' /etc/astoria/astoria.env)"
# The port must be free of other programs, and of other sites' nginx configs: a site whose program
# is stopped still points at its port.
our_pid="$(systemctl show -p MainPID --value astoria.service 2>/dev/null || true)"
if ss -ltnpH "sport = :$port" | grep -v "pid=${our_pid:-0}," | grep -q .; then
  fail "port $port is taken by another program; change PORT in /etc/astoria/astoria.env"
fi
if [ -d /etc/nginx ] && grep -RlsE "(127\.0\.0\.1|localhost):$port([^0-9]|\$)" /etc/nginx/sites-enabled /etc/nginx/conf.d | grep -v '/astoria\.conf$' | grep -q .; then
  fail "another site in nginx sends requests to port $port; change PORT in /etc/astoria/astoria.env"
fi

step "Installing the services"
install -m 755 "$HERE/astoria-deploy.sh" /opt/astoria/bin/astoria-deploy
for unit in astoria.service astoria-backup.service astoria-backup.timer; do
  install -m 644 "$HERE/$unit" "/etc/systemd/system/$unit"
done
# Left over from the first version of this setup, which polled GitHub for builds.
systemctl disable --now astoria-deploy.timer >/dev/null 2>&1 || true
rm -f /etc/systemd/system/astoria-deploy.service /etc/systemd/system/astoria-deploy.timer
systemctl daemon-reload
systemctl enable astoria.service astoria-backup.timer >/dev/null 2>&1
systemctl start astoria-backup.timer

if [ -n "$RELEASE" ]; then
  step "Installing the build $(basename "$RELEASE")"
  /opt/astoria/bin/astoria-deploy --file "$RELEASE"
elif [ "$node_updated" = 1 ] && [ -e /opt/astoria/current ]; then
  systemctl restart astoria.service
fi

step "Publishing the site with $WEB"
DOMAIN="$DOMAIN" WWW="$WWW" PORT="$port" bash "$HERE/web-$WEB.sh"

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
curl -fsS "http://127.0.0.1:$port/api/health" && echo
systemctl --no-pager --lines=0 status astoria.service | grep -E 'Active:' || true
echo "Done."
