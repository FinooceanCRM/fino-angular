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

### Relationship Manager module (Phase 7)

All routes below require `auth:sanctum` + `auth.active` + `role:relationship_manager`.
Every other role receives `403`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/relationship-managers/dashboard` | Welcome, team summary, employee count, connector count, account status |
| GET | `/api/v1/relationship-managers/profile` | Own RM profile (auto-provisioned on first read) |
| PUT | `/api/v1/relationship-managers/profile` | Update own profile |
| GET | `/api/v1/relationship-managers/employees` | Employees assigned to the authenticated RM |
| GET | `/api/v1/relationship-managers/connectors` | Connectors assigned to the authenticated RM |

### PUT /relationship-managers/profile

All fields optional. `name` and `phone` update the `users` row; every other
field updates the `relationship_managers` row. Role, status, `rm_code` and the
reporting link to a Manager are **not** editable by the RM.

```json
{
  "name": "Relationship Manager One",
  "phone": "9830000001",
  "designation": "Relationship Manager",
  "branch": "Andheri Branch",
  "region": "West",
  "alternate_phone": "9830000011",
  "address_line1": "20 Finance Street",
  "address_line2": null,
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

Validation: `pincode` 4–10 digits.

### GET /relationship-managers/employees

Returns `{ "total": n, "employees": [...] }` containing only users with the
`employee` role whose `relationship_manager_id` matches the authenticated RM.

### GET /relationship-managers/connectors

Returns `{ "total": n, "connectors": [...] }` containing only connector
profiles whose `relationship_manager_id` matches the authenticated RM.
Connectors remain outside the reporting hierarchy; the RM is only their point
of contact.

## Manager module (Phase 8)

All routes are prefixed with `/api/v1/managers` and protected by
`auth:sanctum` + `auth.active` + `role:manager`. Every response is scoped to
the authenticated Manager's own subtree.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/managers/dashboard` | Manager info, team summary, team hierarchy, quick actions |
| GET | `/managers/profile` | The Manager's own profile |
| PUT | `/managers/profile` | Update the Manager's own profile |
| GET | `/managers/relationship-managers` | Relationship Managers reporting to the Manager |
| POST | `/managers/relationship-managers` | Create a Relationship Manager under the Manager |
| PUT | `/managers/relationship-managers/{id}` | Update / activate / deactivate an owned RM |
| GET | `/managers/employees` | Employees belonging to the Manager's RMs (read-only) |

### GET /managers/dashboard

```json
{
  "welcome": { "headline": "Welcome back, Manager One.", "message": "..." },
  "manager": { "id": 2, "name": "Manager One", "manager_code": "MGR-0002", "branch": "..." },
  "role": { "value": "manager", "label": "Manager", "description": "..." },
  "reports_to": { "id": 1, "name": "Super Admin", "role_label": "Super Admin" },
  "team_summary": {
    "relationship_manager_count": 2,
    "active_relationship_manager_count": 2,
    "employee_count": 4,
    "active_employee_count": 4,
    "total_members": 6
  },
  "hierarchy": [
    {
      "id": 4, "name": "RM One", "email": "rm1@finoocean.test", "is_active": true,
      "employees": [{ "id": 8, "name": "Employee One", "email": "employee1@finoocean.test", "is_active": true }]
    }
  ],
  "account_status": { "is_active": true, "status": "Active", "profile_complete": true },
  "quick_actions": [{ "label": "View profile", "route": "/manager/profile", "icon": "badge" }]
}
```

### PUT /managers/profile

Editable: `name`, `phone`, `designation`, `branch`, `region`,
`alternate_phone`, `address_line1`, `address_line2`, `city`, `state`,
`pincode`. Role, status, `manager_code` and the reporting link to the Super
Admin are never editable.

### POST /managers/relationship-managers

```json
{
  "name": "RM Five",
  "email": "rm5@finoocean.test",
  "password": "12345678",
  "phone": "9000000005",
  "is_active": true,
  "designation": "Relationship Manager",
  "branch": "Andheri",
  "region": "West"
}
```

The new user is always created with `role = relationship_manager` and
`manager_id` set to the acting Manager. The caller cannot choose a parent.

### PUT /managers/relationship-managers/{id}

Accepts the same fields; `password` may be omitted or `null` to keep the
existing one. Setting `is_active` performs activation/deactivation. A `403` is
returned when the RM is not part of the Manager's team.

### GET /managers/employees

Returns `{ "total": n, "employees": [...] }` containing only employees whose
`relationship_manager_id` points at one of the Manager's RMs. Each row
includes the owning `relationship_manager`.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 401 | Missing/invalid token, or inactive account |
| 403 | Missing permission, or target outside the actor's hierarchy |
| 404 | Record not found |
| 422 | Validation or business-rule failure |


## Loan management (Phase 9)

All endpoints below require `Authorization: Bearer <token>` and an active
account. Reads are hierarchy-scoped inside the repository, so two users calling
the same URL legitimately receive different rows.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/leads` | Paginated, searchable, filterable lead list |
| GET | `/api/v1/leads/metadata` | Status, loan-type and employment catalogues |
| GET | `/api/v1/leads/assignable-users` | Users the caller may assign leads to |
| POST | `/api/v1/leads` | Create a lead (status starts at `new`) |
| GET | `/api/v1/leads/{id}` | Lead, status history and stored bank matches |
| PUT | `/api/v1/leads/{id}` | Update applicant/loan fields |
| DELETE | `/api/v1/leads/{id}` | Soft-delete a lead (Super Admin only) |
| POST | `/api/v1/leads/{id}/assign` | Route the lead down the hierarchy |
| POST | `/api/v1/leads/{id}/status` | Change status with remarks |
| POST | `/api/v1/leads/{id}/match` | Run the matching engine and store matches |
| GET | `/api/v1/leads/{id}/documents` | Documents attached to a lead |
| POST | `/api/v1/leads/{id}/documents` | Upload a document (multipart) |
| GET | `/api/v1/documents/{id}/download` | Stream a stored document |
| DELETE | `/api/v1/documents/{id}` | Delete a document and its file |
| GET | `/api/v1/banks` | Bank criteria list (search, loan type, active) |
| POST | `/api/v1/banks` | Create bank criteria (Super Admin) |
| GET | `/api/v1/banks/{id}` | Single bank product |
| PUT | `/api/v1/banks/{id}` | Update bank criteria (Super Admin) |
| DELETE | `/api/v1/banks/{id}` | Delete bank criteria (Super Admin) |
| GET | `/api/v1/notifications` | Own notifications, `?unread=1` supported |
| POST | `/api/v1/notifications/{id}/read` | Mark one as read |
| POST | `/api/v1/notifications/read-all` | Mark every notification as read |
| GET | `/api/v1/reports/dashboard` | Role-aware dashboard statistics |

### Search, filtering and pagination

`GET /api/v1/leads` accepts `search`, `status`, `loan_type`, `city`, `state`,
`assigned_employee_id`, `connector_id`, `min_amount`, `max_amount`, `sort`
(`created_at`, `loan_amount`, `applicant_name`, `status`), `direction`
(`asc`/`desc`), `page` and `per_page`. Pagination values are returned in the
`meta` object of the standard envelope.

### Matching response

`POST /api/v1/leads/{id}/match` returns `evaluated`, `matched`, the `matches`
array (bank, product, interest rate, score 0-100 and the reasons that were met)
and a `rejected` array explaining why a product did not qualify.
