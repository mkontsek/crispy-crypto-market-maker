#!/usr/bin/env bash
# Stop the crispy-exchange systemd service.
set -euo pipefail

SERVICE_NAME="crispy-exchange"

[[ "$EUID" -ne 0 ]] && { echo "Run this script with sudo or as root" >&2; exit 1; }

if ! systemctl is-active --quiet "${SERVICE_NAME}" 2>/dev/null; then
  echo "${SERVICE_NAME} is not running"
  exit 0
fi

echo "Stopping ${SERVICE_NAME}..."
systemctl stop "${SERVICE_NAME}"
echo "${SERVICE_NAME} stopped"
