# FINOOCEAN — Loan Management Platform (Rebuild)

Phase 1: scaffold only. No business logic, no database tables, no dashboards.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 20, Standalone Components, Angular Material, Reactive Forms, Signals |
| Backend | Laravel 12, PHP 8.4, REST API, Laravel Sanctum, Service + Repository layers |
| Database | MySQL 8 |
| Tooling | Docker Compose, GitHub Actions |

## Repository structure

```text
/
├── backend/     Laravel 12 API (versioned under /api/v1)
├── frontend/    Angular 20 application
├── database/    SQL schema and seed placeholders
├── docs/        Architecture and setup documentation
├── tests/       Cross-cutting / integration test placeholders
├── postman/     Postman collection and environment
├── docker/      Container build files
└── .github/     CI workflows
```

## Quick start

```sh
git clone <this-repository-url>
cd <repository-name>
cp backend/.env.example backend/.env
docker compose up -d --build
```

- API: http://localhost:8000/api/v1/health
- Frontend: http://localhost:4200

Full instructions: [docs/SETUP.md](docs/SETUP.md).

## Local (without Docker)

```sh
# backend
cd backend && composer install && php artisan key:generate && php artisan serve

# frontend
cd frontend && npm install && npm start
```

## Status

Phase 1 complete: folder structure, Angular scaffold, Laravel scaffold, environment
configuration, Docker configuration, GitHub Actions workflow, documentation.
Awaiting approval before Phase 2.
