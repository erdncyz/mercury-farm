#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VARS_FILE="$PROJECT_DIR/scripts/variables.env"
DOTENV_FILE="$PROJECT_DIR/.env"

read_mode() {
  local mode=""

  if [[ -f "$DOTENV_FILE" ]]; then
    mode="$(awk -F= '/^STF_DOMAIN_MODE=/{print $2; exit}' "$DOTENV_FILE" | tr -d '[:space:]' || true)"
  fi

  if [[ -z "$mode" && -f "$VARS_FILE" ]]; then
    mode="$(awk -F= '/^STF_DOMAIN_MODE=/{print $2; exit}' "$VARS_FILE" | tr -d '[:space:]' || true)"
  fi

  if [[ -z "$mode" ]]; then
    mode="auto"
  fi

  echo "$mode"
}

get_lan_ip() {
  local ip=""
  local iface

  for iface in en0 en1 en2; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  done

  iface="$(route -n get default 2>/dev/null | awk '/interface:/{print $2; exit}')"
  if [[ -n "$iface" ]]; then
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  fi

  ip="$(ifconfig | awk '/inet / && $2!="127.0.0.1" {print $2; exit}')"
  if [[ -n "$ip" ]]; then
    echo "$ip"
    return 0
  fi

  return 1
}

update_domain_in_file() {
  local file="$1"
  local ip="$2"

  [[ -f "$file" ]] || return 0

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v ip="$ip" '
    BEGIN {updated=0}
    /^STF_DOMAIN=/ {print "STF_DOMAIN=" ip; updated=1; next}
    {print}
    END {if (!updated) print "STF_DOMAIN=" ip}
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
}

MODE="$(read_mode)"
if [[ "$MODE" == "manual" ]]; then
  exit 0
fi

LAN_IP="$(get_lan_ip || true)"
if [[ -z "$LAN_IP" ]]; then
  echo "Could not determine LAN IP; keeping current STF_DOMAIN." >&2
  exit 0
fi

update_domain_in_file "$VARS_FILE" "$LAN_IP"
update_domain_in_file "$DOTENV_FILE" "$LAN_IP"

echo "Auto-configured STF_DOMAIN=$LAN_IP"
