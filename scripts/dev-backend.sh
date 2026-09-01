#!/usr/bin/env bash
# Backend dev with AUTO-RELOAD (Spring Boot DevTools).
# The dev container mounts the backend source and ~/.m2; a watcher recompiles on
# save and DevTools restarts the app. No image rebuild, no manual compile step.
#
#   scripts/dev-backend.sh            # start + follow logs (default)
#   scripts/dev-backend.sh logs       # follow logs only
#   scripts/dev-backend.sh restart    # restart the dev container
#   scripts/dev-backend.sh stop       # stop the dev container
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

case "${1:-}" in
  logs)     "${COMPOSE[@]}" logs -f -t backend ;;
  restart)  "${COMPOSE[@]}" restart backend ;;
  stop)     "${COMPOSE[@]}" stop backend ;;
  "")       "${COMPOSE[@]}" up -d backend && "${COMPOSE[@]}" logs -f -t backend ;;
  *)        echo "usage: $0 [logs|restart|stop]"; exit 1 ;;
esac