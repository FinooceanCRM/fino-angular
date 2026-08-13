# FINOOCEAN

Loan management platform rebuild.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 20, Standalone Components, Angular Material, Reactive Forms, Signals |
| Backend | Laravel 12, PHP 8.2, REST API, Laravel Sanctum, Service + Repository layers |
| Database | MySQL (XAMPP) |
| Tooling | GitHub Actions |

No Docker, no containers. Everything runs directly on the local machine.

## Repository structure

```
├── backend/     Laravel 12 REST API
├── frontend/    Angular 20 application
├── database/    Schema notes and seed placeholders
├── docs/        Architecture, setup and API documentation
├── tests/       Cross-cutting / integration test placeholders
├── postman/     Postman collection and environment
└── .github/     CI workflows
```

## Quick start (Windows 10 + XAMPP)

1. Start Apache/MySQL from the XAMPP control panel and create a database named
   `finoocean` in phpMyAdmin.
2. Backend:

```sh
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan route:list
php artisan serve
```

3. Frontend (new terminal):

```sh
cd frontend
npm install
npm start
```

- API: http://localhost:8000/api/v1/health
- App: http://localhost:4200

Full instructions: [docs/SETUP.md](docs/SETUP.md). API reference: [docs/API.md](docs/API.md) and [docs/api-inventory.md](docs/api-inventory.md).
Roles and hierarchy: [docs/user-roles.md](docs/user-roles.md). Business rules: [docs/business-rules.md](docs/business-rules.md).

## Status

Phase 2 complete: authentication module (login, logout, current user, auth +
role middleware, Sanctum configuration, auth service/repository, validation
requests, Angular login and unauthorized pages, guards, interceptor, session
persistence, `users` and `personal_access_tokens` migrations, role seeders).
Awaiting approval before Phase 3.
