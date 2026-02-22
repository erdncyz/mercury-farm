#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$HOME/.mercury-farm-runtime"
LABEL="com.mercury.ios-provider"
USER_UID="$(id -u)"

if [ -x "$PROJECT_DIR/scripts/auto-configure-network.sh" ]; then
  echo "Auto-configuring STF_DOMAIN from LAN IP..."
  "$PROJECT_DIR/scripts/auto-configure-network.sh"
fi

mkdir -p "$RUNTIME_DIR"

echo "Syncing workspace to runtime mirror..."
rsync -a --delete \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "ios-provider.log" \
  --exclude "ios-provider.launchd.out.log" \
  --exclude "ios-provider.launchd.err.log" \
  "$PROJECT_DIR/" "$RUNTIME_DIR/"

echo "Restarting LaunchAgent: $LABEL"
launchctl kickstart -k "gui/$USER_UID/$LABEL"

echo "Done."
echo "Workspace: $PROJECT_DIR"
echo "Runtime: $RUNTIME_DIR"
