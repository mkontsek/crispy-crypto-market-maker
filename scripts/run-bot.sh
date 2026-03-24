#!/usr/bin/env bash
# Provision and start a crispy-bot service on Ubuntu (idempotent).
# Run again to rebuild/reconfigure if anything has changed.
set -euo pipefail

BOT_NAME=""
EXCHANGE_WS_URL=""
EXCHANGE_API_URL=""
EXCHANGE_DOMAIN=""
CADDY_DOMAIN=""
DATABASE_URL="${DATABASE_URL:-}"
GEO_LAT=""
GEO_LNG=""
GEO_LABEL=""
RUN_USER="crispy"
INSTALL_DIR="/usr/local/bin"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_RUST_INSTALL=false

# shellcheck source=_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bot-name)          BOT_NAME="$2";           shift 2 ;;
    --exchange-domain)   EXCHANGE_DOMAIN="$2";    shift 2 ;;
    --exchange-ws-url)   EXCHANGE_WS_URL="$2";    shift 2 ;;
    --exchange-api-url)  EXCHANGE_API_URL="$2";   shift 2 ;;
    --database-url)      DATABASE_URL="$2";       shift 2 ;;
    --database-url=*)    DATABASE_URL="${1#*=}";  shift   ;;
    DATABASE_URL=*)      DATABASE_URL="${1#*=}";  shift   ;;
    --caddy-domain)      CADDY_DOMAIN="$2";       shift 2 ;;
    --geo-lat)           GEO_LAT="$2";            shift 2 ;;
    --geo-lng)           GEO_LNG="$2";            shift 2 ;;
    --geo-label)         GEO_LABEL="$2";          shift 2 ;;
    --user)              RUN_USER="$2";            shift 2 ;;
    --install-dir)       INSTALL_DIR="$2";         shift 2 ;;
    --repo-dir)          REPO_DIR="$2";            shift 2 ;;
    --skip-rust-install) SKIP_RUST_INSTALL=true;   shift   ;;
    *) error "Unknown option: $1" ;;
  esac
done

[[ -z "$BOT_NAME" ]] && error "--bot-name is required (example: --bot-name bot1)"
if [[ ! "$BOT_NAME" =~ ^[a-z0-9-]+$ ]]; then
  error "--bot-name must contain only lowercase letters, digits, and hyphens"
fi
if [[ -z "$CADDY_DOMAIN" ]]; then
  error "--caddy-domain is required (example: bot1.your-domain.com)"
fi
if [[ ! "$CADDY_DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
  error "--caddy-domain must be a full domain name (example: bot1.your-domain.com)"
fi
if [[ -z "$EXCHANGE_WS_URL" || -z "$EXCHANGE_API_URL" ]]; then
  if [[ -z "$EXCHANGE_DOMAIN" ]]; then
    error "--exchange-domain is required unless both --exchange-ws-url and --exchange-api-url are provided"
  fi
  if [[ ! "$EXCHANGE_DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
    error "--exchange-domain must be a full domain name (example: exchange.your-domain.com)"
  fi
  [[ -z "$EXCHANGE_WS_URL" ]]  && EXCHANGE_WS_URL="wss://${EXCHANGE_DOMAIN}/feed"
  [[ -z "$EXCHANGE_API_URL" ]] && EXCHANGE_API_URL="https://${EXCHANGE_DOMAIN}"
fi

SERVICE_NAME="crispy-bot-${BOT_NAME}"
BINARY_NAME="crispy-bot"
APP_DIR="${REPO_DIR}/apps/bot"
BINARY_SRC="${APP_DIR}/target/release/${BINARY_NAME}"
BINARY_DEST="${INSTALL_DIR}/${BINARY_NAME}-${BOT_NAME}"
ENV_DIR="/etc/crispy"
ENV_FILE="${ENV_DIR}/${SERVICE_NAME}.env"
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
UPSTREAM_PORT="3110"
UNIT_CHANGED=false
NEEDS_SERVICE_RESTART=false

[[ "$EUID" -ne 0 ]] && error "Run this script with sudo or as root"

setup_system_deps "$CADDY_DOMAIN" "$SKIP_RUST_INSTALL"
ensure_run_user "$RUN_USER"

section "Building ${BINARY_NAME} (release)"
[[ -d "$APP_DIR" ]] || error "App directory not found: ${APP_DIR}"
(cd "$APP_DIR" && cargo build --release)
[[ -f "$BINARY_SRC" ]] || error "Build succeeded but binary not found at: ${BINARY_SRC}"

section "Installing binary to ${BINARY_DEST}"
if [[ -f "$BINARY_DEST" ]] && cmp -s "$BINARY_SRC" "$BINARY_DEST"; then
  info "Binary already up to date — skipping install"
else
  install -m 0755 "$BINARY_SRC" "$BINARY_DEST"
  info "Installed ${BINARY_DEST}"
  NEEDS_SERVICE_RESTART=true
fi

section "Writing environment file: ${ENV_FILE}"
mkdir -p "$ENV_DIR"
chmod 750 "$ENV_DIR"
ENV_CONTENT=$(cat <<EOF
# crispy-bot environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}

# Exchange endpoints for this bot.
EXCHANGE_WS_URL=${EXCHANGE_WS_URL}
EXCHANGE_API_URL=${EXCHANGE_API_URL}

# Postgres connection string for persisting fills, quotes, inventory and PnL.
# Provide via --database-url, --database-url=<url>, or DATABASE_URL=<url>.
# Leave empty to disable DB writes.
DATABASE_URL=${DATABASE_URL}

# Bot identity used when writing data to the database.
BOT_ID=

# Static location for the infrastructure map (optional).
# Leave empty to auto-detect via IP geolocation on GET /geo.
GEO_LAT=${GEO_LAT}
GEO_LNG=${GEO_LNG}
GEO_LABEL=${GEO_LABEL}
EOF
)
if write_file_if_changed "$ENV_FILE" "$ENV_CONTENT" 640; then
  info "Wrote ${ENV_FILE}"
  NEEDS_SERVICE_RESTART=true
else
  info "Environment file already up to date — skipping"
fi
chmod 640 "$ENV_FILE"
chown "root:${RUN_USER}" "$ENV_FILE"

section "Writing systemd unit: ${UNIT_FILE}"
UNIT_CONTENT=$(cat <<EOF
[Unit]
Description=Crispy Bot (${BOT_NAME})
# WS stream: ws://<server-ip-or-domain>:3110/stream  |  HTTP API: http://<server-ip-or-domain>:3110
After=network.target
Wants=network.target

[Service]
Type=simple
User=${RUN_USER}
EnvironmentFile=${ENV_FILE}
ExecStartPre=-/bin/sh -c 'ss -Htlnp "sport = :${UPSTREAM_PORT}" | grep -oE "pid=[0-9]+" | cut -d= -f2 | xargs -r kill 2>/dev/null || true'
ExecStart=${BINARY_DEST}
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF
)
if write_file_if_changed "$UNIT_FILE" "$UNIT_CONTENT" 644; then
  info "Wrote ${UNIT_FILE}"
  UNIT_CHANGED=true
  NEEDS_SERVICE_RESTART=true
else
  info "Systemd unit already up to date — skipping"
fi

section "Enabling and starting ${SERVICE_NAME}"
if [[ "$UNIT_CHANGED" == true ]]; then
  systemctl daemon-reload
fi
if systemctl is-enabled --quiet "${SERVICE_NAME}"; then
  info "${SERVICE_NAME} already enabled"
else
  systemctl enable "${SERVICE_NAME}"
fi
if [[ "$NEEDS_SERVICE_RESTART" == true ]] || ! systemctl is-active --quiet "${SERVICE_NAME}"; then
  systemctl restart "${SERVICE_NAME}"
  sleep 2
else
  info "${SERVICE_NAME} already running with current config — skipping restart"
fi
systemctl --no-pager status "${SERVICE_NAME}" || \
  warn "${SERVICE_NAME} did not start cleanly — check: journalctl -u ${SERVICE_NAME}"

configure_caddy "$CADDY_DOMAIN" "$UPSTREAM_PORT" "$SERVICE_NAME"

info "Setup complete for ${SERVICE_NAME}"
echo -e "${BOLD}Binary:${RESET} ${BINARY_DEST}\n${BOLD}Env:${RESET} ${ENV_FILE}\n${BOLD}Logs:${RESET} journalctl -fu ${SERVICE_NAME}"
