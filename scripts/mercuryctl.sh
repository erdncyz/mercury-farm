#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose-macos.yaml"
ENV_FILE="${PROJECT_DIR}/scripts/variables.env"
REPOSITORY="${MERCURY_REPOSITORY:-erdncyz/mercury-farm}"
UPDATE_TEMP_INSTALLER=""
UPDATE_CONFIG_BACKUP=""
UPDATE_MARKER=""
UPDATE_LOCK=""
UPDATE_OLD_PROJECT_DIR=""
UPDATE_IN_PROGRESS=0
UPDATE_IOS_AUTO_ENABLED=0

cleanup_update_files() {
  if [[ -n "$UPDATE_TEMP_INSTALLER" ]]; then
    rm -f "$UPDATE_TEMP_INSTALLER"
  fi
}

atomic_restore_config() {
  local source_file="$1"
  local target_file="${INSTALL_ROOT}/config/variables.env"
  local temp_file

  temp_file="$(mktemp "${INSTALL_ROOT}/config/.variables.env.restore.XXXXXX")"
  cp "$source_file" "$temp_file"
  mv "$temp_file" "$target_file"
}

atomic_select_release() {
  local release_dir="$1"

  rm -f "${INSTALL_ROOT}/current.rollback"
  ln -s "$release_dir" "${INSTALL_ROOT}/current.rollback"
  mv -h -f "${INSTALL_ROOT}/current.rollback" "${INSTALL_ROOT}/current"
}

if [[ -n "${MERCURY_HOME:-}" ]]; then
  INSTALL_ROOT="$MERCURY_HOME"
elif [[ "$(basename "$(dirname "$PROJECT_DIR")")" == "releases" ]]; then
  INSTALL_ROOT="$(cd "$PROJECT_DIR/../.." && pwd)"
else
  INSTALL_ROOT="$PROJECT_DIR"
fi

UPDATE_MARKER="${INSTALL_ROOT}/.update-in-progress"
UPDATE_LOCK="${INSTALL_ROOT}/.update.lock"

requested_command="${1:-help}"
lock_required=0
case "$requested_command" in
  update|up|down|ios|ios-auto)
    lock_required=1
    ;;
esac

if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" && \
  "${MERCURY_UPDATE_LOCK_HELD:-0}" != "1" ]]; then
  if [[ -f "$UPDATE_MARKER" || "$lock_required" -eq 1 ]]; then
    set +e
    /usr/bin/lockf -k -t 0 "$UPDATE_LOCK" \
      /usr/bin/env \
        MERCURY_HOME="$INSTALL_ROOT" \
        MERCURY_UPDATE_LOCK_HELD=1 \
        /bin/bash "$PROJECT_DIR/scripts/mercuryctl.sh" "$@"
    lock_exit=$?
    set -e

    if [[ "$lock_exit" -eq 75 ]]; then
      echo "Another Mercury update is already running." >&2
    fi
    exit "$lock_exit"
  fi

  if ! /usr/bin/lockf -k -t 0 "$UPDATE_LOCK" /usr/bin/true; then
    echo "Another Mercury update is already running." >&2
    exit 1
  fi
fi

recover_interrupted_update() {
  local backup_file="${INSTALL_ROOT}/config/variables.env.update-backup"
  local ios_auto_enabled
  local previous_project

  [[ -f "$UPDATE_MARKER" ]] || return 0
  previous_project="$(sed -n '1p' "$UPDATE_MARKER" | tr -d '\r\n')"
  ios_auto_enabled="$(sed -n '2p' "$UPDATE_MARKER" | tr -d '\r\n')"
  ios_auto_enabled="${ios_auto_enabled:-0}"

  if [[ ! -f "$backup_file" || \
    ! -f "${previous_project}/scripts/mercuryctl.sh" ]]; then
    echo "Incomplete update recovery data in $INSTALL_ROOT." >&2
    return 1
  fi

  echo "Recovering an interrupted Mercury update." >&2
  atomic_restore_config "$backup_file"
  atomic_select_release "$previous_project"

  if ! MERCURY_UPDATE_ACTIVE=1 \
    /bin/bash "${previous_project}/scripts/mercuryctl.sh" up; then
    echo "Recovery selected the previous release, but its stack is not healthy." >&2
    return 1
  fi

  if [[ "$ios_auto_enabled" -eq 1 ]]; then
    if ! /bin/bash "${previous_project}/scripts/deploy-ios-provider-runtime.sh"; then
      echo "Recovery could not restore the previous iOS provider." >&2
      return 1
    fi
  fi

  rm -f "$UPDATE_MARKER" "$backup_file"

  if [[ "$previous_project" != "$PROJECT_DIR" ]]; then
    exec /bin/bash "${previous_project}/scripts/mercuryctl.sh" "$@"
  fi
}

if [[ "${MERCURY_UPDATE_ACTIVE:-0}" != "1" ]]; then
  if [[ -f "$UPDATE_MARKER" ]]; then
    recover_interrupted_update "$@"
  fi
fi

rollback_update() {
  local previous_project="$UPDATE_OLD_PROJECT_DIR"
  local recovery_ok=1

  [[ "$UPDATE_IN_PROGRESS" -eq 1 ]] || return 0
  UPDATE_IN_PROGRESS=0
  echo "Update failed; restoring the previous Mercury release." >&2

  atomic_restore_config "$UPDATE_CONFIG_BACKUP"
  atomic_select_release "$previous_project"

  if ! MERCURY_UPDATE_ACTIVE=1 \
    /bin/bash "${previous_project}/scripts/mercuryctl.sh" up; then
    echo "Previous release was selected, but its Docker stack could not be refreshed." >&2
    recovery_ok=0
  fi

  if [[ "$UPDATE_IOS_AUTO_ENABLED" -eq 1 ]]; then
    if ! /bin/bash "${previous_project}/scripts/deploy-ios-provider-runtime.sh"; then
      echo "Previous release was selected, but its iOS provider could not be restored." >&2
      recovery_ok=0
    fi
  fi

  if [[ "$recovery_ok" -eq 1 ]]; then
    rm -f "$UPDATE_MARKER" "$UPDATE_CONFIG_BACKUP"
  fi

  echo "UPDATE DID NOT TAKE EFFECT: Mercury is still on the previous release." >&2
  echo "Fix the error reported above, then run 'mercury update' again." >&2
}

cleanup_update_transaction() {
  local exit_code=$?
  trap - EXIT HUP INT TERM

  if [[ "$UPDATE_IN_PROGRESS" -eq 1 ]]; then
    rollback_update
    if [[ "$exit_code" -eq 0 ]]; then
      exit_code=1
    fi
  fi

  cleanup_update_files
  exit "$exit_code"
}

usage() {
  cat <<'EOF'
Manage a Mercury installation.

Usage: mercury <command> [options]

Commands:
  up       Pull the pinned image and start or refresh the Docker stack
  update   Install the latest release, then refresh the Docker stack
  status   Show Docker services and the host iOS provider status
  logs     Follow Docker service logs (accepts docker compose logs options)
  down     Stop the Docker stack without deleting persistent volumes
  ios      Run the iOS provider in the foreground
  ios-auto Install or refresh the iOS provider LaunchAgent
  version  Show the installed release and Docker image
  help     Show this help
EOF
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    echo "Docker Desktop with Compose v2 is required." >&2
    exit 1
  fi
}

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

read_env() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { print substr($0, index($0, "=") + 1); exit }' "$ENV_FILE"
}

download_file() {
  local destination="$1"
  local url="$2"
  local attempt

  for attempt in 1 2 3; do
    rm -f "${destination}.part"
    if curl --fail --location --silent --show-error --connect-timeout 15 \
      "$url" --output "${destination}.part"; then
      mv "${destination}.part" "$destination"
      return 0
    fi

    if [[ "$attempt" -lt 3 ]]; then
      echo "Download failed; retrying (${attempt}/3)..." >&2
      sleep 2
    fi
  done

  rm -f "${destination}.part"
  return 1
}

wait_for_stack() {
  local domain
  local port
  local healthy_checks=0
  local service
  local service_id
  local service_state
  local services_ready
  local required_services=(
    nginx
    mercury-mongo
    mercury-app
    mercury-auth
    mercury-processor
    mercury-reaper
    mercury-storage-plugin-apk
    mercury-storage-plugin-image
    mercury-storage-temp
    mercury-triproxy-app
    mercury-triproxy-dev
    mercury-websocket
    mercury-api
    mercury-api-groups-engine
    mercury-provider
  )

  domain="$(read_env MERCURY_DOMAIN)"
  domain="${domain:-localhost}"
  port="$(read_env MERCURY_PORT)"
  port="${port:-443}"

  for _ in {1..90}; do
    services_ready=1
    for service in "${required_services[@]}"; do
      service_id="$(compose ps -q "$service" 2>/dev/null || true)"
      if [[ -z "$service_id" ]]; then
        services_ready=0
        break
      fi

      service_state="$(docker inspect \
        --format '{{.State.Status}}{{if .State.Health}} {{.State.Health.Status}}{{end}}' \
        "$service_id" 2>/dev/null || true)"
      if [[ "$service_state" != "running" && "$service_state" != "running healthy" ]]; then
        services_ready=0
        break
      fi
    done

    if [[ "$services_ready" -eq 1 ]] && \
      curl --insecure --fail --location --silent --output /dev/null --max-time 5 \
        --resolve "${domain}:${port}:127.0.0.1" "https://${domain}:${port}/"; then
      healthy_checks=$((healthy_checks + 1))
      if [[ "$healthy_checks" -ge 3 ]]; then
        return 0
      fi
    else
      healthy_checks=0
    fi

    sleep 2
  done

  echo "Mercury did not become healthy within 180 seconds." >&2
  if [[ "$services_ready" -ne 1 ]]; then
    echo "Service not running: ${service:-unknown}" >&2
  fi
  return 1
}

command_up() {
  require_docker
  /bin/bash "$PROJECT_DIR/scripts/auto-configure-network.sh"
  compose pull
  compose up -d --no-build --remove-orphans
  compose restart nginx

  if ! wait_for_stack; then
    return 1
  fi

  local domain
  domain="$(read_env MERCURY_DOMAIN)"
  echo "Mercury is running at https://${domain:-localhost}"
}

command_update() {
  local temp_installer
  local config_backup
  local config_backup_temp
  local marker_temp
  local ios_auto_enabled=0
  local android_only=0
  local installer_url
  local old_project_dir="$PROJECT_DIR"
  temp_installer="$(mktemp)"
  UPDATE_TEMP_INSTALLER="$temp_installer"
  installer_url="${MERCURY_INSTALLER_URL:-https://github.com/${REPOSITORY}/releases/latest/download/install.sh}"
  trap 'exit 130' HUP INT TERM
  trap 'cleanup_update_transaction' EXIT

  if launchctl print "gui/$(id -u)/com.mercury.ios-provider" >/dev/null 2>&1; then
    ios_auto_enabled=1
  fi
  if [[ ! -x "${PROJECT_DIR}/node_modules/.bin/tsx" ]]; then
    android_only=1
  fi

  echo "Checking the latest Mercury release..."
  if ! download_file "$temp_installer" "$installer_url"; then
    echo "Could not download the Mercury installer after 3 attempts." >&2
    return 1
  fi

  config_backup="${INSTALL_ROOT}/config/variables.env.update-backup"
  config_backup_temp="$(mktemp "${INSTALL_ROOT}/config/.variables.env.update.XXXXXX")"
  cp "$ENV_FILE" "$config_backup_temp"
  mv "$config_backup_temp" "$config_backup"

  marker_temp="$(mktemp "${INSTALL_ROOT}/.update-in-progress.XXXXXX")"
  printf '%s\n%s\n' "$old_project_dir" "$ios_auto_enabled" > "$marker_temp"
  mv "$marker_temp" "$UPDATE_MARKER"

  UPDATE_CONFIG_BACKUP="$config_backup"
  UPDATE_OLD_PROJECT_DIR="$old_project_dir"
  UPDATE_IOS_AUTO_ENABLED="$ios_auto_enabled"
  UPDATE_IN_PROGRESS=1

  if [[ "$android_only" -eq 1 ]]; then
    if ! MERCURY_HOME="$INSTALL_ROOT" MERCURY_REPOSITORY="$REPOSITORY" \
      MERCURY_UPDATE_ACTIVE=1 /bin/bash "$temp_installer" --android-only; then
      rollback_update
      return 1
    fi
  else
    if ! MERCURY_HOME="$INSTALL_ROOT" MERCURY_REPOSITORY="$REPOSITORY" \
      MERCURY_UPDATE_ACTIVE=1 /bin/bash "$temp_installer"; then
      rollback_update
      return 1
    fi
  fi

  if ! MERCURY_UPDATE_ACTIVE=1 \
    /bin/bash "${INSTALL_ROOT}/current/scripts/mercuryctl.sh" up; then
    rollback_update
    return 1
  fi

  if [[ "$ios_auto_enabled" -eq 1 ]]; then
    if ! /bin/bash "${INSTALL_ROOT}/current/scripts/deploy-ios-provider-runtime.sh"; then
      rollback_update
      return 1
    fi
  fi

  UPDATE_IN_PROGRESS=0
  rm -f "$UPDATE_MARKER" "$UPDATE_CONFIG_BACKUP"
  cleanup_update_files
  trap - EXIT HUP INT TERM

  local new_release=""
  if [[ -f "${INSTALL_ROOT}/current/.release-version" ]]; then
    new_release="$(tr -d '[:space:]' < "${INSTALL_ROOT}/current/.release-version")"
  fi
  echo "Mercury update completed successfully.${new_release:+ Installed release: ${new_release}}"
}

command_status() {
  require_docker
  compose ps

  if launchctl print "gui/$(id -u)/com.mercury.ios-provider" >/dev/null 2>&1; then
    echo "iOS provider LaunchAgent: running"
  else
    echo "iOS provider LaunchAgent: not installed"
  fi
}

command_version() {
  local release_version="source checkout"
  if [[ -f "${PROJECT_DIR}/.release-version" ]]; then
    release_version="$(tr -d '[:space:]' < "${PROJECT_DIR}/.release-version")"
  fi

  echo "Release: $release_version"
  echo "Image: $(read_env MERCURY_IMAGE || true)"
}

command_name="${1:-help}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command_name" in
  up)
    command_up
    ;;
  update)
    command_update
    ;;
  status)
    command_status
    ;;
  logs)
    require_docker
    compose logs -f "$@"
    ;;
  down)
    require_docker
    compose down
    ;;
  ios)
    if [[ ! -x "${PROJECT_DIR}/node_modules/.bin/tsx" ]]; then
      echo "The iOS provider is not installed. Run the installer without --android-only." >&2
      exit 1
    fi
    exec /bin/bash "$PROJECT_DIR/scripts/start-ios-provider.sh" "$@"
    ;;
  ios-auto)
    if [[ ! -x "${PROJECT_DIR}/node_modules/.bin/tsx" ]]; then
      echo "The iOS provider is not installed. Run the installer without --android-only." >&2
      exit 1
    fi
    exec /bin/bash "$PROJECT_DIR/scripts/deploy-ios-provider-runtime.sh" "$@"
    ;;
  version)
    command_version
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Unknown command: $command_name" >&2
    usage >&2
    exit 2
    ;;
esac