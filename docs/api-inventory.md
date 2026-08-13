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

## Employee module (Phase 6)

All routes require `auth:sanctum` + `auth.active` + `role:employee`.
Every response is scoped to the authenticated employee only.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/employees/dashboard` | Welcome, employee info, assigned RM, account status, quick actions |
| GET | `/api/v1/employees/profile` | Own profile (auto-provisioned on first read) |
| PUT | `/api/v1/employees/profile` | Update own profile |
| GET | `/api/v1/employees/team` | Own details + reporting Relationship Manager |

### GET /employees/dashboard

```json
{
  "data": {
    "welcome": { "headline": "Welcome back, Employee 1.", "message": "This is your employee workspace." },
    "employee": {
      "id": 8, "name": "Employee 1", "email": "employee1@finoocean.test",
      "phone": null, "employee_code": "EMP-0001",
      "designation": "Loan Executive", "department": "Sales",
      "date_of_joining": "2025-08-01", "member_since": "2026-01-01T00:00:00+00:00"
    },
    "role": { "value": "employee", "label": "Employee", "description": "..." },
    "relationship_manager": { "id": 4, "name": "Relationship Manager One", "email": "rm1@finoocean.test", "role_label": "Relationship Manager", "is_active": true },
    "manager": { "id": 2, "name": "Manager One", "role_label": "Manager", "is_active": true },
    "account_status": { "is_active": true, "status": "Active", "profile_complete": true },
    "quick_actions": [{ "label": "View profile", "route": "/employee/profile", "icon": "badge" }]
  }
}
```

### PUT /employees/profile

All fields optional. `name` and `phone` update the `users` row; every other
field updates the `employees` row. Role, status, `employee_code` and the
reporting links are **not** editable by the employee.

```json
{
  "name": "Employee One",
  "phone": "9810000001",
  "designation": "Senior Loan Executive",
  "department": "Sales",
  "alternate_phone": "9820000001",
  "address_line1": "10 Business Park",
  "address_line2": null,
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "emergency_contact_name": "Emergency Contact 1",
  "emergency_contact_phone": "9820000001"
}
```

Validation: `pincode` 4–10 digits. Any non-employee role receives `403`.

### GET /employees/team

Returns `employee`, `relationship_manager`, `manager` and `reporting_chain`
(read-only). Employees cannot see peers or other users.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 401 | Missing/invalid token, or inactive account |
| 403 | Missing permission, or target outside the actor's hierarchy |
| 404 | Record not found |
| 422 | Validation or business-rule failure |
