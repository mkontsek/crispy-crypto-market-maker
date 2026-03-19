#!/usr/bin/env bash
# Provision and start the crispy-exchange service on Ubuntu (idempotent).
# Run again to rebuild/reconfigure if anything has changed.
set -euo pipefail

CADDY_DOMAIN=""
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

if [[ -z "$CADDY_DOMAIN" ]]; then
  error "--caddy-domain is required (example: exchange.your-domain.com)"
fi
if [[ ! "$CADDY_DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
  error "--caddy-domain must be a full domain name (example: exchange.your-domain.com)"
fi

SERVICE_NAME="crispy-exchange"
BINARY_NAME="crispy-exchange"
APP_DIR="${REPO_DIR}/apps/exchange"
BINARY_SRC="${APP_DIR}/target/release/${BINARY_NAME}"
BINARY_DEST="${INSTALL_DIR}/${BINARY_NAME}"
ENV_DIR="/etc/crispy"
ENV_FILE="${ENV_DIR}/${SERVICE_NAME}.env"
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
UPSTREAM_PORT="3111"
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
# crispy-exchange environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}

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
Description=Crispy Exchange
# WS feed:   ws://<server-ip-or-domain>:3111/feed    |  HTTP API: http://<server-ip-or-domain>:3111
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
