# Database

MySQL 8, `utf8mb4_unicode_ci`.

Phase 1 defines no tables. The schema, Laravel migrations, and seed data are
introduced in Phase 2.

- `schema/` — raw SQL reference dumps
- `../seeds/` — seed data scripts

## Create the database

```sql
CREATE DATABASE finoocean
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```
