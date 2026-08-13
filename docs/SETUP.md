# Development Setup (Windows 10 + XAMPP)

## Requirements

- PHP 8.2.x (bundled with XAMPP) with `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `curl`
- Composer 2.7+
- Node.js 20/22 LTS + npm
- MySQL via XAMPP
- No Docker required

Make sure `php` and `composer` are on your PATH (`C:\xampp\php`).

## 1. Database (MySQL / XAMPP)

Start MySQL in the XAMPP control panel, then create the schema in phpMyAdmin or:

```sh
mysql -u root -e "CREATE DATABASE finoocean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Default XAMPP credentials are user `root` with an empty password — already set in
`backend/.env.example`.

## 2. Backend (Laravel 12)

```sh
cd backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan route:list
php artisan serve --host=127.0.0.1 --port=8000
```

Health check: `GET http://localhost:8000/api/v1/health`

Seeded accounts (password `Password123!`):

| Role | Email |
| --- | --- |
| Super Admin | superadmin@finoocean.test |
| Manager | manager@finoocean.test |
| Relationship Manager | rm@finoocean.test |
| Employee | employee@finoocean.test |
| Banker | banker@finoocean.test |
| Connector | connector@finoocean.test |

## 3. Frontend (Angular 20)

```sh
cd frontend
npm install
npm start          # http://localhost:4200
npm run build      # production build into dist/
npm test           # unit tests
```

API base URL lives in `src/environments/environment.ts`
(and `environment.production.ts` for builds).

## 4. Continuous integration

`.github/workflows/ci.yml` runs on push and pull request:

- Backend: PHP 8.2 setup, `composer validate`, `composer install`, PHPUnit
- Frontend: Node 22, `npm install`, unit tests, production build

## 5. Postman

Import `postman/finoocean.postman_collection.json` and
`postman/finoocean.postman_environment.json`.

## Troubleshooting

- `could not find driver` — enable `extension=pdo_mysql` in `C:\xampp\php\php.ini`.
- `Please provide a valid cache path` — the `backend/storage/framework/*` folders must exist (they are committed with `.gitkeep`).
- CORS errors — check `FRONTEND_URL` in `backend/.env` matches the Angular dev-server origin.
