#!/bin/bash

set -euo pipefail

RUNTIME_DIR="$HOME/.mercury-farm-runtime"
LABEL="com.mercury.ios-provider"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
USER_UID="$(id -u)"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$RUNTIME_DIR"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd ${RUNTIME_DIR} &amp;&amp; /bin/bash ./scripts/start-ios-provider.sh</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${RUNTIME_DIR}</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ThrottleInterval</key>
  <integer>5</integer>

  <key>StandardOutPath</key>
  <string>${RUNTIME_DIR}/ios-provider.launchd.out.log</string>

  <key>StandardErrorPath</key>
  <string>${RUNTIME_DIR}/ios-provider.launchd.err.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true
launchctl enable "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true

bootstrap_ok=0
for _ in 1 2 3; do
  if launchctl bootstrap "gui/${USER_UID}" "$PLIST_PATH" >/dev/null 2>&1; then
    bootstrap_ok=1
    break
  fi
  sleep 1
done

if [ "$bootstrap_ok" -ne 1 ]; then
  echo "ERROR: launchctl bootstrap failed for ${LABEL}" >&2
  exit 1
fi

launchctl kickstart -k "gui/${USER_UID}/${LABEL}"

echo "Installed LaunchAgent: $PLIST_PATH"
echo "Launch source: $RUNTIME_DIR"
