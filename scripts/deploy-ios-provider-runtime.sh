#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$HOME/.mercury-farm-runtime"
STAGING_DIR="$(mktemp -d "${RUNTIME_DIR}.new.XXXXXX")"
BACKUP_DIR="${RUNTIME_DIR}.previous"
LABEL="com.mercury.ios-provider"
USER_UID="$(id -u)"
OLD_RUNTIME_MOVED=0
NEW_RUNTIME_MOVED=0
DEPLOYMENT_COMPLETE=0
AGENT_STOPPED=0

restore_previous_runtime() {
  launchctl bootout "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true

  if [ "$NEW_RUNTIME_MOVED" -eq 1 ]; then
    rm -rf "$RUNTIME_DIR"
  fi

  if [ "$OLD_RUNTIME_MOVED" -eq 1 ] && [ -d "$BACKUP_DIR" ]; then
    mv "$BACKUP_DIR" "$RUNTIME_DIR"
    /bin/bash "$RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh" || true
  elif [ -d "$RUNTIME_DIR" ]; then
    /bin/bash "$RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh" || true
  fi
}

cleanup() {
  exit_code=$?
  trap - EXIT HUP INT TERM

  if [ -n "${STAGING_DIR:-}" ] && [ -d "$STAGING_DIR" ]; then
    rm -rf "$STAGING_DIR"
  fi

  if [ "$DEPLOYMENT_COMPLETE" -ne 1 ] && [ "$AGENT_STOPPED" -eq 1 ]; then
    echo "Restoring the previous iOS provider runtime." >&2
    restore_previous_runtime
  fi

  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

wait_for_launchagent() {
  stable_checks=0

  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    launch_state="$(launchctl print "gui/${USER_UID}/${LABEL}" 2>/dev/null || true)"

    if grep -q 'state = running' <<< "$launch_state"; then
      stable_checks=$((stable_checks + 1))
      if [ "$stable_checks" -ge 10 ]; then
        return 0
      fi
    else
      stable_checks=0
    fi

    sleep 1
  done

  return 1
}

if [ -f "$PROJECT_DIR/scripts/auto-configure-network.sh" ]; then
  echo "Auto-configuring MERCURY_DOMAIN from LAN IP..."
  /bin/bash "$PROJECT_DIR/scripts/auto-configure-network.sh"
fi

echo "Staging iOS provider runtime..."
rsync -a --delete \
  --no-times \
  --omit-dir-times \
  --no-perms \
  --no-owner \
  --no-group \
  --exclude ".git" \
  --exclude "WebDriverAgent" \
  --exclude "node_modules" \
  --exclude "ios-provider.log" \
  --exclude "ios-provider.launchd.out.log" \
  --exclude "ios-provider.launchd.err.log" \
  "$PROJECT_DIR/" "$STAGING_DIR/"

# Copy WDA separately with source timestamps intact. Re-stamping every source
# file makes Xcode invalidate DerivedData and fully rebuild WDA on each deploy.
WDA_PBXPROJ="WebDriverAgent/WebDriverAgent.xcodeproj/project.pbxproj"
if [ -f "$PROJECT_DIR/$WDA_PBXPROJ" ]; then
  rsync -a --delete \
    --no-perms \
    --no-owner \
    --no-group \
    --exclude ".git" \
    "$PROJECT_DIR/WebDriverAgent/" "$STAGING_DIR/WebDriverAgent/"
elif [ -f "$RUNTIME_DIR/$WDA_PBXPROJ" ]; then
  echo "WARNING: WebDriverAgent sources are missing in $PROJECT_DIR." >&2
  echo "Preserving the existing WebDriverAgent from $RUNTIME_DIR." >&2
  rsync -a \
    --no-perms \
    --no-owner \
    --no-group \
    --exclude ".git" \
    "$RUNTIME_DIR/WebDriverAgent/" "$STAGING_DIR/WebDriverAgent/"
else
  echo "ERROR: WebDriverAgent sources not found in $PROJECT_DIR/WebDriverAgent." >&2
  echo "Update Mercury to restore them: ~/.mercury-farm/mercury update" >&2
  echo "Or restore manually:" >&2
  echo "  git clone --depth 1 --branch v16.9.0 https://github.com/appium/WebDriverAgent.git \"$PROJECT_DIR/WebDriverAgent\"" >&2
  exit 1
fi

echo "Installing iOS provider runtime dependencies..."
(
  cd "$STAGING_DIR"
  npm ci --omit=dev --no-audit --no-fund
)

if [ ! -f "$STAGING_DIR/scripts/install-ios-provider-launchagent.sh" ]; then
  echo "ERROR: Missing installer script in staged runtime." >&2
  exit 1
fi

AGENT_STOPPED=1
launchctl bootout "gui/${USER_UID}/${LABEL}" >/dev/null 2>&1 || true
rm -rf "$BACKUP_DIR"
if [ -d "$RUNTIME_DIR" ]; then
  OLD_RUNTIME_MOVED=1
  mv "$RUNTIME_DIR" "$BACKUP_DIR"
fi
NEW_RUNTIME_MOVED=1
mv "$STAGING_DIR" "$RUNTIME_DIR"
STAGING_DIR=""

for log_name in ios-provider.log ios-provider.launchd.out.log ios-provider.launchd.err.log; do
  if [ -f "$BACKUP_DIR/$log_name" ]; then
    cp "$BACKUP_DIR/$log_name" "$RUNTIME_DIR/$log_name"
  fi
done

echo "Installing LaunchAgent (runtime-only source)..."
if ! /bin/bash "$RUNTIME_DIR/scripts/install-ios-provider-launchagent.sh"; then
  echo "ERROR: New iOS provider failed to start." >&2
  exit 1
fi

if ! wait_for_launchagent; then
  echo "ERROR: New iOS provider did not remain running." >&2
  exit 1
fi

DEPLOYMENT_COMPLETE=1
rm -rf "$BACKUP_DIR"

echo "Done."
echo "Workspace: $PROJECT_DIR"
echo "Runtime: $RUNTIME_DIR"
echo "Launch source: runtime (single source of truth)"
