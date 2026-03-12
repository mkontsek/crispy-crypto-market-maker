#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXCHANGE_BIN="$REPO_ROOT/apps/exchange/target/release/crispy-exchange"
BOT_BIN="$REPO_ROOT/apps/bot/target/release/crispy-bot"
LOG_DIR="$REPO_ROOT/logs"
EXCHANGE_PID_FILE="$LOG_DIR/exchange.pid"
BOT_PID_FILE="$LOG_DIR/bot.pid"
EXCHANGE_LOG="$LOG_DIR/exchange.log"
BOT_LOG="$LOG_DIR/bot.log"
EXCHANGE_PORTS=(8082 8083)
BOT_PORTS=(8080 8081)

mkdir -p "$LOG_DIR"

usage() {
  echo "Usage: $0 {start|start:exchange|start:bot|stop|restart|status|logs}"
  echo ""
  echo "  start           Build (if needed) and start exchange + bot in the background"
  echo "  start:exchange  Start only the exchange"
  echo "  start:bot       Start only the bot"
  echo "  stop            Stop both services"
  echo "  restart         Stop then start"
  echo "  status          Show running status and PIDs"
  echo "  logs            Tail logs for both services (Ctrl+C to exit)"
  exit 1
}

build_if_needed() {
  local bin="$1"
  local dir="$2"
  if [[ ! -f "$bin" ]]; then
    echo "Binary not found, building $dir ..."
    (cd "$dir" && cargo build --release)
  fi
}

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

cleanup_stale_listeners() {
  local name="$1"
  local expected_cmd_fragment="$2"
  shift 2
  local ports=("$@")

  for port in "${ports[@]}"; do
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      local cmd
      cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)

      if [[ "$cmd" == *"$expected_cmd_fragment"* ]]; then
        echo "Stopping existing $name process on :$port (PID $pid)"
        terminate_pid "$pid"
      else
        echo "Port :$port is in use by PID $pid ($cmd)"
        echo "Refusing to kill non-$name process. Stop it manually, then retry."
        return 1
      fi
    done < <(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  done
}

start_service() {
  local name="$1"
  local bin="$2"
  local pid_file="$3"
  local log_file="$4"
  local expected_cmd_fragment="$5"
  shift 5
  local ports=("$@")

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name is already running (PID $(cat "$pid_file"))"
    return
  fi

  cleanup_stale_listeners "$name" "$expected_cmd_fragment" "${ports[@]}"
  rm -f "$pid_file"

  nohup "$bin" >> "$log_file" 2>&1 &
  echo $! > "$pid_file"
  echo "Started $name (PID $!) — logs: $log_file"
}

stop_service() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name is not running (no PID file)"
    return
  fi

  local pid
  pid=$(cat "$pid_file")
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    rm -f "$pid_file"
    echo "Stopped $name (PID $pid)"
  else
    echo "$name was not running (stale PID $pid)"
    rm -f "$pid_file"
  fi
}

status_service() {
  local name="$1"
  local pid_file="$2"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "  $name: running (PID $(cat "$pid_file"))"
  else
    echo "  $name: stopped"
  fi
}

cmd="${1:-}"
case "$cmd" in
  start)
    build_if_needed "$EXCHANGE_BIN" "$REPO_ROOT/apps/exchange"
    build_if_needed "$BOT_BIN"      "$REPO_ROOT/apps/bot"
    start_service \
      "exchange" \
      "$EXCHANGE_BIN" \
      "$EXCHANGE_PID_FILE" \
      "$EXCHANGE_LOG" \
      "$(basename "$EXCHANGE_BIN")" \
      "${EXCHANGE_PORTS[@]}"
    # Give the exchange a moment to bind its ports before starting the bot
    sleep 1
    start_service \
      "bot" \
      "$BOT_BIN" \
      "$BOT_PID_FILE" \
      "$BOT_LOG" \
      "$(basename "$BOT_BIN")" \
      "${BOT_PORTS[@]}"
    ;;
  start:exchange)
    build_if_needed "$EXCHANGE_BIN" "$REPO_ROOT/apps/exchange"
    start_service \
      "exchange" \
      "$EXCHANGE_BIN" \
      "$EXCHANGE_PID_FILE" \
      "$EXCHANGE_LOG" \
      "$(basename "$EXCHANGE_BIN")" \
      "${EXCHANGE_PORTS[@]}"
    ;;
  start:bot)
    build_if_needed "$BOT_BIN" "$REPO_ROOT/apps/bot"
    start_service \
      "bot" \
      "$BOT_BIN" \
      "$BOT_PID_FILE" \
      "$BOT_LOG" \
      "$(basename "$BOT_BIN")" \
      "${BOT_PORTS[@]}"
    ;;
  stop)
    stop_service "bot"      "$BOT_PID_FILE"
    stop_service "exchange" "$EXCHANGE_PID_FILE"
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  status)
    echo "Service status:"
    status_service "exchange" "$EXCHANGE_PID_FILE"
    status_service "bot"      "$BOT_PID_FILE"
    ;;
  logs)
    tail -f "$EXCHANGE_LOG" "$BOT_LOG"
    ;;
  *)
    usage
    ;;
esac
