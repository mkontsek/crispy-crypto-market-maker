#!/usr/bin/env bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <port> [port ...]"
  exit 1
fi

terminate_pid() {
  local pid="$1"

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  kill "$pid" 2>/dev/null || true
  for _ in {1..30}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      return
    fi
    sleep 0.1
  done

  kill -9 "$pid" 2>/dev/null || true
}

free_port() {
  local port="$1"

  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    local cmd
    cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)
    echo "Port :$port is in use by PID $pid ($cmd). Stopping..."
    terminate_pid "$pid"
  done < <(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true)
}

for port in "$@"; do
  free_port "$port"
done
