#!/usr/bin/env bash
# Stop a crispy-bot systemd service.
set -euo pipefail

BOT_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bot-name) BOT_NAME="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$BOT_NAME" ]] && { echo "--bot-name is required" >&2; exit 1; }
[[ "$EUID" -ne 0 ]] && { echo "Run this script with sudo or as root" >&2; exit 1; }

SERVICE_NAME="crispy-bot-${BOT_NAME}"

if ! systemctl is-active --quiet "${SERVICE_NAME}" 2>/dev/null; then
  echo "${SERVICE_NAME} is not running"
  exit 0
fi

echo "Stopping ${SERVICE_NAME}..."
systemctl stop "${SERVICE_NAME}"
echo "${SERVICE_NAME} stopped"
