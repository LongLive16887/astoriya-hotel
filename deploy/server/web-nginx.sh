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
main_conf=/etc/nginx/nginx.conf

# True when nginx's configuration includes this path through one of its include globs.
included() {
  local pattern
  while read -r pattern; do
    case "$pattern" in /*) ;; *) pattern="/etc/nginx/$pattern" ;; esac
    # shellcheck disable=SC2053 # the include pattern is a glob
    [[ $1 == $pattern ]] && return 0
  done < <(nginx -T 2>/dev/null | sed -n 's/^[[:space:]]*include[[:space:]]\{1,\}\([^;]*\);.*/\1/p')
  return 1
}
# Some servers keep every site in nginx.conf and do not read sites-enabled/ (or conf.d/). Then
# nginx.conf gets one include line for the site, at the end of its http block: the sites before it
# stay the default ones for requests to unknown names.
link=""
if [ -n "$enabled" ] && included "$enabled"; then link="$enabled"
elif [ -z "$enabled" ] && included "$conf"; then link="$conf"
fi
add_include() {
  [ -z "$link" ] || return 0
  grep -qF "include $conf;" "$main_conf" && return 0
  cp "$main_conf" "$main_conf.astoria-backup"
  awk -v line="    include $conf; # Astoria hotel site (deploy/server/web-nginx.sh)" '
    # Code of a line without its comment; braces inside quotes do not count.
    function code(s,   out, i, c, q) {
      out = ""; q = ""
      for (i = 1; i <= length(s); i++) {
        c = substr(s, i, 1)
        if (q != "") { if (c == q) q = ""; continue }
        if (c == "\"" || c == "\047") { q = c; continue }
        if (c == "#") break
        out = out c
      }
      return out
    }
    {
      c = code($0); opens = gsub(/[{]/, "", c); closes = gsub(/[}]/, "", c)
      if (!in_http && !done && depth == 0 && code($0) ~ /(^|[[:space:];])http[[:space:]]*[{]/) in_http = 1
      after = depth + opens - closes
      if (in_http && !done && after == 0) { print line; done = 1; in_http = 0 }
      print; depth = after
    }
    END { exit done ? 0 : 1 }' "$main_conf" > "$main_conf.astoria-new" ||
    { rm -f "$main_conf.astoria-new"; fail "could not find the http block in $main_conf; add 'include $conf;' at its end by hand"; }
  mv "$main_conf.astoria-new" "$main_conf"
  echo "nginx reads its sites from $main_conf only: added 'include $conf;' at the end of its http block"
}
if [ -z "$DOMAIN" ]; then
  echo "nginx already serves other sites here, so the site is published only under its own domain:"
  echo "set DOMAIN in deploy/config.env. The site itself is installed and running on 127.0.0.1:$port."
else
  install -m 644 "$HERE/nginx-headers.conf" /etc/nginx/snippets/astoria-headers.conf 2>/dev/null ||
    { install -d /etc/nginx/snippets && install -m 644 "$HERE/nginx-headers.conf" /etc/nginx/snippets/astoria-headers.conf; }
  install -d /var/www/letsencrypt
  names="$DOMAIN"
  [ "$WWW" = "1" ] && names="$DOMAIN www.$DOMAIN"
  # Listen on IPv6 only where nginx already does, like the other sites.
  ipv6=0
  ss -ltnH 'sport = :80' 2>/dev/null | grep -q '\[::\]:80' && ipv6=1
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
    if [ -n "$link" ] && [ "$link" = "$enabled" ]; then ln -sfn "$conf" "$enabled"
    else [ -n "$enabled" ] && rm -f "$enabled"  # not read by this nginx
    fi
    rm -f "$main_conf.astoria-backup"
    add_include
    if ! nginx -t 2>/tmp/astoria-nginx-test; then
      cat /tmp/astoria-nginx-test
      [ -f "$main_conf.astoria-backup" ] && mv "$main_conf.astoria-backup" "$main_conf"
      if [ -f "$conf.previous" ]; then mv "$conf.previous" "$conf"; else rm -f "$conf" "$enabled"; fi
      fail "the new nginx config did not pass nginx -t; the previous one is back"
    fi
    rm -f "$main_conf.astoria-backup"
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
    # The Certificate Authority's own words: which address it reached and what it got there.
    grep -E 'reported these problems|Domain:|Type:|Detail:' /tmp/astoria-certbot.log || tail -5 /tmp/astoria-certbot.log
    echo "::warning::No HTTPS certificate yet: check that the DNS A records of $names point to this server. The site answers over HTTP until then; run the setup again afterwards."
  fi
fi
