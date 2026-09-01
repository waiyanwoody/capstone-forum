# Community Forum (Spring Boot)

A modern forum backend built with Spring Boot, designed for local development and Docker deployments.

Status: development

Tech stack: Java · Spring Boot · Maven · Thymeleaf · WebSocket · Docker

Table of contents
- Introduction
- Quick Start
- Configuration
- Project Layout
- Build & Test
- Running with Docker
- Contributing
- Troubleshooting
- Where to look next

Introduction
------------

This repository contains the backend server, configuration, and tests for the Community Forum application. It focuses on the server-side components (controllers, services, persistence, security, and notification features).

Quick Start
-----------

Prerequisites
- Java 17+
- Maven (optional — wrapper included)
- Docker & Docker Compose (optional)

Clone the repository

```bash
git clone https://github.com/waiyanwoody/spring_forum
cd spring_forum
```

Run locally (using wrapper)

Windows (PowerShell)
```powershell
.\mvnw.cmd spring-boot:run
```

Unix / macOS
```bash
./mvnw spring-boot:run
```

Database (MySQL) — quick Docker option

```bash
docker run --name communityforum-db \
  -e MYSQL_USER=forum \
  -e MYSQL_PASSWORD=forumpass \
  -e MYSQL_DATABASE=community_forum \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -p 3306:3306 -d mysql:8.0
```

Or create the database manually with the MySQL client:

```sql
CREATE DATABASE community_forum;
```

Configuration
-------------

Environment-specific properties live in `src/main/resources`:
- `application.properties` — base
- `application-local.properties` — local/dev overrides

Key datasource properties (example)

```
spring.datasource.url=jdbc:mysql://localhost:3306/community_forum
spring.datasource.username=forum
spring.datasource.password=forumpass
```

Project layout
--------------

- `src/main/java/com/example/communityforum` — application code
  - `api/controller` — REST / MVC controllers
  - `config` — infrastructure and app configuration
  - `service` — business logic
  - `persistence/entity` and `persistence/repository` — JPA entities & repos
  - `security` — auth and security components
- `src/main/resources/templates` — Thymeleaf templates (email/views)
- `src/main/resources/static` — static assets (e.g., notification-test.html)
- `src/test/java` — unit and integration tests

Build & Test
-----------

Build package

```bash
./mvnw clean package
```

Run tests

```bash
./mvnw test
```

Run with Docker Compose
----------------------

```bash
docker-compose up --build
```

Notes
- For quick development you can switch to an in-memory H2 database by using a profile configured for H2.

Contributing
------------

- Open issues for bugs or features.
- Fork the repo, add tests for new behavior, and submit a pull request.

Troubleshooting
---------------

- Java version problems: ensure `JAVA_HOME` points to Java 17 or newer.
- To run with a specific Spring profile, add `-Dspring.profiles.active=local` to the JVM args when starting.

Where to look next
------------------

- Application entry: [src/main/java/com/example/communityforum/CommunityForumApplication.java](src/main/java/com/example/communityforum/CommunityForumApplication.java)
- Data seeder: [src/main/java/com/example/communityforum/DataSeeder.java](src/main/java/com/example/communityforum/DataSeeder.java)

License
-------

This repository does not currently include a license.