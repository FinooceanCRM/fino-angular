# Development Setup

## Requirements

- PHP 8.4 with `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `intl`
- Composer 2.7+
- Node.js 22 LTS + npm 10
- MySQL 8.0
- Docker + Docker Compose (optional but recommended)

## 1. Backend (Laravel 12)

```sh
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan serve --host=0.0.0.0 --port=8000
```

Health check: `GET http://localhost:8000/api/v1/health`

Sanctum SPA authentication expects the frontend origin to be listed in
`SANCTUM_STATEFUL_DOMAINS` and `FRONTEND_URL` in `.env`.

## 2. Frontend (Angular 20)

```sh
cd frontend
npm install
npm start          # http://localhost:4200
npm run build      # production build into dist/
npm test           # unit tests
```

API base URL is configured in `src/environments/environment.ts`
(and `environment.production.ts` for builds).

## 3. Database (MySQL)

```sh
mysql -u root -p -e "CREATE DATABASE finoocean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

No migrations are defined in Phase 1. `database/schema/` holds SQL placeholders
for the upcoming schema work.

## 4. Docker

```sh
docker compose up -d --build
docker compose exec backend php artisan key:generate
docker compose logs -f
docker compose down -v
```

Services: `mysql` (3306), `backend` (8000), `frontend` (4200).

## 5. Continuous integration

`.github/workflows/ci.yml` runs on push and pull request:

- Backend: PHP 8.4 setup, `composer validate`, `composer install`, Pest/PHPUnit
- Frontend: Node 22, `npm ci`, lint, unit tests, production build

## 6. Postman

Import `postman/finoocean.postman_collection.json` and
`postman/finoocean.postman_environment.json`.
