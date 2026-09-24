#!/usr/bin/env bash
# Prepares SSH access to the production server in a GitHub Actions job and installs two commands:
#
#   server-ssh 'script'          runs the script on the server as root (through sudo for another user)
#   server-put <local path>...   copies files into a new temporary folder on the server, prints its path
#
# Credentials come from repository secrets, the same way as in the owner's other projects:
# VPS_HOST, VPS_USER and VPS_SSH_KEY (a private key), VPS_PORT if SSH is not on port 22.
# Or SERVER_SSH_PASSWORD, the root password. With both, the key is tried first.
set -euo pipefail

. deploy/config.env
# Secrets pasted with a stray space or line break still work.
trim() { printf '%s' "$1" | tr -d '[:space:]'; }
host="$(trim "${VPS_HOST:-}")"
host="${host:-$SERVER_HOST}"
port="$(trim "${VPS_PORT:-}")"
port="${port:-22}"
key_user="$(trim "${VPS_USER:-}")"
key_user="${key_user:-root}"
bin="$HOME/.local/bin"
mkdir -p "$bin" ~/.ssh
chmod 700 ~/.ssh

if [ -z "${VPS_SSH_KEY:-}" ] && [ -z "${SERVER_SSH_PASSWORD:-}" ]; then
  echo "::error::Add repository secrets for the server (Settings → Secrets and variables → Actions): VPS_HOST, VPS_USER and VPS_SSH_KEY as in your other projects, or SERVER_SSH_PASSWORD with the root password."
  exit 1
fi

if [ -f deploy/server/known_hosts ]; then
  cp deploy/server/known_hosts ~/.ssh/known_hosts
else
  ssh-keyscan -T 20 -p "$port" "$host" > ~/.ssh/known_hosts 2>/dev/null || true
  if [ ! -s ~/.ssh/known_hosts ]; then
    echo "::error::The server $host does not answer on SSH port $port (is it running, and does its firewall allow connections from GitHub?)."
    exit 1
  fi
  echo "Server host keys (first connection, not pinned yet):"
  ssh-keygen -lf ~/.ssh/known_hosts
fi

common="-o UserKnownHostsFile=$HOME/.ssh/known_hosts -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=30 -o Port=$port"
probe='echo "Connected: $(hostname), $(. /etc/os-release && echo "$PRETTY_NAME")"'
# The log is public and masks secret values, so the login is described rather than named.
if [ "$key_user" = root ]; then account="the superuser account (VPS_USER is empty or the superuser)"
else account="the account in VPS_USER (not the superuser)"; fi
ssh_cmd=""

if [ -n "${VPS_SSH_KEY:-}" ]; then
  # Only the key block is used: text copied around it, indentation and Windows line ends are dropped.
  printf '%s\n' "$VPS_SSH_KEY" | tr -d '\r' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//' > ~/.ssh/pasted_key
  sed -n '/^-----BEGIN .*PRIVATE KEY-----$/,/^-----END .*PRIVATE KEY-----$/p' ~/.ssh/pasted_key > ~/.ssh/server_key
  chmod 600 ~/.ssh/pasted_key ~/.ssh/server_key
  if public_key="$(ssh-keygen -y -P '' -f ~/.ssh/server_key 2> ~/.ssh/key_error)"; then
    # The public half is not a secret; it is what the server must list in authorized_keys.
    public_key="$(printf '%s\n' "$public_key" | awk '{print $1, $2}')"
    echo "Key from VPS_SSH_KEY: $(printf '%s\n' "$public_key" | ssh-keygen -lf - | awk '{print $2, $NF}')"
    key_ssh="ssh -i $HOME/.ssh/server_key -o IdentitiesOnly=yes -o BatchMode=yes"
    if $key_ssh $common "$key_user@$host" "$probe"; then
      user="$key_user"
      ssh_cmd="$key_ssh"
      scp_cmd="scp -i $HOME/.ssh/server_key -o IdentitiesOnly=yes -o BatchMode=yes"
    else
      echo "::warning::The server did not accept the key from VPS_SSH_KEY for $account."
      echo "The server lets in the keys listed in ~/.ssh/authorized_keys of the account. To add this one, log in to the"
      echo "server as that account and run:"
      echo "  echo '$public_key github-deploy' >> ~/.ssh/authorized_keys"
    fi
  elif grep -Eq '^(ssh-|ecdsa-|sk-)' ~/.ssh/pasted_key; then
    echo "::warning::VPS_SSH_KEY holds a public key (a .pub file). It needs the private key: the file without .pub, from the line -----BEGIN … PRIVATE KEY----- to -----END … PRIVATE KEY-----."
  elif grep -q '^PuTTY-User-Key-File' ~/.ssh/pasted_key; then
    echo "::warning::VPS_SSH_KEY holds a PuTTY key (.ppk). Open it in PuTTYgen, choose Conversions → Export OpenSSH key and paste the exported file."
  elif [ ! -s ~/.ssh/server_key ]; then
    echo "::warning::VPS_SSH_KEY is not a private SSH key: it must hold the line -----BEGIN … PRIVATE KEY-----, the lines after it and -----END … PRIVATE KEY-----."
  elif grep -q passphrase ~/.ssh/key_error; then
    echo "::warning::The key in VPS_SSH_KEY is protected by a passphrase. Make a key without one (ssh-keygen -N \"\")."
  else
    echo "::warning::The key in VPS_SSH_KEY is damaged: $(cat ~/.ssh/key_error). Copy it again, all lines."
  fi
  rm -f ~/.ssh/pasted_key ~/.ssh/key_error
fi

if [ -z "$ssh_cmd" ] && [ -n "${SERVER_SSH_PASSWORD:-}" ]; then
  command -v sshpass >/dev/null || sudo apt-get install -y -qq sshpass >/dev/null
  if SSHPASS="$SERVER_SSH_PASSWORD" sshpass -e ssh -o PubkeyAuthentication=no $common "root@$host" "$probe"; then
    user=root
    # sshpass reads the password from $SSHPASS, set from the secret when the command runs.
    ssh_cmd='env SSHPASS="$SERVER_SSH_PASSWORD" sshpass -e ssh -o PubkeyAuthentication=no'
    scp_cmd='env SSHPASS="$SERVER_SSH_PASSWORD" sshpass -e scp -o PubkeyAuthentication=no'
  else
    echo "::warning::The server did not accept SERVER_SSH_PASSWORD for the superuser account (password logins for it may be turned off)."
  fi
fi

if [ -z "$ssh_cmd" ]; then
  echo "::error::Could not log in to the server; see the messages above."
  exit 1
fi

sudo_prefix=""
[ "$user" = root ] || sudo_prefix="sudo -n "

cat > "$bin/server-ssh" <<SCRIPT
#!/usr/bin/env bash
# The script goes through stdin, so nothing needs quoting.
printf '%s\n' "\$1" | $ssh_cmd $common "$user@$host" "${sudo_prefix}bash -s"
SCRIPT

cat > "$bin/server-put" <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
dir="\$($ssh_cmd $common "$user@$host" 'mktemp -d /tmp/astoria-upload.XXXXXX')"
$scp_cmd $common -q -r "\$@" "$user@$host:\$dir/"
echo "\$dir"
SCRIPT

chmod +x "$bin/server-ssh" "$bin/server-put"
echo "$bin" >> "$GITHUB_PATH"
if [ "$user" != root ] && ! "$bin/server-ssh" true; then
  echo "::error::The account in VPS_USER cannot run sudo without a password. Use the superuser account, or allow this account sudo without a password."
  exit 1
fi
