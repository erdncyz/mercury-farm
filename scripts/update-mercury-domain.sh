#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-scripts/variables.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "File not found: $ENV_FILE" >&2
  exit 1
fi

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

IP="$(get_lan_ip || true)"
if [[ -z "${IP:-}" ]]; then
  echo "Could not determine LAN IP; keeping current MERCURY_DOMAIN." >&2
  exit 0
fi

TARGET_FILE="$ENV_FILE"
if [[ -L "$ENV_FILE" ]]; then
  TARGET_FILE="$(readlink "$ENV_FILE")"
  if [[ "$TARGET_FILE" != /* ]]; then
    TARGET_FILE="$(cd "$(dirname "$ENV_FILE")" && pwd)/$TARGET_FILE"
  fi
fi

tmp_file="$(mktemp "$(dirname "$TARGET_FILE")/.variables.env.XXXXXX")"
awk -v ip="$IP" '
  BEGIN {updated=0}
  /^MERCURY_DOMAIN=/ {print "MERCURY_DOMAIN=" ip; updated=1; next}
  {print}
  END {if (!updated) print "MERCURY_DOMAIN=" ip}
' "$TARGET_FILE" > "$tmp_file"
mv "$tmp_file" "$TARGET_FILE"

echo "Updated MERCURY_DOMAIN=$IP in $ENV_FILE"
