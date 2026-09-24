#!/usr/bin/env bash
# Read-only look at the server before anything is installed: system, web server, other projects,
# ports and certificates. Nothing is changed. The Actions log is public and the report describes
# other projects on this server, so it is printed encrypted for the holder of the private key
# that matches bootstrap.pub:
#
#   REPORT_KEY=<AES key encrypted with RSA, base64>
#   REPORT: <gzip + AES-256-CBC, base64, in lines>
set -uo pipefail

PUBLIC_KEY="${1:?usage: inspect.sh bootstrap.pub [domain]}"
DOMAIN="${2:-}"

section() { printf '\n== %s\n' "$*"; }

report() {
  section system
  grep PRETTY_NAME /etc/os-release
  uname -srm
  echo "CPU: $(nproc)"
  free -m
  df -h / /var /opt 2>/dev/null
  uptime

  section "who can log in"
  id
  awk -F: '$3 == 0 || ($3 >= 1000 && $3 < 65000) {print $1, $6, $7}' /etc/passwd
  grep -Ehs '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf
  # What sshd actually applies to root, and the keys it would accept: explains a refused deploy key.
  sshd -T -C user=root,host=github.com,addr=192.0.2.1 2>&1 |
    grep -Ei '^(permitrootlogin|pubkeyauthentication|passwordauthentication|authorizedkeysfile|allowusers|allowgroups|denyusers|authenticationmethods|strictmodes) '
  stat -c '%a %U %n' / /root /root/.ssh 2>/dev/null
  for file in /root/.ssh/authorized_keys /root/.ssh/authorized_keys2 /home/*/.ssh/authorized_keys; do
    [ -f "$file" ] || continue
    echo "--- $file: $(stat -c '%a %U' "$file"), $(wc -l < "$file") lines, ends with a line break: $([ -z "$(tail -c1 "$file")" ] && echo yes || echo no)"
    ssh-keygen -lf "$file" 2>&1
  done

  section "listening ports"
  ss -ltnp

  section "programs"
  for program in nginx apache2 httpd caddy traefik docker pm2 node npm certbot git ufw; do
    path="$(command -v "$program" 2>/dev/null)" || continue
    version="$("$program" --version 2>&1 | head -1)"
    [ "$program" = nginx ] && version="$(nginx -v 2>&1)"
    echo "$program: $path ($version)"
  done

  section "running services"
  systemctl list-units --type=service --state=running --no-pager --no-legend | awk '{print $1}'

  section "nginx"
  if [ -d /etc/nginx ]; then
    ls -la /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null
    for file in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
      [ -f "$file" ] || continue
      echo "--- $file"
      grep -Ehv '^\s*(#|$)' "$file" | grep -E 'server_name|listen|root |proxy_pass|default_server|ssl_certificate |return 30' | sed 's/^\s*/  /'
    done
    nginx -t 2>&1 | tail -2
    # Every file nginx loads, in order: a server block elsewhere (nginx.conf, other includes) or one
    # that listens on a specific address can take requests meant for a site.
    echo "--- nginx -T"
    nginx -T 2>/dev/null | grep -E '^# configuration file |^[[:space:]]*(listen|server_name|include|return) ' | sed 's/^[[:space:]]*/  /'
  fi

  section network
  ip -4 -o addr show scope global 2>/dev/null | awk '{print $2, $4}'
  if [ -n "$DOMAIN" ]; then
    # How this server's nginx answers for the domain, on each of its addresses.
    for ip in 127.0.0.1 $(ip -4 -o addr show scope global 2>/dev/null | awk '{sub(/\/.*/, "", $4); print $4}'); do
      echo "http://$DOMAIN via $ip: $(curl -s -o /dev/null -m 5 -w '%{http_code} %{redirect_url}' -H "Host: $DOMAIN" "http://$ip/api/health")"
    done
    echo "$DOMAIN resolves here to: $(getent ahostsv4 "$DOMAIN" | awk '{print $1}' | sort -u | paste -sd' ' -)"
  fi

  section certificates
  ls /etc/letsencrypt/live 2>/dev/null
  systemctl list-timers --no-pager 2>/dev/null | grep -Ei 'certbot|renew' || true

  section docker
  docker ps --format '{{.Names}}  {{.Image}}  {{.Status}}  {{.Ports}}' 2>/dev/null

  section pm2
  for home in /root /home/*; do
    [ -d "$home/.pm2" ] || continue
    owner="$(stat -c %U "$home")"
    echo "--- $owner"
    runuser -u "$owner" -- pm2 jlist 2>/dev/null | node -e '
      let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
        try { for (const p of JSON.parse(s)) console.log(p.name, p.pm2_env.status, p.pm2_env.pm_cwd) } catch {}
      })' 2>/dev/null
  done

  section "project folders"
  ls -la /var/www /opt /srv 2>/dev/null
  for home in /root /home/*; do ls -d "$home"/*/ 2>/dev/null; done

  section firewall
  ufw status 2>/dev/null
  iptables -S INPUT 2>/dev/null | head -20

  section astoria
  ls -la /opt/astoria /var/lib/astoria /etc/astoria 2>/dev/null
  systemctl is-active astoria 2>/dev/null

  section cron
  crontab -l 2>/dev/null
  ls /etc/cron.d 2>/dev/null
}

key="$(openssl rand -hex 32)"
echo "REPORT_KEY=$(printf '%s' "$key" | openssl pkeyutl -encrypt -pubin -inkey "$PUBLIC_KEY" -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 | base64 -w0)"
report 2>&1 | gzip -9 | openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:$key" | base64 -w0 | fold -w 800 | sed 's/^/REPORT: /'
