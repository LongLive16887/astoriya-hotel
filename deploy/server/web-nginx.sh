#!/usr/bin/env bash
# Adds the site to an nginx that already serves other sites, and gets its HTTPS certificate
# with certbot: DOMAIN=example.uz WWW=1 PORT=3100 bash web-nginx.sh (called by setup.sh).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${DOMAIN:-}"
WWW="${WWW:-0}"
port="${PORT:-3100}"
step() { printf '\n==> %s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
apt_get() { apt-get -o DPkg::Lock::Timeout=600 "$@"; }

step "Configuring nginx ($(nginx -v 2>&1 | sed 's#.*/##'))"
if [ -d /etc/nginx/sites-available ]; then
  conf=/etc/nginx/sites-available/astoria.conf
  enabled=/etc/nginx/sites-enabled/astoria.conf
else
  conf=/etc/nginx/conf.d/astoria.conf
  enabled=""
fi
if [ -z "$DOMAIN" ]; then
  echo "nginx already serves other sites here, so the site is published only under its own domain:"
  echo "set DOMAIN in deploy/config.env. The site itself is installed and running on 127.0.0.1:$port."
else
  install -m 644 "$HERE/nginx-headers.conf" /etc/nginx/snippets/astoria-headers.conf 2>/dev/null ||
    { install -d /etc/nginx/snippets && install -m 644 "$HERE/nginx-headers.conf" /etc/nginx/snippets/astoria-headers.conf; }
  install -d /var/www/letsencrypt
  names="$DOMAIN"
  [ "$WWW" = "1" ] && names="$DOMAIN www.$DOMAIN"
  ipv6=0
  [ -s /proc/net/if_inet6 ] && ipv6=1
  # http2 moved from "listen … http2" to its own directive in nginx 1.25.1.
  nginx_version="$(nginx -v 2>&1 | sed -E 's#.*/([0-9.]+).*#\1#')"
  if [ "$(printf '%s\n1.25.1\n' "$nginx_version" | sort -V | head -1)" = 1.25.1 ]; then http2="new"; else http2="old"; fi

  listen() { # listen <port> [ssl]
    local extra=""
    [ "${2:-}" = ssl ] && extra=" ssl" && [ "$http2" = old ] && extra=" ssl http2"
    echo "    listen $1$extra;"
    [ "$ipv6" = 1 ] && echo "    listen [::]:$1$extra;"
    [ "${2:-}" = ssl ] && [ "$http2" = new ] && echo "    http2 on;"
    return 0
  }
  site() { sed "s/127.0.0.1:3001/127.0.0.1:$port/" "$HERE/nginx-site.conf"; }
  cert="/etc/letsencrypt/live/$DOMAIN"

  write_conf() { # write_conf http|https
    {
      echo "# Managed by deploy/server/setup.sh: changes made here are replaced on the next setup."
      echo "server {"
      listen 80
      echo "    server_name $names;"
      echo "    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }"
      if [ "$1" = https ]; then
        echo "    location / { return 301 https://$DOMAIN\$request_uri; }"
      else
        site
      fi
      echo "}"
      if [ "$1" = https ]; then
        echo "server {"
        listen 443 ssl
        echo "    server_name $DOMAIN;"
        echo "    ssl_certificate $cert/fullchain.pem;"
        echo "    ssl_certificate_key $cert/privkey.pem;"
        site
        echo "}"
        if [ "$WWW" = "1" ]; then
          echo "server {"
          listen 443 ssl
          echo "    server_name www.$DOMAIN;"
          echo "    ssl_certificate $cert/fullchain.pem;"
          echo "    ssl_certificate_key $cert/privkey.pem;"
          echo "    return 301 https://$DOMAIN\$request_uri;"
          echo "}"
        fi
      fi
    } > "$conf.new"
    [ -f "$conf" ] && cp "$conf" "$conf.previous"
    mv "$conf.new" "$conf"
    [ -n "$enabled" ] && ln -sfn "$conf" "$enabled"
    if ! nginx -t 2>/tmp/astoria-nginx-test; then
      cat /tmp/astoria-nginx-test
      if [ -f "$conf.previous" ]; then mv "$conf.previous" "$conf"; else rm -f "$conf" "$enabled"; fi
      fail "the new nginx config did not pass nginx -t; the previous one is back"
    fi
    systemctl reload nginx
  }

  if [ -f "$cert/fullchain.pem" ]; then
    write_conf https
  else
    write_conf http
  fi
  certbot_names=""
  for name in $names; do certbot_names="$certbot_names -d $name"; done
  if certbot certonly --webroot -w /var/www/letsencrypt $certbot_names --cert-name "$DOMAIN" \
    --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring --expand \
    --deploy-hook 'systemctl reload nginx' >/tmp/astoria-certbot.log 2>&1; then
    write_conf https
    echo "HTTPS certificate for $names is in place (renewed automatically by certbot)"
  else
    tail -5 /tmp/astoria-certbot.log
    echo "::warning::No HTTPS certificate yet: check that the DNS A records of $names point to this server. The site answers over HTTP until then; run the setup again afterwards."
  fi
fi
