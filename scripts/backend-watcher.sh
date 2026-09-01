#!/usr/bin/env bash
# Runs INSIDE the dev backend container (source mounted at /build).
# Starts `mvn spring-boot:run` in the foreground; a poll loop recompiles on any
# source change, and Spring Boot DevTools auto-restarts the app. No image rebuild.
set -euo pipefail
cd /build

STAMP=/tmp/backend-watch.stamp
: > "$STAMP"

watch_loop() {
  while true; do
    sleep 2
    if find src -type f -newer "$STAMP" -print -quit | grep -q .; then
      touch "$STAMP"
      echo "[watcher] source changed -> recompiling..."
      mvn -q compile 2>&1 | tail -5
      echo "[watcher] compile done; DevTools restarting app..."
    fi
  done
}

watch_loop &
CHANGE_WATCHER_PID=$!
trap 'kill "$CHANGE_WATCHER_PID" 2>/dev/null || true' EXIT

echo "[watcher] watching /build/src; edit backend files to auto-restart"
mvn spring-boot:run