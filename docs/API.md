# FINOOCEAN API — Authentication (v1)

Base URL: `http://localhost:8000/api/v1`

All responses use the standard envelope:

```json
{ "success": true, "data": {}, "message": null, "meta": {} }
```

Errors:

```json
{ "success": false, "data": null, "message": "…", "errors": {} }
```

Authentication uses Laravel Sanctum personal access tokens. Send the token as
`Authorization: Bearer <token>` on every protected request.

## Roles

| Value                  | Label                | Parent role          |
| ---------------------- | -------------------- | -------------------- |
| `super_admin`          | Super Admin          | —                    |
| `manager`              | Manager              | Super Admin          |
| `relationship_manager` | Relationship Manager | Manager              |
| `employee`             | Employee             | Relationship Manager |
| `banker`               | Banker               | Super Admin/Manager  |
| `connector`            | Connector            | Super Admin/Manager  |

Hierarchy: `Super Admin -> Manager (N) -> Relationship Manager (N) -> Employee (N)`.
Banker and Connector are standalone roles.

## POST /auth/login

Rate limited to 10 requests/minute.

Request:

```json
{ "email": "superadmin@finoocean.test", "password": "Password123!", "device_name": "web" }
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Super Admin", "email": "superadmin@finoocean.test", "role": "super_admin", "role_label": "Super Admin", "manager_id": null, "relationship_manager_id": null, "employee_id": null, "phone": null, "is_active": true, "created_at": "2026-01-01T00:00:00+00:00" },
    "token": "1|xxxxxxxx",
    "token_type": "Bearer"
  },
  "message": "Logged in successfully."
}
```

Errors: `422` invalid payload or wrong credentials, `403` deactivated account,
`429` too many attempts.

## GET /auth/me

Requires `Authorization: Bearer <token>`. Returns the current user resource.
`401` when the token is missing, expired, or revoked.

## POST /auth/logout

Requires a bearer token. Revokes the token used for the request. Returns `200`
with `data: null`.

## Role middleware

Alias `role`, registered in `bootstrap/app.php`:

```php
Route::get('reports', [ReportController::class, 'index'])
    ->middleware(['auth:sanctum', 'role:super_admin,manager']);
```

Returns `403` when the authenticated user's role is not in the list, `401`
when unauthenticated.

## Seeded accounts

Password for every seeded account: `Password123!`

| Email                     | Role                 | Reports to |
| ------------------------- | -------------------- | ---------- |
| superadmin@finoocean.test | Super Admin          | —          |
| manager1@finoocean.test   | Manager              | Super Admin |
| manager2@finoocean.test   | Manager              | Super Admin |
| rm1@finoocean.test        | Relationship Manager | Manager 1  |
| rm2@finoocean.test        | Relationship Manager | Manager 1  |
| rm3@finoocean.test        | Relationship Manager | Manager 2  |
| rm4@finoocean.test        | Relationship Manager | Manager 2  |
| banker@finoocean.test     | Banker               | Manager 1  |
| connector@finoocean.test  | Connector            | Manager 1  |

Run `php artisan migrate --seed` to create them.

---

## Phase 4 — Users & access control

User management endpoints (`GET/POST/PUT/DELETE /api/v1/users`) are documented in
[api-inventory.md](./api-inventory.md). Role capabilities are listed in
[user-roles.md](./user-roles.md) and the enforcement rules in
[business-rules.md](./business-rules.md).
