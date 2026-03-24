#!/usr/bin/env bash
# Shared helpers sourced by run-bot.sh, run-exchange.sh, stop-bot.sh, stop-exchange.sh.
# Not intended to be executed directly.

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

# setup_system_deps CADDY_DOMAIN SKIP_RUST_INSTALL
# Installs system packages, optionally caddy, and the Rust toolchain.
setup_system_deps() {
  local caddy_domain="$1"
  local skip_rust="$2"
  section "Installing system dependencies"
  export DEBIAN_FRONTEND=noninteractive
  local pkgs=(build-essential pkg-config libssl-dev curl ca-certificates)
  [[ -n "$caddy_domain" ]] && pkgs+=(caddy)
  ensure_packages "${pkgs[@]}"
  if [[ "$skip_rust" == false ]]; then
    section "Installing Rust toolchain"
    if command -v rustup &>/dev/null; then
      info "rustup already present — skipping install"
    else
      info "Installing rustup (non-interactive)"
      curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
        | sh -s -- -y --no-modify-path --default-toolchain stable
      export PATH="${HOME}/.cargo/bin:${PATH}"
    fi
  fi
  command -v cargo &>/dev/null || export PATH="${HOME}/.cargo/bin:${PATH}"
  command -v cargo &>/dev/null || \
    error "cargo not found — ensure Rust is installed or use --skip-rust-install"
  info "Using $(rustc --version)"
}

# ensure_run_user RUN_USER
# Creates a system user if it does not already exist.
ensure_run_user() {
  local run_user="$1"
  section "Ensuring OS user: ${run_user}"
  if ! id "$run_user" &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$run_user"
    info "Created system user '${run_user}'"
  else
    info "User '${run_user}' already exists"
  fi
}

# configure_caddy CADDY_DOMAIN UPSTREAM_PORT SERVICE_NAME
# Writes /etc/caddy/Caddyfile.d/<service>.caddy and reloads caddy if changed.
configure_caddy() {
  local caddy_domain="$1"
  local upstream_port="$2"
  local service_name="$3"
  local caddy_main_file="/etc/caddy/Caddyfile"
  local caddy_dir="/etc/caddy/Caddyfile.d"
  local caddy_service_file="${caddy_dir}/${service_name}.caddy"
  section "Configuring Caddy for ${caddy_domain}"
  mkdir -p "$caddy_dir"
  local caddy_main_changed=false
  if [[ ! -f "$caddy_main_file" ]]; then
    printf 'import /etc/caddy/Caddyfile.d/*.caddy\n' > "$caddy_main_file"
    caddy_main_changed=true
  elif ! grep -Eq '^[[:space:]]*import /etc/caddy/Caddyfile\.d/\*\.caddy[[:space:]]*$' \
      "$caddy_main_file"; then
    printf '\nimport /etc/caddy/Caddyfile.d/*.caddy\n' >> "$caddy_main_file"
    caddy_main_changed=true
  fi
  local caddy_content="${caddy_domain} {
  reverse_proxy 127.0.0.1:${upstream_port}
}
"
  local caddy_changed=false
  if write_file_if_changed "$caddy_service_file" "$caddy_content" 644; then
    info "Wrote ${caddy_service_file}"
    caddy_changed=true
  else
    info "Caddy config already up to date — skipping"
  fi
  caddy validate --config "$caddy_main_file" --adapter caddyfile &>/dev/null || \
    error "Caddy config validation failed for ${caddy_main_file}"
  if ! systemctl is-enabled --quiet caddy; then systemctl enable caddy; fi
  if [[ "$caddy_main_changed" == true || "$caddy_changed" == true ]] || \
      ! systemctl is-active --quiet caddy; then
    systemctl restart caddy
  else
    info "caddy already running with current config — skipping restart"
  fi
}
