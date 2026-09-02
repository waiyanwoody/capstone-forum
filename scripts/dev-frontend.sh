#!/usr/bin/env bash
# Frontend dev with HOT-RELOAD (next dev / HMR).
# The dev container mounts the frontend source; Next.js watches files and
# hot-reloads on save. node_modules is installed into a named volume on first
# start. No image rebuild on every change.
#
#   scripts/dev-frontend.sh           # start + follow logs (default)
#   scripts/dev-frontend.sh logs      # follow logs only
#   scripts/dev-frontend.sh restart   # restart the dev container
#   scripts/dev-frontend.sh stop      # stop the dev container
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

case "${1:-}" in
  logs)     "${COMPOSE[@]}" logs -f -t frontend ;;
  restart)  "${COMPOSE[@]}" restart frontend ;;
  stop)     "${COMPOSE[@]}" stop frontend ;;
  "")       "${COMPOSE[@]}" up -d frontend && "${COMPOSE[@]}" logs -f -t frontend ;;
  *)        echo "usage: $0 [logs|restart|stop]"; exit 1 ;;
esac
