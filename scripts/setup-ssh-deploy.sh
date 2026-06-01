#!/usr/bin/env bash
# Generates an SSH key pair for CI/CD deployment and prints setup instructions.
set -euo pipefail

KEY_FILE="${1:-homepilot_deploy_key}"
SERVER_USER="${2:-deploy}"
SERVER_HOST="${3:-89.207.255.213}"

echo "=== HomePilot — SSH deploy key setup ==="
echo

# Generate key
if [[ -f "$KEY_FILE" ]]; then
  echo "Key file '$KEY_FILE' already exists, skipping generation."
else
  ssh-keygen -t ed25519 -C "homepilot-deploy@github-actions" -f "$KEY_FILE" -N ""
  echo "Generated: $KEY_FILE  (private)  and  $KEY_FILE.pub  (public)"
fi

PUBLIC_KEY=$(cat "${KEY_FILE}.pub")
PRIVATE_KEY=$(cat "${KEY_FILE}")

echo
echo "─────────────────────────────────────────────────────────────"
echo "STEP 1 — Add the public key to your server"
echo "─────────────────────────────────────────────────────────────"
echo "Run this on the server (as root or the deploy user):"
echo
echo "  ssh ${SERVER_USER}@${SERVER_HOST}"
echo "  mkdir -p ~/.ssh && chmod 700 ~/.ssh"
echo "  echo '${PUBLIC_KEY}' >> ~/.ssh/authorized_keys"
echo "  chmod 600 ~/.ssh/authorized_keys"
echo

echo "─────────────────────────────────────────────────────────────"
echo "STEP 2 — Add secrets to GitHub"
echo "─────────────────────────────────────────────────────────────"
echo "Go to: https://github.com/<your-org>/HomePilot/settings/secrets/actions"
echo "Create the following repository secrets:"
echo
echo "  SSH_HOST          = ${SERVER_HOST}"
echo "  SSH_USER          = ${SERVER_USER}"
echo "  SSH_PRIVATE_KEY   = (contents of ${KEY_FILE}, shown below)"
echo
echo "──── PRIVATE KEY (copy everything between the dashes) ────"
echo "${PRIVATE_KEY}"
echo "──────────────────────────────────────────────────────────"
echo

echo "STEP 3 — Verify the connection locally (optional)"
echo "  ssh -i ${KEY_FILE} ${SERVER_USER}@${SERVER_HOST} 'echo OK'"
echo

echo "Done. Delete the local key files after uploading to GitHub Secrets."
echo "  rm -f ${KEY_FILE} ${KEY_FILE}.pub"
