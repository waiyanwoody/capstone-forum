# Community Forum

Full-stack forum app with real-time notifications. Monorepo with two apps plus Docker for MySQL.

| Piece     | Stack                                              | Location       |
|-----------|----------------------------------------------------|----------------|
| Frontend  | Next.js 15 (App Router), React 19, Tailwind 4      | `frontend-app` |
| Backend   | Spring Boot 3.5 (Java 17), Spring Security + JWT, WebSocket/STOMP, JPA | `springboot-app` |
| Database  | MySQL 8 (Docker)                                   | `db` service   |

## Prerequisites

- Docker Desktop with Docker Compose
- Node.js 20+ (only needed for running the frontend in dev mode)

## First run (full stack in Docker)

```bash
# 1. Backend env file. Fill in real values (see the template).
cp springboot-app/.env.example springboot-app/.env

# 2. Build + start everything (db, backend, frontend)
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger API docs: http://localhost:8080/docs
- Seeded login: `admin` / `admin123` (regular seeded users use `password123`)

## Making changes (fast dev loop)

You do **not** need to rebuild Docker images while developing.

### Backend — auto-reload

```bash
scripts/dev-backend.sh         # start backend in dev mode (db starts too), follow logs
scripts/dev-backend.sh logs    # follow logs
scripts/dev-backend.sh restart # restart the dev container
scripts/dev-backend.sh stop    # stop the dev container
```

The dev container mounts the backend source and runs `mvn spring-boot:run` with
Spring Boot DevTools. A watcher recompiles on save, so **saving a Java file
auto-restarts the app after a few seconds** — no image rebuild. Maven dependencies
are cached in `~/.m2` (first run downloads them, later runs are fast).

### Frontend — hot reload

```bash
cd frontend-app
npm install --legacy-peer-deps
npm run dev
```

Leave `db` + the dev backend running from above; the frontend talks to
`http://localhost:8080`. Changes hot-reload instantly.

### Production-style image rebuilds (release)

```bash
docker compose up -d --build            # full stack
docker compose up -d --build backend    # backend image only
```

## Project layout

```
frontend-app/            Next.js app (UI, API client, WebSocket notifications)
springboot-app/          Spring Boot app (REST API, auth, WS, email)
  src/main/resources/    application.properties, templates
  .env                   real secrets (gitignored - never commit)
  .env.example           template for collaborators
scripts/                 dev-backend.sh, backend-watcher.sh (inside dev container)
docker-compose.yml       production-style stack (db + backend + frontend images)
docker-compose.dev.yml   dev overlay: backend auto-reload (no image build)
```

## Troubleshooting

- **Backend fails to start** — `springboot-app/.env` is missing or missing keys.
  Copy `.env.example` and fill it in. In the Docker stack, compose sets
  `DB_URL=jdbc:mysql://db:3306/community_forum` automatically.
- **DB password wrong / fresh database wanted** — `MYSQL_ROOT_PASSWORD` defaults to
  `Milomilo112`; keep it in sync with `DB_PASSWORD`. To reset the DB:
  `docker compose down -v` then `docker compose up -d` (this **deletes** all data,
  including uploaded files).
- **Port 8080/3000 already in use** — stop whatever is on those ports, or change
  the `ports:` mapping in `docker-compose.yml` and `NEXT_PUBLIC_API_URL`.
- **First `scripts/dev-backend.sh` is slow** — Maven is downloading dependencies
  into `~/.m2`; subsequent runs are much faster.
- **Uploaded files/avatars disappear** — they live in the `uploads` named volume
  (`docker compose down -v` removes it).