#!/bin/bash
# Mercury iOS Provider - Host-native launcher
# This must run on the Mac host (not inside Docker) because it needs Xcode tools.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Keep MERCURY_DOMAIN aligned with current LAN IP unless manual mode is enabled.
if [ -f "$PROJECT_DIR/scripts/auto-configure-network.sh" ]; then
  /bin/bash "$PROJECT_DIR/scripts/auto-configure-network.sh" >/dev/null || true
fi

# Load shared env files if present so iOS provider uses the same values as Docker services.
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$PROJECT_DIR/.env"
  set +a
fi

if [ -f "$PROJECT_DIR/scripts/variables.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$PROJECT_DIR/scripts/variables.env"
  set +a
fi

export MERCURY_SECRET="${MERCURY_SECRET:-nosecret}"
export MERCURY_DOMAIN="${MERCURY_DOMAIN:-localhost}"
export MERCURY_PORT="${MERCURY_PORT:-443}"
export IOS_DISABLE_ESP32="${IOS_DISABLE_ESP32:-1}"
export IOS_TOUCH_ACTION_TIMEOUT_MS="${IOS_TOUCH_ACTION_TIMEOUT_MS:-20000}"
export IOS_WDA_REQUEST_TIMEOUT_MS="${IOS_WDA_REQUEST_TIMEOUT_MS:-12000}"
export IOS_WDA_SESSION_TIMEOUT_MS="${IOS_WDA_SESSION_TIMEOUT_MS:-20000}"
export IOS_TYPE_KEY_DELAY_MS="${IOS_TYPE_KEY_DELAY_MS:-80}"
export IOS_WDA_MJPEG_QUALITY="${IOS_WDA_MJPEG_QUALITY:-5}"
export IOS_WDA_MJPEG_SCALING="${IOS_WDA_MJPEG_SCALING:-50}"
export IOS_WDA_LEAN_MODE="${IOS_WDA_LEAN_MODE:-1}"
export IOS_WDA_TREE_CACHE_MS="${IOS_WDA_TREE_CACHE_MS:-500}"
export IOS_WDA_WAIT_FOR_IDLE_TIMEOUT="${IOS_WDA_WAIT_FOR_IDLE_TIMEOUT:-0.5}"
export IOS_WDA_ANIMATION_COOLOFF_TIMEOUT="${IOS_WDA_ANIMATION_COOLOFF_TIMEOUT:-0.0}"
export IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES="${IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES:-type,label,name,enabled,visible,rect}"
export IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD="${IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD:-3}"
export IOS_TOUCH_RECOVERY_COOLDOWN_MS="${IOS_TOUCH_RECOVERY_COOLDOWN_MS:-12000}"
export MONGODB_PORT_27017_TCP="mongodb://127.0.0.1:27017"
export MONGODB_PORT_27017_TCP_ADDR="127.0.0.1"

# Optional sharding: each shard uses a different block to avoid port overlap.
# Set IOS_PROVIDER_SHARD=0,1,2...
IOS_PROVIDER_SHARD="${IOS_PROVIDER_SHARD:-0}"
IOS_PORT_STRIDE="${IOS_PORT_STRIDE:-1000}"

# Provider identity
IOS_PROVIDER_NAME="${IOS_PROVIDER_NAME:-mercury-ios-provider}"

# Base ranges (max is exclusive on mercury side).
IOS_PORT_RANGE_MIN="${IOS_PORT_RANGE_MIN:-28100}"
IOS_PORT_RANGE_MAX="${IOS_PORT_RANGE_MAX:-28300}"
IOS_WDA_RANGE_MIN="${IOS_WDA_RANGE_MIN:-28300}"
IOS_WDA_RANGE_MAX="${IOS_WDA_RANGE_MAX:-28500}"
IOS_SCREEN_WS_RANGE_MIN="${IOS_SCREEN_WS_RANGE_MIN:-28500}"
IOS_SCREEN_WS_RANGE_MAX="${IOS_SCREEN_WS_RANGE_MAX:-28700}"

if ! [[ "$IOS_PROVIDER_SHARD" =~ ^[0-9]+$ ]]; then
  echo "ERROR: IOS_PROVIDER_SHARD must be a non-negative integer. Got: $IOS_PROVIDER_SHARD" >&2
  exit 1
fi

if ! [[ "$IOS_PORT_STRIDE" =~ ^[0-9]+$ ]] || [ "$IOS_PORT_STRIDE" -le 0 ]; then
  echo "ERROR: IOS_PORT_STRIDE must be a positive integer. Got: $IOS_PORT_STRIDE" >&2
  exit 1
fi

SHARD_OFFSET=$((IOS_PROVIDER_SHARD * IOS_PORT_STRIDE))

if [ "$IOS_PROVIDER_SHARD" -gt 0 ] && [ "$IOS_PROVIDER_NAME" = "mercury-ios-provider" ]; then
  IOS_PROVIDER_NAME="mercury-ios-provider-${IOS_PROVIDER_SHARD}"
fi

IOS_EFFECTIVE_PORT_RANGE_MIN=$((IOS_PORT_RANGE_MIN + SHARD_OFFSET))
IOS_EFFECTIVE_PORT_RANGE_MAX=$((IOS_PORT_RANGE_MAX + SHARD_OFFSET))
IOS_EFFECTIVE_WDA_RANGE_MIN=$((IOS_WDA_RANGE_MIN + SHARD_OFFSET))
IOS_EFFECTIVE_WDA_RANGE_MAX=$((IOS_WDA_RANGE_MAX + SHARD_OFFSET))
IOS_EFFECTIVE_SCREEN_WS_RANGE_MIN=$((IOS_SCREEN_WS_RANGE_MIN + SHARD_OFFSET))
IOS_EFFECTIVE_SCREEN_WS_RANGE_MAX=$((IOS_SCREEN_WS_RANGE_MAX + SHARD_OFFSET))

cd "$PROJECT_DIR"

# 1 => Simulators enabled
# 0 => Physical-only mode (default for stability)
ALLOW_SIMULATORS="${IOS_ALLOW_SIMULATORS:-0}"

# Physical device filter only applies in physical-only mode.
IOS_SERIAL_ARGS=()
if [ "$ALLOW_SIMULATORS" = "0" ]; then
  if [ -n "${IOS_SERIALS:-}" ]; then
    IFS=',' read -r -a IOS_SERIAL_ARGS <<< "$IOS_SERIALS"
  elif command -v idevice_id >/dev/null 2>&1; then
    while IFS= read -r serial; do
      [ -n "$serial" ] && IOS_SERIAL_ARGS+=("$serial")
    done < <(idevice_id -l 2>/dev/null || true)
  fi
fi

echo "Cleaning up old WebDriverAgent processes..."
pkill -f WebDriverAgentRunner || true

echo "Starting Mercury iOS Provider..."
echo "  Provider: ${IOS_PROVIDER_NAME}"
echo "  Shard: ${IOS_PROVIDER_SHARD} (offset: ${SHARD_OFFSET})"
echo "  Domain: ${MERCURY_DOMAIN}:${MERCURY_PORT}"
echo "  Simulators: ${ALLOW_SIMULATORS}"
echo "  Touch watchdog timeout: ${IOS_TOUCH_ACTION_TIMEOUT_MS}ms"
echo "  WDA request timeout: ${IOS_WDA_REQUEST_TIMEOUT_MS}ms"
echo "  WDA session timeout: ${IOS_WDA_SESSION_TIMEOUT_MS}ms"
echo "  Type key delay: ${IOS_TYPE_KEY_DELAY_MS}ms"
echo "  WDA MJPEG quality: ${IOS_WDA_MJPEG_QUALITY}"
echo "  WDA MJPEG scaling: ${IOS_WDA_MJPEG_SCALING}%"
echo "  WDA lean mode: ${IOS_WDA_LEAN_MODE}"
echo "  WDA tree cache: ${IOS_WDA_TREE_CACHE_MS}ms"
echo "  WDA waitForIdleTimeout: ${IOS_WDA_WAIT_FOR_IDLE_TIMEOUT}s"
echo "  WDA animationCoolOffTimeout: ${IOS_WDA_ANIMATION_COOLOFF_TIMEOUT}s"
echo "  WDA element attrs: ${IOS_WDA_ELEMENT_RESPONSE_ATTRIBUTES}"
echo "  Action timeout recovery threshold: ${IOS_ACTION_TIMEOUT_RECOVERY_THRESHOLD}"
echo "  Touch recovery cooldown: ${IOS_TOUCH_RECOVERY_COOLDOWN_MS}ms"
echo "  Port ranges:"
echo "    port-range: ${IOS_EFFECTIVE_PORT_RANGE_MIN}-${IOS_EFFECTIVE_PORT_RANGE_MAX}"
echo "    wda-range: ${IOS_EFFECTIVE_WDA_RANGE_MIN}-${IOS_EFFECTIVE_WDA_RANGE_MAX}"
echo "    screen-ws-range: ${IOS_EFFECTIVE_SCREEN_WS_RANGE_MIN}-${IOS_EFFECTIVE_SCREEN_WS_RANGE_MAX}"

ios_provider_args=(
  ./node_modules/.bin/tsx ./bin/mercury.mjs ios-provider
  --provider "${IOS_PROVIDER_NAME}"
  --public-ip "$MERCURY_DOMAIN"
  --port-range-min "${IOS_EFFECTIVE_PORT_RANGE_MIN}"
  --port-range-max "${IOS_EFFECTIVE_PORT_RANGE_MAX}"
  --wda-range-min "${IOS_EFFECTIVE_WDA_RANGE_MIN}"
  --wda-range-max "${IOS_EFFECTIVE_WDA_RANGE_MAX}"
  --screen-ws-range-min "${IOS_EFFECTIVE_SCREEN_WS_RANGE_MIN}"
  --screen-ws-range-max "${IOS_EFFECTIVE_SCREEN_WS_RANGE_MAX}"
  --connect-sub tcp://127.0.0.1:7250
  --connect-push tcp://127.0.0.1:7270
  --storage-url http://localhost:7100/
  --screen-jpeg-quality "${SCREEN_JPEG_QUALITY:-15}"
  --screen-frame-rate "${SCREEN_FRAME_RATE:-15}"
  --screen-ping-interval 60000
  --screen-ws-url-pattern "wss://${MERCURY_DOMAIN}:${MERCURY_PORT}/d/${IOS_PROVIDER_NAME}/<%= publicPort %>/"
  --host 0.0.0.0
  --secret "$MERCURY_SECRET"
)

if [ "$ALLOW_SIMULATORS" = "1" ]; then
  ios_provider_args+=(--allow-simulators)
fi

ios_provider_args+=("${IOS_SERIAL_ARGS[@]}")

exec "${ios_provider_args[@]}"
