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

## Relationship Manager module (Phase 7)

### Backend

- `relationship_managers` table: 1:1 with `users`, holds only RM-specific data
  (RM code, designation, branch, region, date of joining, alternate phone,
  address, city, state, pincode). Identity and reporting links are not
  duplicated.
- `connectors.relationship_manager_id` (nullable): the RM acting as point of
  contact for a connector. The reporting hierarchy in `users` is untouched.
- `RelationshipManager` model, factory and `RelationshipManagerSeeder`.
- `RelationshipManagerService` (business rules),
  `EloquentRelationshipManagerRepository` (persistence),
  `RelationshipManagerPolicy` (authorization),
  `UpdateRelationshipManagerProfileRequest` (validation).
- Endpoints:
  - `GET /api/v1/relationship-managers/dashboard`
  - `GET /api/v1/relationship-managers/profile`
  - `PUT /api/v1/relationship-managers/profile`
  - `GET /api/v1/relationship-managers/employees`
  - `GET /api/v1/relationship-managers/connectors`
- Guarded by `auth:sanctum` + `auth.active` + `role:relationship_manager`.
- RMs can access only their own team: only employees assigned to them and
  connectors assigned to them. Manager and Super Admin routes stay out of
  reach.

### Frontend

- `/relationship-manager/dashboard` — welcome section, team summary, employee
  count, connector count, account status, quick actions.
- `/relationship-manager/profile` — Reactive Forms view/edit of the RM's own
  profile; email and RM code are read-only.
- `/relationship-manager/employees` — read-only table of assigned employees.
- `/relationship-manager/connectors` — read-only table of assigned connectors.
- `RelationshipManagerService` transport layer over the shared `ApiService`.
- Route guards (`authGuard`, `roleGuard` with
  `roles: ['relationship_manager']`).
- Role-aware navigation menu entries for Relationship Managers.

## Manager module (Phase 8)

### Backend

- `managers` table (1:1 with `users`) for Manager-only profile data:
  `manager_code`, `designation`, `branch`, `region`, `date_of_joining`,
  contact and address fields.
- `ManagerService`, `EloquentManagerRepository`, `ManagerPolicy`,
  `ManagerProfileResource` and `ManagerController`.
- Endpoints:
  - `GET /api/v1/managers/dashboard`
  - `GET /api/v1/managers/profile`
  - `PUT /api/v1/managers/profile`
  - `GET /api/v1/managers/relationship-managers`
  - `POST /api/v1/managers/relationship-managers`
  - `PUT /api/v1/managers/relationship-managers/{id}`
  - `GET /api/v1/managers/employees`
- Guarded by `auth:sanctum` + `auth.active` + `role:manager`.
- Every query is scoped to the acting Manager's subtree: RMs with
  `manager_id = actor`, and the employees assigned to those RMs.

### Frontend

- `/manager/dashboard` — welcome section, team metrics and a team-hierarchy
  tree of RMs with their employees.
- `/manager/profile` — Reactive Forms view/edit of the Manager's own profile;
  email and manager code are read-only.
- `/manager/relationship-managers` — create, edit, activate and deactivate the
  Manager's Relationship Managers.
- `/manager/employees` — read-only table of employees in the subtree.
- `ManagerService` transport layer over the shared `ApiService`.
- Route guards (`authGuard`, `roleGuard` with `roles: ['manager']`) and
  role-aware navigation entries.

## Not implemented

- Loan leads, lead assignment, lead matching.
- Banker and Super Admin workflows.
- Documents and notifications UI.
- Reports and analytics.
- Vendor role (removed permanently).
