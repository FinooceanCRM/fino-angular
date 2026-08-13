# Database

MySQL 8, `utf8mb4_unicode_ci`.

The authoritative schema lives in Laravel migrations under
`backend/database/migrations/`. See `docs/database.md` for the table reference
and ER diagram.

- `schema/` — raw SQL reference dumps
- `../seeds/` — seed data scripts

## Create the database

```sql
CREATE DATABASE finoocean
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

## Apply schema and seed data

```bash
cd backend
php artisan migrate
php artisan db:seed
```
