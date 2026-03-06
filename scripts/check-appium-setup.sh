#!/usr/bin/env bash
set -euo pipefail

# Quick health-check for Appium + Android/iOS prerequisites on macOS.
# Usage:
#   ./scripts/check-appium-setup.sh
#   ./scripts/check-appium-setup.sh --require-devices

REQUIRE_DEVICES=0
if [[ "${1:-}" == "--require-devices" ]]; then
  REQUIRE_DEVICES=1
fi

FAILS=0
WARNS=0

ok() {
  printf "[OK] %s\n" "$1"
}

warn() {
  printf "[WARN] %s\n" "$1"
  WARNS=$((WARNS + 1))
}

fail() {
  printf "[FAIL] %s\n" "$1"
  FAILS=$((FAILS + 1))
}

check_cmd() {
  local cmd="$1"
  local install_hint="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd is installed"
    return 0
  fi
  fail "$cmd is missing. Install: $install_hint"
  return 1
}

check_cmd node "brew install node" || true
check_cmd npm "brew install node" || true
check_cmd appium "npm install -g appium" || true
check_cmd adb "brew install --cask android-platform-tools" || true
check_cmd java "brew install --cask temurin" || true
check_cmd xcodebuild "xcode-select --install" || true
check_cmd idevice_id "brew install libimobiledevice usbmuxd" || true

if command -v appium >/dev/null 2>&1; then
  if APP_VER="$(appium -v 2>/dev/null)"; then
    ok "appium version: $APP_VER"
  else
    fail "appium exists but version check failed"
  fi

  if DRIVER_LIST="$(appium driver list --installed 2>/dev/null)"; then
    if printf "%s" "$DRIVER_LIST" | grep -q "uiautomator2"; then
      ok "Appium driver uiautomator2 is installed"
    else
      fail "Appium driver uiautomator2 is missing. Install: appium driver install uiautomator2"
    fi

    if printf "%s" "$DRIVER_LIST" | grep -q "xcuitest"; then
      ok "Appium driver xcuitest is installed"
    else
      fail "Appium driver xcuitest is missing. Install: appium driver install xcuitest"
    fi
  else
    fail "Could not query installed Appium drivers"
  fi
fi

if command -v adb >/dev/null 2>&1; then
  if ADB_OUT="$(adb devices 2>/dev/null)"; then
    ok "adb is reachable"
    if [[ "$REQUIRE_DEVICES" -eq 1 ]]; then
      ANDROID_COUNT="$(printf "%s\n" "$ADB_OUT" | awk 'NR>1 && $2=="device" {count++} END {print count+0}')"
      if [[ "$ANDROID_COUNT" -gt 0 ]]; then
        ok "Android devices connected: $ANDROID_COUNT"
      else
        fail "No Android devices in 'device' state"
      fi
    else
      ANDROID_COUNT="$(printf "%s\n" "$ADB_OUT" | awk 'NR>1 && $2=="device" {count++} END {print count+0}')"
      if [[ "$ANDROID_COUNT" -gt 0 ]]; then
        ok "Android devices connected: $ANDROID_COUNT"
      else
        warn "No Android devices connected (optional unless --require-devices)"
      fi
    fi
  else
    fail "adb command failed. Try: adb kill-server && adb start-server"
  fi
fi

if command -v idevice_id >/dev/null 2>&1; then
  IOS_LIST="$(idevice_id -l 2>/dev/null || true)"
  IOS_COUNT="$(printf "%s\n" "$IOS_LIST" | awk 'NF{count++} END {print count+0}')"
  if [[ "$REQUIRE_DEVICES" -eq 1 ]]; then
    if [[ "$IOS_COUNT" -gt 0 ]]; then
      ok "iOS devices connected: $IOS_COUNT"
    else
      fail "No iOS devices detected by idevice_id -l"
    fi
  else
    if [[ "$IOS_COUNT" -gt 0 ]]; then
      ok "iOS devices connected: $IOS_COUNT"
    else
      warn "No iOS devices connected (optional unless --require-devices)"
    fi
  fi
fi

echo
echo "Summary: $FAILS fail(s), $WARNS warning(s)"

if [[ "$FAILS" -gt 0 ]]; then
  exit 1
fi

exit 0
