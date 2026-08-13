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

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 401 | Missing/invalid token, or inactive account |
| 403 | Missing permission, or target outside the actor's hierarchy |
| 404 | Record not found |
| 422 | Validation or business-rule failure |
