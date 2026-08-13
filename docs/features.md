# Features

Status legend: **done** = implemented and tested, **planned** = not built yet.

## Authentication (Phase 2) — done

- Bearer-token login, logout and current-user endpoints.
- Angular login page with Reactive Forms and signal-driven state.
- HTTP interceptor attaching `Authorization: Bearer <token>`.
- Session persistence in `localStorage`, revalidated against `/auth/me`.
- Inactive accounts are rejected at authentication.

## Database schema (Phase 3) — done

- `users`, `roles`, `permissions`, `loan_leads`, `lead_assignments`,
  `bank_criteria`, `lead_matches`, `lead_status_history`, `documents`,
  `notifications`.
- Eloquent models, factories and seeders; ER diagram in `docs/database.md`.

## User hierarchy and access control (Phase 4) — done

- Role enum, permission enum, `role` and `permission` middleware.
- `UserPolicy` + `UserHierarchyService` scoping every read and write to the
  actor's subtree.
- User CRUD APIs: `GET/POST /users`, `GET/PUT/DELETE /users/{id}`.
- Angular `authGuard`, `roleGuard`, `permissionGuard` and unauthorized page.

## Connector module (Phase 5) — done

### Backend

- `connectors` table: 1:1 with `users`, holds only connector-specific data
  (company, contact person, alternate phone, address, city, state, pincode,
  PAN, GST). No user identity fields are duplicated.
- `Connector` model, factory and `ConnectorSeeder`.
- `ConnectorService` (business rules), `EloquentConnectorRepository`
  (persistence), `ConnectorPolicy` (authorization),
  `UpdateConnectorProfileRequest` (validation).
- Endpoints:
  - `GET /api/v1/connectors/dashboard`
  - `GET /api/v1/connectors/profile`
  - `PUT /api/v1/connectors/profile`
- Guarded by `auth:sanctum` + `auth.active` + `role:connector`; every other
  role receives `403`.
- Profile rows are auto-provisioned on first read, so a freshly created
  connector never sees a missing-profile error.

### Frontend

- `/connector/dashboard` — welcome card, user information card, role
  information card and account status card.
- `/connector/profile` — Reactive Forms profile view/edit with client-side
  validation mirroring the backend rules; email is read-only.
- `ConnectorService` transport layer over the shared `ApiService`.
- Route guards (`authGuard`, `roleGuard` with `roles: ['connector']`).
- Role-aware navigation menu: connectors see their own dashboard and profile
  links instead of the generic dashboard.

## Employee module (Phase 6) — done

### Backend

- `employees` table: 1:1 with `users`, holds only employee-specific data
  (employee code, designation, department, date of joining, alternate phone,
  address, city, state, pincode, emergency contact). Identity and reporting
  links are not duplicated.
- `Employee` model, factory and `EmployeeSeeder`.
- `EmployeeService` (business rules), `EloquentEmployeeRepository`
  (persistence), `EmployeePolicy` (authorization),
  `UpdateEmployeeProfileRequest` (validation).
- Endpoints:
  - `GET /api/v1/employees/dashboard`
  - `GET /api/v1/employees/profile`
  - `PUT /api/v1/employees/profile`
  - `GET /api/v1/employees/team`
- Guarded by `auth:sanctum` + `auth.active` + `role:employee`; every other
  role receives `403`.
- Employees can access only their own information: they cannot create users,
  edit other users, or reach Manager, Super Admin or Connector routes.

### Frontend

- `/employee/dashboard` — welcome section, employee information, assigned
  Relationship Manager, account status and quick actions.
- `/employee/profile` — Reactive Forms view/edit of the employee's own
  profile; email and employee code are read-only.
- `/employee/team` — employee details and the reporting Relationship Manager
  (plus the read-only reporting chain).
- `EmployeeService` transport layer over the shared `ApiService`.
- Route guards (`authGuard`, `roleGuard` with `roles: ['employee']`).
- Role-aware navigation menu entries for employees.

## Not implemented

- Loan leads, lead assignment, lead matching.
- Banker, manager and Super Admin workflows.
- Documents and notifications UI.
- Reports and analytics.
- Vendor role (removed permanently).
