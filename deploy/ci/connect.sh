#!/usr/bin/env bash
# Prepares SSH access to the production server in a GitHub Actions job and installs two commands:
#
#   server-ssh 'script'          runs the script on the server as root (through sudo for another user)
#   server-put <local path>...   copies files into a new temporary folder on the server, prints its path
#
# Credentials come from repository secrets, the same way as in the owner's other projects:
# VPS_HOST, VPS_USER and VPS_SSH_KEY (a private key), VPS_PORT if SSH is not on port 22.
# Or SERVER_SSH_PASSWORD, the root password.
set -euo pipefail

. deploy/config.env
host="${VPS_HOST:-$SERVER_HOST}"
port="${VPS_PORT:-22}"
bin="$HOME/.local/bin"
mkdir -p "$bin" ~/.ssh
chmod 700 ~/.ssh

if [ -n "${VPS_SSH_KEY:-}" ]; then
  user="${VPS_USER:-root}"
  printf '%s\n' "$VPS_SSH_KEY" | tr -d '\r' > ~/.ssh/server_key
  chmod 600 ~/.ssh/server_key
  ssh_cmd="ssh -i $HOME/.ssh/server_key -o IdentitiesOnly=yes -o BatchMode=yes"
  scp_cmd="scp -i $HOME/.ssh/server_key -o IdentitiesOnly=yes -o BatchMode=yes"
elif [ -n "${SERVER_SSH_PASSWORD:-}" ]; then
  user=root
  command -v sshpass >/dev/null || sudo apt-get install -y -qq sshpass >/dev/null
  # sshpass reads the password from $SSHPASS, set from the secret when the command runs.
  ssh_cmd='env SSHPASS="$SERVER_SSH_PASSWORD" sshpass -e ssh -o PubkeyAuthentication=no'
  scp_cmd='env SSHPASS="$SERVER_SSH_PASSWORD" sshpass -e scp -o PubkeyAuthentication=no'
else
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

sudo_prefix=""
[ "$user" = root ] || sudo_prefix="sudo -n "
common="-o UserKnownHostsFile=$HOME/.ssh/known_hosts -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=30 -o Port=$port"

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
echo "Connecting as $user@$host"
"$bin/server-ssh" 'echo "Connected: $(hostname), $(. /etc/os-release && echo "$PRETTY_NAME")"'
