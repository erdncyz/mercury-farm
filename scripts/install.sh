#!/usr/bin/env bash

set -euo pipefail

REPOSITORY="${MERCURY_REPOSITORY:-erdncyz/mercury-farm}"
INSTALL_ROOT="${MERCURY_HOME:-$HOME/.mercury-farm}"
RELEASE_ASSET="mercury-farm-macos.tar.gz"
REQUESTED_VERSION="${MERCURY_VERSION:-latest}"
START_AFTER_INSTALL=0
INSTALL_IOS=1
TEMP_DIR=""
DIRECT_TRANSACTION=0
INSTALL_COMPLETE=0
DIRECT_MARKER=""
DIRECT_CONFIG_BACKUP=""
DIRECT_PREVIOUS_PROJECT=""
DIRECT_STACK_CHANGED=0

atomic_select_release() {
  local release_dir="$1"

  rm -f "${INSTALL_ROOT}/current.install-rollback"
  ln -s "$release_dir" "${INSTALL_ROOT}/current.install-rollback"
  mv -h -f "${INSTALL_ROOT}/current.install-rollback" "${INSTALL_ROOT}/current"
}

cleanup_installer() {
  local exit_code=$?
  local recovery_ok=1
  local restore_file

  trap - EXIT HUP INT TERM

  if [[ "$DIRECT_TRANSACTION" -eq 1 && "$INSTALL_COMPLETE" -ne 1 ]]; then
    echo "Installation failed; restoring the previous Mercury release." >&2

    if [[ -f "$DIRECT_CONFIG_BACKUP" ]]; then
      restore_file="$(mktemp "${INSTALL_ROOT}/config/.variables.env.install-rollback.XXXXXX")"
      cp "$DIRECT_CONFIG_BACKUP" "$restore_file"
      mv "$restore_file" "${INSTALL_ROOT}/config/variables.env"
    fi

    if [[ -d "$DIRECT_PREVIOUS_PROJECT" ]]; then
      atomic_select_release "$DIRECT_PREVIOUS_PROJECT"
    fi

    if [[ "$DIRECT_STACK_CHANGED" -eq 1 && -d "$DIRECT_PREVIOUS_PROJECT" ]]; then
      if ! MERCURY_UPDATE_ACTIVE=1 \
        /bin/bash "${DIRECT_PREVIOUS_PROJECT}/scripts/mercuryctl.sh" up; then
        echo "Previous release was selected, but its Docker stack could not be refreshed." >&2
        recovery_ok=0
      fi
    fi
  fi

  if [[ "$DIRECT_TRANSACTION" -eq 1 && "$recovery_ok" -eq 1 ]]; then
    rm -f "$DIRECT_MARKER" "$DIRECT_CONFIG_BACKUP"
  fi

  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi

  exit "$exit_code"
}

usage() {
  cat <<'EOF'
Install Mercury from a checksum-verified GitHub Release bundle.

Usage:
  install.sh [--version vX.Y.Z] [--android-only] [--start]

Options:
  --version vX.Y.Z  Install or roll back to an exact release (default: latest)
  --android-only    Skip host dependencies used only by the iOS provider
  --start           Pull images and start Mercury after installation
  -h, --help        Show this help

Environment:
  MERCURY_HOME        Installation directory (default: ~/.mercury-farm)
  MERCURY_REPOSITORY  GitHub owner/repository (default: erdncyz/mercury-farm)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      [[ $# -ge 2 ]] || { echo "Missing value for --version" >&2; exit 2; }
      REQUESTED_VERSION="$2"
      shift 2
      ;;
    --start)
      START_AFTER_INSTALL=1
      shift
      ;;
    --android-only)
      INSTALL_IOS=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Mercury's release installer currently supports macOS only." >&2
  exit 1
fi

if [[ "$INSTALL_ROOT" != /* ]]; then
  INSTALL_ROOT="${PWD}/${INSTALL_ROOT}"
fi
mkdir -p "$INSTALL_ROOT"
INSTALL_ROOT="$(cd "$INSTALL_ROOT" && pwd -P)"

if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" ]]; then
  exec 9>"${INSTALL_ROOT}/.update.lock"
  set +e
  /usr/bin/lockf -t 0 9
  lock_exit=$?
  set -e

  if [[ "$lock_exit" -ne 0 ]]; then
    echo "Another Mercury install or update is already running." >&2
    exit "$lock_exit"
  fi
fi

missing_commands=()
required_commands=(curl tar shasum docker uuidgen)
if [[ "$INSTALL_IOS" -eq 1 ]]; then
  required_commands+=(node npm)
fi

for command_name in "${required_commands[@]}"; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    missing_commands+=("$command_name")
  fi
done

if [[ ${#missing_commands[@]} -gt 0 ]]; then
  echo "Missing required commands: ${missing_commands[*]}" >&2
  echo "See https://github.com/${REPOSITORY}/blob/main/docs/getting-started.md" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required. Install and open Docker Desktop first." >&2
  exit 1
fi

if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" && \
  -f "${INSTALL_ROOT}/.update-in-progress" && \
  -f "${INSTALL_ROOT}/current/scripts/mercuryctl.sh" ]]; then
  MERCURY_HOME="$INSTALL_ROOT" MERCURY_UPDATE_LOCK_HELD=1 \
    /bin/bash "${INSTALL_ROOT}/current/scripts/mercuryctl.sh" help >/dev/null
fi

if [[ "$REQUESTED_VERSION" != "latest" ]]; then
  REQUESTED_VERSION="v${REQUESTED_VERSION#v}"
  if [[ ! "$REQUESTED_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must be in vX.Y.Z format, got: $REQUESTED_VERSION" >&2
    exit 2
  fi
fi

if [[ -n "${MERCURY_DOWNLOAD_BASE:-}" ]]; then
  DOWNLOAD_BASE="${MERCURY_DOWNLOAD_BASE%/}"
elif [[ "$REQUESTED_VERSION" != "latest" ]]; then
  DOWNLOAD_BASE="https://github.com/${REPOSITORY}/releases/download/${REQUESTED_VERSION}"
else
  DOWNLOAD_BASE="https://github.com/${REPOSITORY}/releases/latest/download"
fi

TEMP_DIR="$(mktemp -d)"
trap 'exit 130' HUP INT TERM
trap 'cleanup_installer' EXIT

echo "Downloading Mercury ${REQUESTED_VERSION}..."
download_release_assets() {
  rm -f \
    "${TEMP_DIR}/${RELEASE_ASSET}" \
    "${TEMP_DIR}/${RELEASE_ASSET}.part" \
    "${TEMP_DIR}/${RELEASE_ASSET}.sha256" \
    "${TEMP_DIR}/${RELEASE_ASSET}.sha256.part"

  if ! curl --fail --location --silent --show-error --connect-timeout 15 \
    "${DOWNLOAD_BASE}/${RELEASE_ASSET}" \
    --output "${TEMP_DIR}/${RELEASE_ASSET}.part"; then
    return 1
  fi
  mv "${TEMP_DIR}/${RELEASE_ASSET}.part" "${TEMP_DIR}/${RELEASE_ASSET}"

  if ! curl --fail --location --silent --show-error --connect-timeout 15 \
    "${DOWNLOAD_BASE}/${RELEASE_ASSET}.sha256" \
    --output "${TEMP_DIR}/${RELEASE_ASSET}.sha256.part"; then
    return 1
  fi
  mv \
    "${TEMP_DIR}/${RELEASE_ASSET}.sha256.part" \
    "${TEMP_DIR}/${RELEASE_ASSET}.sha256"

  (
    cd "$TEMP_DIR"
    shasum -a 256 -c "${RELEASE_ASSET}.sha256"
  )
}

download_complete=0
for attempt in 1 2 3; do
  if download_release_assets; then
    download_complete=1
    break
  fi

  if [[ "$attempt" -lt 3 ]]; then
    echo "Release download failed; retrying (${attempt}/3)..." >&2
    sleep 2
  fi
done

if [[ "$download_complete" -ne 1 ]]; then
  echo "Could not download and verify the Mercury release after 3 attempts." >&2
  exit 1
fi

if tar -tzf "${TEMP_DIR}/${RELEASE_ASSET}" \
  | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then
  echo "The release bundle contains an unsafe path." >&2
  exit 1
fi

if tar -tzf "${TEMP_DIR}/${RELEASE_ASSET}" | grep -Ev '^mercury-farm(/|$)' >/dev/null; then
  echo "The release bundle contains files outside mercury-farm/." >&2
  exit 1
fi

tar -xzf "${TEMP_DIR}/${RELEASE_ASSET}" -C "$TEMP_DIR"
BUNDLE_DIR="${TEMP_DIR}/mercury-farm"
VERSION_FILE="${BUNDLE_DIR}/.release-version"
IMAGE_REFERENCE_FILE="${BUNDLE_DIR}/.image-reference"

if [[ ! -f "$VERSION_FILE" || ! -f "$IMAGE_REFERENCE_FILE" || \
  ! -f "${BUNDLE_DIR}/docker-compose-macos.yaml" ]]; then
  echo "The release bundle is incomplete." >&2
  exit 1
fi

RELEASE_TAG="$(tr -d '[:space:]' < "$VERSION_FILE")"
if [[ ! "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "The release bundle contains an invalid version: $RELEASE_TAG" >&2
  exit 1
fi

IMAGE_REFERENCE="$(tr -d '[:space:]' < "$IMAGE_REFERENCE_FILE")"
EXPECTED_IMAGE="ghcr.io/${REPOSITORY}@sha256:"
if [[ "$IMAGE_REFERENCE" != "$EXPECTED_IMAGE"* ]] || \
  [[ ! "${IMAGE_REFERENCE#"${EXPECTED_IMAGE}"}" =~ ^[a-f0-9]{64}$ ]]; then
  echo "The release bundle contains an invalid image reference." >&2
  exit 1
fi

if [[ "$REQUESTED_VERSION" != "latest" && "$RELEASE_TAG" != "$REQUESTED_VERSION" ]]; then
  echo "Requested $REQUESTED_VERSION but downloaded $RELEASE_TAG." >&2
  exit 1
fi

RELEASES_DIR="${INSTALL_ROOT}/releases"
CONFIG_DIR="${INSTALL_ROOT}/config"
CONFIG_FILE="${CONFIG_DIR}/variables.env"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_TAG}"

mkdir -p "$RELEASES_DIR" "$CONFIG_DIR"

if [[ -e "${INSTALL_ROOT}/current" && ! -L "${INSTALL_ROOT}/current" ]]; then
  echo "Refusing to replace non-symlink path: ${INSTALL_ROOT}/current" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  if [[ -L "${INSTALL_ROOT}/current" && -f "${INSTALL_ROOT}/current/scripts/variables.env" ]]; then
    cp "${INSTALL_ROOT}/current/scripts/variables.env" "$CONFIG_FILE"
  else
    cp "${BUNDLE_DIR}/scripts/variables.env" "$CONFIG_FILE"
  fi
fi

DIRECT_MARKER="${INSTALL_ROOT}/.update-in-progress"
DIRECT_CONFIG_BACKUP="${CONFIG_DIR}/variables.env.update-backup"
if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" && \
  -L "${INSTALL_ROOT}/current" && ! -f "$DIRECT_MARKER" ]]; then
  DIRECT_PREVIOUS_PROJECT="$(cd "${INSTALL_ROOT}/current" && pwd -P)"
  backup_temp="$(mktemp "${CONFIG_DIR}/.variables.env.install-backup.XXXXXX")"
  cp "$CONFIG_FILE" "$backup_temp"
  mv "$backup_temp" "$DIRECT_CONFIG_BACKUP"

  marker_temp="$(mktemp "${INSTALL_ROOT}/.update-in-progress.XXXXXX")"
  printf '%s\n0\n' "$DIRECT_PREVIOUS_PROJECT" > "$marker_temp"
  mv "$marker_temp" "$DIRECT_MARKER"
  DIRECT_TRANSACTION=1
fi

while IFS= read -r default_line; do
  if [[ "$default_line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
    default_key="${BASH_REMATCH[1]}"
    if ! grep -q "^${default_key}=" "$CONFIG_FILE"; then
      printf '%s\n' "$default_line" >> "$CONFIG_FILE"
    fi
  fi
done < "${BUNDLE_DIR}/scripts/variables.env"

upsert_env() {
  local key="$1"
  local value="$2"
  local file="$3"
  local temp_file

  temp_file="$(mktemp "$(dirname "$file")/.variables.env.XXXXXX")"
  awk -F= -v key="$key" -v value="$value" '
    BEGIN { updated=0 }
    $1 == key { print key "=" value; updated=1; next }
    { print }
    END { if (!updated) print key "=" value }
  ' "$file" > "$temp_file"
  mv "$temp_file" "$file"
}

if [[ ! -f "${RELEASE_DIR}/.release-files-installed" ]]; then
  rm -rf "$RELEASE_DIR"
  mv "$BUNDLE_DIR" "$RELEASE_DIR"
  touch "${RELEASE_DIR}/.release-files-installed"
else
  echo "Mercury ${RELEASE_TAG} release files are already installed."
fi

rm -f "${RELEASE_DIR}/scripts/variables.env"
ln -s "$CONFIG_FILE" "${RELEASE_DIR}/scripts/variables.env"

if [[ "$INSTALL_IOS" -eq 1 && ! -f "${RELEASE_DIR}/.ios-dependencies-installed" ]]; then
  echo "Installing host dependencies for the iOS provider..."
  (
    cd "$RELEASE_DIR"
    npm ci --omit=dev --no-audit --no-fund
  )
  touch "${RELEASE_DIR}/.ios-dependencies-installed"
fi

upsert_env "MERCURY_IMAGE" "$IMAGE_REFERENCE" "$CONFIG_FILE"

if grep -q '^MERCURY_SECRET=nosecret$' "$CONFIG_FILE"; then
  upsert_env "MERCURY_SECRET" "$(uuidgen | tr -d '-')$(uuidgen | tr -d '-')" "$CONFIG_FILE"
fi

rm -f "${INSTALL_ROOT}/current.next"
ln -s "$RELEASE_DIR" "${INSTALL_ROOT}/current.next"
mv -h -f "${INSTALL_ROOT}/current.next" "${INSTALL_ROOT}/current"

launcher_temp="$(mktemp "${INSTALL_ROOT}/.mercury-launcher.XXXXXX")"
cat > "$launcher_temp" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
INSTALL_ROOT="$(cd "$(dirname "$0")" && pwd)"
export MERCURY_HOME="$INSTALL_ROOT"
exec "${INSTALL_ROOT}/current/scripts/mercuryctl.sh" "$@"
EOF
chmod +x "$launcher_temp"
mv "$launcher_temp" "${INSTALL_ROOT}/mercury"

echo "Mercury ${RELEASE_TAG} installed in ${INSTALL_ROOT}."

if [[ "$START_AFTER_INSTALL" -eq 1 ]]; then
  DIRECT_STACK_CHANGED=1
  MERCURY_UPDATE_ACTIVE=1 "${INSTALL_ROOT}/mercury" up
else
  echo "Start it with: ${INSTALL_ROOT}/mercury up"
fi

INSTALL_COMPLETE=1
if [[ "$DIRECT_TRANSACTION" -eq 1 ]]; then
  rm -f "$DIRECT_MARKER" "$DIRECT_CONFIG_BACKUP"
fi