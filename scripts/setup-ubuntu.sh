#!/usr/bin/env bash
# Provision crispy-bot or crispy-exchange on Ubuntu.
# Usage: sudo ./scripts/setup-ubuntu.sh --service <bot|exchange> [OPTIONS]
# Supports idempotent re-runs: unchanged files/configs are skipped.
# Optional TLS proxy setup: --caddy-domain <domain>
set -euo pipefail

SERVICE=""
EXCHANGE_WS_URL=""
EXCHANGE_API_URL=""
CADDY_DOMAIN=""
RUN_USER="crispy"
INSTALL_DIR="/usr/local/bin"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_RUST_INSTALL=false
UNINSTALL=false
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${GREEN}[info]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}==> $*${RESET}"; }
package_installed() {
  dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q "install ok installed"
}
ensure_packages() {
  local missing=()
  local pkg=""
  for pkg in "$@"; do
    if ! package_installed "$pkg"; then
      missing+=("$pkg")
    fi
  done
  if [[ "${#missing[@]}" -eq 0 ]]; then
    info "System dependencies already installed — skipping"
    return
  fi
  info "Installing missing packages: ${missing[*]}"
  apt-get update -qq
  apt-get install -y --no-install-recommends "${missing[@]}"
}
write_file_if_changed() {
  local target="$1"
  local content="$2"
  local mode="$3"
  local tmp
  tmp="$(mktemp)"
  printf '%s' "$content" > "$tmp"
  if [[ -f "$target" ]] && cmp -s "$tmp" "$target"; then
    rm -f "$tmp"
    return 1
  fi
  install -D -m "$mode" "$tmp" "$target"
  rm -f "$tmp"
  return 0
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)           SERVICE="$2";            shift 2 ;;
    --exchange-ws-url)   EXCHANGE_WS_URL="$2";    shift 2 ;;
    --exchange-api-url)  EXCHANGE_API_URL="$2";   shift 2 ;;
    --caddy-domain)      CADDY_DOMAIN="$2";       shift 2 ;;
    --user)              RUN_USER="$2";            shift 2 ;;
    --install-dir)       INSTALL_DIR="$2";         shift 2 ;;
    --repo-dir)          REPO_DIR="$2";            shift 2 ;;
    --skip-rust-install) SKIP_RUST_INSTALL=true;   shift   ;;
    --uninstall)         UNINSTALL=true;           shift   ;;
    *) error "Unknown option: $1" ;;
  esac
done
[[ -z "$SERVICE" ]] && error "--service <bot|exchange> is required"
[[ "$SERVICE" != "bot" && "$SERVICE" != "exchange" ]] && \
  error "--service must be 'bot' or 'exchange', got: '$SERVICE'"
BINARY_NAME="crispy-${SERVICE}"
SERVICE_NAME="crispy-${SERVICE}"
APP_DIR="${REPO_DIR}/apps/${SERVICE}"
BINARY_SRC="${APP_DIR}/target/release/${BINARY_NAME}"
BINARY_DEST="${INSTALL_DIR}/${BINARY_NAME}"
ENV_DIR="/etc/crispy"
ENV_FILE="${ENV_DIR}/${SERVICE_NAME}.env"
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CADDY_MAIN_FILE="/etc/caddy/Caddyfile"
CADDY_DIR="/etc/caddy/Caddyfile.d"
CADDY_SERVICE_FILE="${CADDY_DIR}/${SERVICE_NAME}.caddy"
if [[ "$SERVICE" == "bot" ]]; then
  UPSTREAM_PORT="3110"
else
  UPSTREAM_PORT="3111"
fi
UNIT_CHANGED=false
NEEDS_SERVICE_RESTART=false
if [[ "$UNINSTALL" == true ]]; then
  section "Uninstalling ${SERVICE_NAME}"
  systemctl stop  "${SERVICE_NAME}" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "$UNIT_FILE"
  systemctl daemon-reload || true
  rm -f "$BINARY_DEST"
  rm -f "$ENV_FILE"
  if [[ -f "$CADDY_SERVICE_FILE" ]]; then
    rm -f "$CADDY_SERVICE_FILE"
    info "Removed Caddy config: ${CADDY_SERVICE_FILE}"
    if command -v caddy &>/dev/null; then
      if caddy validate --config "$CADDY_MAIN_FILE" --adapter caddyfile &>/dev/null; then
        if systemctl is-active --quiet caddy; then
          systemctl reload caddy || warn "Failed to reload caddy after removing ${CADDY_SERVICE_FILE}"
        fi
      else
        warn "Caddy config failed validation after uninstall; review ${CADDY_MAIN_FILE}"
      fi
    fi
  fi
  info "Done. Data in ${ENV_DIR} left intact (remove manually if desired)."
  exit 0
fi
[[ "$EUID" -ne 0 ]] && error "Run this script with sudo or as root"
section "Installing system dependencies"
export DEBIAN_FRONTEND=noninteractive
SYSTEM_PACKAGES=(
  build-essential
  pkg-config
  libssl-dev
  curl
  ca-certificates
)
if [[ -n "$CADDY_DOMAIN" ]]; then
  SYSTEM_PACKAGES+=(caddy)
fi
ensure_packages "${SYSTEM_PACKAGES[@]}"
if [[ "$SKIP_RUST_INSTALL" == false ]]; then
  section "Installing Rust toolchain"
  if command -v rustup &>/dev/null; then
    info "rustup already present — skipping install"
  else
    info "Installing rustup (non-interactive)"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
      | sh -s -- -y --no-modify-path --default-toolchain stable
    # Make cargo available for the rest of this script
    export PATH="${HOME}/.cargo/bin:${PATH}"
  fi
fi
command -v cargo &>/dev/null || export PATH="${HOME}/.cargo/bin:${PATH}"
command -v cargo &>/dev/null || error "cargo not found — ensure Rust is installed or use --skip-rust-install with a pre-installed toolchain"
info "Using $(rustc --version)"
section "Ensuring OS user: ${RUN_USER}"
if ! id "$RUN_USER" &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$RUN_USER"
  info "Created system user '${RUN_USER}'"
else
  info "User '${RUN_USER}' already exists"
fi
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
if [[ "$SERVICE" == "bot" ]]; then
  ENV_CONTENT=$(cat <<EOF
# crispy-bot environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}

# Exchange endpoints (optional).
# Leave empty to let the bot use its built-in local defaults.
EXCHANGE_WS_URL=${EXCHANGE_WS_URL}
EXCHANGE_API_URL=${EXCHANGE_API_URL}
EOF
)
else
  ENV_CONTENT=$(cat <<EOF
# crispy-exchange environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}
EOF
)
fi
if write_file_if_changed "$ENV_FILE" "$ENV_CONTENT" 640; then
  info "Wrote ${ENV_FILE}"
  NEEDS_SERVICE_RESTART=true
else
  info "Environment file already up to date — skipping"
fi
chmod 640 "$ENV_FILE"
chown "root:${RUN_USER}" "$ENV_FILE"
section "Writing systemd unit: ${UNIT_FILE}"
if [[ "$SERVICE" == "bot" ]]; then
  PORTS_DOC="# WS stream: ws://<server-ip-or-domain>:3110/stream  |  HTTP API: http://<server-ip-or-domain>:3110"
else
  PORTS_DOC="# WS feed:   ws://<server-ip-or-domain>:3111/feed    |  HTTP API: http://<server-ip-or-domain>:3111"
fi
UNIT_CONTENT=$(cat <<EOF
[Unit]
Description=Crispy ${SERVICE^}
${PORTS_DOC}
After=network.target
Wants=network.target

[Service]
Type=simple
User=${RUN_USER}
EnvironmentFile=${ENV_FILE}
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
systemctl --no-pager status "${SERVICE_NAME}" || warn "${SERVICE_NAME} did not start cleanly -- check: journalctl -u ${SERVICE_NAME}"
if [[ -n "$CADDY_DOMAIN" ]]; then
  section "Configuring Caddy for ${CADDY_DOMAIN}"
  mkdir -p "$CADDY_DIR"
  CADDY_MAIN_CHANGED=false
  if [[ ! -f "$CADDY_MAIN_FILE" ]]; then
    printf 'import /etc/caddy/Caddyfile.d/*.caddy\n' > "$CADDY_MAIN_FILE"
    CADDY_MAIN_CHANGED=true
  elif ! grep -Eq '^[[:space:]]*import /etc/caddy/Caddyfile\.d/\*\.caddy[[:space:]]*$' "$CADDY_MAIN_FILE"; then
    printf '\nimport /etc/caddy/Caddyfile.d/*.caddy\n' >> "$CADDY_MAIN_FILE"
    CADDY_MAIN_CHANGED=true
  fi
  CADDY_CONTENT="${CADDY_DOMAIN} {
  reverse_proxy 127.0.0.1:${UPSTREAM_PORT}
}
"
  CADDY_CHANGED=false
  if write_file_if_changed "$CADDY_SERVICE_FILE" "$CADDY_CONTENT" 644; then
    info "Wrote ${CADDY_SERVICE_FILE}"
    CADDY_CHANGED=true
  else
    info "Caddy config already up to date — skipping"
  fi
  caddy validate --config "$CADDY_MAIN_FILE" --adapter caddyfile &>/dev/null || \
    error "Caddy config validation failed for ${CADDY_MAIN_FILE}"
  if ! systemctl is-enabled --quiet caddy; then systemctl enable caddy; fi
  if [[ "$CADDY_MAIN_CHANGED" == true || "$CADDY_CHANGED" == true ]] || ! systemctl is-active --quiet caddy; then
    systemctl restart caddy
  else
    info "caddy already running with current config — skipping restart"
  fi
fi
info "Setup complete for ${SERVICE_NAME}"
echo -e "${BOLD}Binary:${RESET} ${BINARY_DEST}\n${BOLD}Env:${RESET} ${ENV_FILE}\n${BOLD}Logs:${RESET} journalctl -fu ${SERVICE_NAME}"
