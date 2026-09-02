#!/usr/bin/env bash
# Seeds demo data (10 users, 20 tags, 50 posts, 100 comments) ON DEMAND.
#
# The app no longer auto-seeds users/posts on startup (DataSeeder now only
# guarantees the admin account). Run this any time you want fresh demo content:
#
#   scripts/seed-demo-data.sh
#
# It boots a one-off Maven container (same image as the dev backend) against the
# running `db`, runs `mvn spring-boot:run` once with --app.seed-demo-data=true,
# exits when the seed finishes, and the startup backfill embeds the new posts.
#
# Idempotent: skipped if any non-admin users already exist (no duplicates on
# re-run). To truly reset, wipe the volume: docker compose down -v && up -d.
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.dev.yml)

if [ ! -f springboot-app/.env ]; then
  echo "ERROR: springboot-app/.env not found (needed for DB credentials)." >&2
  exit 1
fi

echo ">>> Ensuring db is up..."
"${COMPOSE[@]}" up -d db

echo ">>> Running demo-data seed in a one-off container..."
"${COMPOSE[@]}" run --rm --no-deps backend \
  bash -c "cd /build && mvn -q spring-boot:run -Dspring-boot.run.arguments=--app.seed-demo-data=true"

echo "✅ Demo data seed finished."
