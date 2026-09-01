#!/usr/bin/env bash
# Dev loop for the Spring Boot backend: compile + run (no image rebuild).
#
#   1. Compiles the jar using a throwaway Maven container.
#      ~/.m2 is mounted so dependencies are cached between runs (fast after the first).
#   2. Starts the backend using docker-compose.dev.yml (jar is volume-mounted).
#
# Usage:  scripts/dev-backend.sh            # compile + start + follow logs
#         scripts/dev-backend.sh restart    # just restart with the latest jar
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
SPRING_DIR="$ROOT/springboot-app"

if [ "${1:-}" = "restart" ]; then
  docker compose -f docker-compose.yml -f docker-compose.dev.yml restart backend
  exit 0
fi

echo "==> Compiling Spring Boot app (maven in docker)..."
docker run --rm \
  -v "$SPRING_DIR":/build \
  -w /build \
  -v "${HOME}/.m2:/root/.m2" \
  maven:3.9-eclipse-temurin-17 \
  mvn -q package -DskipTests

echo "==> Starting backend (mounted jar, no image rebuild)..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend

echo "==> Backend running. Following logs (Ctrl+C to stop, app keeps running)..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f -t backend