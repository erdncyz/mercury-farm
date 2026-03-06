#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$HOME/.mercury-farm-runtime"
LABEL="com.mercury.ios-provider"
USER_UID="$(id -u)"

if [ -f "$PROJECT_DIR/scripts/auto-configure-network.sh" ]; then
  echo "Auto-configuring MERCURY_DOMAIN from LAN IP..."
  /bin/bash "$PROJECT_DIR/scripts/auto-configure-network.sh"
fi

mkdir -p "$RUNTIME_DIR"

echo "Syncing workspace to runtime mirror..."
rsync -a --delete \
  --no-times \
  --omit-dir-times \
  --no-perms \
  --no-owner \
  --no-group \
  --exclude ".git" \
  --exclude "node_modules" \
  --exclude "ios-provider.log" \
  --exclude "ios-provider.launchd.out.log" \
  --exclude "ios-provider.launchd.err.log" \
  "$PROJECT_DIR/" "$RUNTIME_DIR/"

if [ ! -x "$RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh" ]; then
  echo "ERROR: Missing installer script in runtime: $RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh" >&2
  exit 1
fi

echo "Installing LaunchAgent (runtime-only source)..."
"$RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh"

echo "Restarting LaunchAgent: $LABEL"
launchctl kickstart -k "gui/$USER_UID/$LABEL"

echo "Done."
echo "Workspace: $PROJECT_DIR"
echo "Runtime: $RUNTIME_DIR"
echo "Launch source: runtime (single source of truth)"
