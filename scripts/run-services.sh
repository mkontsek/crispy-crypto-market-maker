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

start_service() {
  local name="$1"
  local bin="$2"
  local pid_file="$3"
  local log_file="$4"

  if [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name is already running (PID $(cat "$pid_file"))"
    return
  fi

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
    start_service "exchange" "$EXCHANGE_BIN" "$EXCHANGE_PID_FILE" "$EXCHANGE_LOG"
    # Give the exchange a moment to bind its ports before starting the bot
    sleep 1
    start_service "bot"      "$BOT_BIN"      "$BOT_PID_FILE"      "$BOT_LOG"
    ;;
  start:exchange)
    build_if_needed "$EXCHANGE_BIN" "$REPO_ROOT/apps/exchange"
    start_service "exchange" "$EXCHANGE_BIN" "$EXCHANGE_PID_FILE" "$EXCHANGE_LOG"
    ;;
  start:bot)
    build_if_needed "$BOT_BIN" "$REPO_ROOT/apps/bot"
    start_service "bot" "$BOT_BIN" "$BOT_PID_FILE" "$BOT_LOG"
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
