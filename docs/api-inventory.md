# API Inventory

Base URL: `http://localhost:8000/api/v1`
Auth: `Authorization: Bearer <token>` (Laravel Sanctum personal access tokens).
Every response uses the envelope `{ success, data, message, errors|meta }`.

## Authentication

| Method | Endpoint | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | public | — | Issue a bearer token |
| GET | `/auth/me` | bearer | — | Current authenticated user |
| POST | `/auth/logout` | bearer | — | Revoke the current token |

## Users (Phase 4)

| Method | Endpoint | Auth | Permission | Hierarchy check |
| --- | --- | --- | --- | --- |
| GET | `/users` | bearer | `users.view` | Result set scoped to the actor's subtree |
| GET | `/users/{id}` | bearer | `users.view` | `UserPolicy@view` |
| POST | `/users` | bearer | `users.create` | Role must be assignable by the actor |
| PUT | `/users/{id}` | bearer | `users.update` | `UserPolicy@update` |
| DELETE | `/users/{id}` | bearer | `users.delete` | Super Admin only, cannot self-delete |

### GET /users

Query parameters: `role`, `search`, `is_active`, `page`, `per_page`.

`meta` contains `current_page`, `per_page`, `total`, `last_page` and
`assignable_roles`.

### POST /users

```json
{
  "name": "Relationship Manager Five",
  "email": "rm5@finoocean.test",
  "password": "password123",
  "role": "relationship_manager",
  "manager_id": 2,
  "relationship_manager_id": null,
  "phone": "9999999999",
  "is_active": true
}
```

Hierarchy fields are overwritten server-side when the actor is a Manager or a
Relationship Manager, so a user can never be created outside the actor's subtree.

### PUT /users/{id}

Same body as `POST`, all fields optional. `password` is only re-hashed when
present and non-empty.


## Connectors (Phase 5)

Connectors are independent of the reporting hierarchy. Every endpoint is
scoped to the authenticated connector and is guarded by the `role:connector`
middleware plus `ConnectorPolicy`.

| Method | Endpoint | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| GET | `/connectors/dashboard` | bearer | `connector` | Welcome card, user info, role info, account status |
| GET | `/connectors/profile` | bearer | `connector` | Own connector profile (auto-created on first read) |
| PUT | `/connectors/profile` | bearer | `connector` | Update own profile |

### GET /connectors/dashboard

```json
{
  "success": true,
  "data": {
    "welcome": { "headline": "Welcome back, Connector One.", "message": "..." },
    "user": { "id": 12, "name": "Connector One", "email": "connector1@finoocean.test", "phone": null, "member_since": "2026-01-01T00:00:00+00:00" },
    "role": { "value": "connector", "label": "Connector", "independent": true, "description": "..." },
    "account_status": { "is_active": true, "status": "Active", "profile_complete": true }
  }
}
```

### PUT /connectors/profile

All fields optional. `name` and `phone` update the `users` row; every other
field updates the `connectors` row.

```json
{
  "name": "Connector One",
  "phone": "9800000001",
  "company_name": "Ocean Referral Partners",
  "contact_person": "Connector One",
  "alternate_phone": "9800000002",
  "address_line1": "12 Marine Drive",
  "address_line2": null,
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "pan_number": "ABCDE1234F",
  "gst_number": "27ABCDE1234F1Z5"
}
```

Validation: `pincode` 4–10 digits, `pan_number` exactly 10 alphanumeric
characters (upper-cased server-side). Any non-connector role receives `403`.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 401 | Missing/invalid token, or inactive account |
| 403 | Missing permission, or target outside the actor's hierarchy |
| 404 | Record not found |
| 422 | Validation or business-rule failure |
