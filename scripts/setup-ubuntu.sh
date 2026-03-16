#!/usr/bin/env bash
# setup-ubuntu.sh — provision a crispy-bot or crispy-exchange instance on Ubuntu
#
# Usage:
#   sudo ./scripts/setup-ubuntu.sh --service <bot|exchange> [OPTIONS]
#
# Options:
#   --service <bot|exchange>        Which service to install (required)
#   --exchange-ws-url <url>         (bot only) Exchange WebSocket feed URL
#   --exchange-api-url <url>        (bot only) Exchange HTTP API URL
#   --web-topology-url <url>        (bot only) Web topology URL (alternative to explicit URLs)
#   --user <name>                   OS user to run the service (default: crispy)
#   --install-dir <path>            Where to install the binary (default: /usr/local/bin)
#   --repo-dir <path>               Path to the cloned repository (default: current directory)
#   --skip-rust-install             Skip Rust toolchain installation
#   --uninstall                     Remove the service, binary and config files
#
# Example — install exchange on a fresh Ubuntu server:
#   git clone https://github.com/mkontsek/crispy-crypto-market-maker.git
#   cd crispy-crypto-market-maker
#   sudo ./scripts/setup-ubuntu.sh --service exchange
#
# Example — install bot pointing at the exchange:
#   sudo ./scripts/setup-ubuntu.sh \
#     --service bot \
#     --exchange-ws-url ws://exchange.internal:3111/feed \
#     --exchange-api-url http://exchange.internal:3111
set -euo pipefail

# ── defaults ────────────────────────────────────────────────────────────────
SERVICE=""
EXCHANGE_WS_URL=""
EXCHANGE_API_URL=""
WEB_TOPOLOGY_URL=""
RUN_USER="crispy"
INSTALL_DIR="/usr/local/bin"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKIP_RUST_INSTALL=false
UNINSTALL=false

# ── colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${GREEN}[info]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }
section() { echo -e "\n${BOLD}==> $*${RESET}"; }

# ── argument parsing ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)           SERVICE="$2";            shift 2 ;;
    --exchange-ws-url)   EXCHANGE_WS_URL="$2";    shift 2 ;;
    --exchange-api-url)  EXCHANGE_API_URL="$2";   shift 2 ;;
    --web-topology-url)  WEB_TOPOLOGY_URL="$2";   shift 2 ;;
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

# ── derived names ────────────────────────────────────────────────────────────
BINARY_NAME="crispy-${SERVICE}"
SERVICE_NAME="crispy-${SERVICE}"
APP_DIR="${REPO_DIR}/apps/${SERVICE}"
BINARY_SRC="${APP_DIR}/target/release/${BINARY_NAME}"
BINARY_DEST="${INSTALL_DIR}/${BINARY_NAME}"
ENV_DIR="/etc/crispy"
ENV_FILE="${ENV_DIR}/${SERVICE_NAME}.env"
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# ── uninstall path ────────────────────────────────────────────────────────────
if [[ "$UNINSTALL" == true ]]; then
  section "Uninstalling ${SERVICE_NAME}"
  systemctl stop  "${SERVICE_NAME}" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "$UNIT_FILE"
  systemctl daemon-reload || true
  rm -f "$BINARY_DEST"
  rm -f "$ENV_FILE"
  info "Done. Data in ${ENV_DIR} left intact (remove manually if desired)."
  exit 0
fi

# ── root check ────────────────────────────────────────────────────────────────
[[ "$EUID" -ne 0 ]] && error "Run this script with sudo or as root"

# ── system dependencies ───────────────────────────────────────────────────────
section "Installing system dependencies"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends \
  build-essential \
  pkg-config \
  libssl-dev \
  curl \
  ca-certificates

# ── Rust toolchain ────────────────────────────────────────────────────────────
if [[ "$SKIP_RUST_INSTALL" == false ]]; then
  section "Installing Rust toolchain"
  if command -v rustup &>/dev/null; then
    info "rustup already present — running rustup update"
    rustup update stable
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

# ── OS service user ───────────────────────────────────────────────────────────
section "Ensuring OS user: ${RUN_USER}"
if ! id "$RUN_USER" &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin "$RUN_USER"
  info "Created system user '${RUN_USER}'"
else
  info "User '${RUN_USER}' already exists"
fi

# ── build ─────────────────────────────────────────────────────────────────────
section "Building ${BINARY_NAME} (release)"
[[ -d "$APP_DIR" ]] || error "App directory not found: ${APP_DIR}"
(cd "$APP_DIR" && cargo build --release)
[[ -f "$BINARY_SRC" ]] || error "Build succeeded but binary not found at: ${BINARY_SRC}"

# ── install binary ────────────────────────────────────────────────────────────
section "Installing binary to ${BINARY_DEST}"
install -m 0755 "$BINARY_SRC" "$BINARY_DEST"
info "Installed ${BINARY_DEST}"

# ── environment file ──────────────────────────────────────────────────────────
section "Writing environment file: ${ENV_FILE}"
mkdir -p "$ENV_DIR"
chmod 750 "$ENV_DIR"

if [[ "$SERVICE" == "bot" ]]; then
  cat > "$ENV_FILE" <<EOF
# crispy-bot environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}

# Exchange endpoints — set explicitly OR provide WEB_TOPOLOGY_URL so the bot
# can fetch them automatically from the web topology API.
EXCHANGE_WS_URL=${EXCHANGE_WS_URL}
EXCHANGE_API_URL=${EXCHANGE_API_URL}

# Optional: let the bot discover exchange endpoints via the web topology API.
# Takes effect only when EXCHANGE_WS_URL / EXCHANGE_API_URL are not both set.
WEB_TOPOLOGY_URL=${WEB_TOPOLOGY_URL}
EOF
else
  cat > "$ENV_FILE" <<EOF
# crispy-exchange environment configuration
# Edit this file, then run: systemctl restart ${SERVICE_NAME}
EOF
fi

chmod 640 "$ENV_FILE"
chown "root:${RUN_USER}" "$ENV_FILE"
info "Wrote ${ENV_FILE}"

# ── systemd unit ──────────────────────────────────────────────────────────────
section "Writing systemd unit: ${UNIT_FILE}"

if [[ "$SERVICE" == "bot" ]]; then
  PORTS_DOC="# WS stream: ws://<server-ip-or-domain>:3110/stream  |  HTTP API: http://<server-ip-or-domain>:3110"
else
  PORTS_DOC="# WS feed:   ws://<server-ip-or-domain>:3111/feed    |  HTTP API: http://<server-ip-or-domain>:3111"
fi

cat > "$UNIT_FILE" <<EOF
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

# ── enable & start ────────────────────────────────────────────────────────────
section "Enabling and starting ${SERVICE_NAME}"
systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"
sleep 2
systemctl --no-pager status "${SERVICE_NAME}" || warn "${SERVICE_NAME} did not start cleanly -- check: journalctl -u ${SERVICE_NAME}"

echo ""
info "Setup complete!"
echo ""
echo -e "  ${BOLD}Service name${RESET}     ${SERVICE_NAME}"
echo -e "  ${BOLD}Binary${RESET}           ${BINARY_DEST}"
echo -e "  ${BOLD}Environment file${RESET} ${ENV_FILE}"
echo -e "  ${BOLD}Logs${RESET}             journalctl -fu ${SERVICE_NAME}"
echo ""
echo -e "  Edit ${ENV_FILE} to change configuration, then:"
echo -e "  ${BOLD}sudo systemctl restart ${SERVICE_NAME}${RESET}"
echo ""
