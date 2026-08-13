# FINOOCEAN — Application Overview

FINOOCEAN is a loan management platform rebuilt from a legacy WordPress
application. It is delivered as two independent applications that talk over a
versioned REST API.

| Layer | Technology |
| --- | --- |
| Frontend | Angular 20, standalone components, TypeScript, Angular Material, Reactive Forms, Signals |
| Backend | Laravel 12, PHP 8.2, Laravel Sanctum, service layer, repository pattern |
| Database | MySQL (XAMPP for local development) |

## Repository layout

```text
/
├── backend/     Laravel 12 API
├── frontend/    Angular 20 SPA
├── database/    schema references and SQL helpers
├── docs/        project documentation
├── postman/     API collection and environment
└── tests/       cross-cutting test assets
```

## Delivered phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project scaffold, environment configuration, CI workflow | done |
| 2 | Token-based authentication (login, logout, `/me`) | done |
| 3 | Database schema: migrations, models, factories, seeders | done |
| 4 | User hierarchy and access control, user CRUD APIs | done |
| 5 | Connector module (dashboard + profile) | done |

Loan leads, lead assignment, lead matching, banker/manager/employee workflows,
reports and analytics are intentionally **not** implemented yet.

## Roles

```text
SUPER ADMIN → MANAGER → RELATIONSHIP MANAGER → EMPLOYEE
CONNECTOR (independent)
```

The legacy **Vendor** role is removed permanently.

## Authentication model

Bearer tokens only. No cookies, no CSRF, no SPA session state:

1. `POST /api/v1/auth/login` returns a Sanctum personal access token.
2. The Angular interceptor stores it in `localStorage` and sends
   `Authorization: Bearer <token>` on every request.
3. `POST /api/v1/auth/logout` revokes the current token.

## Connector module (Phase 5)

The Connector is a standalone role with its own workspace:

- `GET /api/v1/connectors/dashboard` — welcome card, user information, role
  information and account status.
- `GET|PUT /api/v1/connectors/profile` — view and update the connector's own
  profile.
- Angular routes `/connector/dashboard` and `/connector/profile`, guarded by
  `authGuard` + `roleGuard`.
- Connector-only data lives in the `connectors` table, joined 1:1 to `users`.

## Employee module (Phase 6)

The Employee is the leaf of the reporting hierarchy and reports to a
Relationship Manager:

- `GET /api/v1/employees/dashboard` — welcome, employee information, assigned
  Relationship Manager, account status and quick actions.
- `GET|PUT /api/v1/employees/profile` — view and update the employee's own
  profile only.
- `GET /api/v1/employees/team` — own details plus the reporting Relationship
  Manager.
- Angular routes `/employee/dashboard`, `/employee/profile` and
  `/employee/team`, guarded by `authGuard` + `roleGuard`.
- Employee-only data lives in the `employees` table, joined 1:1 to `users`.
- Employees cannot create or edit users, and cannot reach Manager, Super Admin
  or Connector routes.

## Relationship Manager module (Phase 7)

The Relationship Manager sits between the Manager and the Employee:

- `GET /api/v1/relationship-managers/dashboard` — welcome, team summary,
  employee count, connector count and account status.
- `GET|PUT /api/v1/relationship-managers/profile` — view and update the RM's
  own profile only.
- `GET /api/v1/relationship-managers/employees` — employees assigned to the RM.
- `GET /api/v1/relationship-managers/connectors` — connectors assigned to the
  RM (connectors remain outside the hierarchy).
- Angular routes `/relationship-manager/dashboard`, `/profile`, `/employees`
  and `/connectors`, guarded by `authGuard` + `roleGuard`.
- RM-only data lives in the `relationship_managers` table, joined 1:1 to
  `users`.
- RMs cannot reach Manager or Super Admin routes.

## Local development

See `docs/SETUP.md`. Summary:

```bash
# backend
cd backend && composer install && php artisan migrate --seed && php artisan serve

# frontend
cd frontend && npm install && npm start
```

## Manager module (Phase 8)

The Manager owns a slice of the reporting tree:

- `GET /api/v1/managers/dashboard` — manager information, team summary and the
  full team hierarchy (each RM with the employees assigned to them).
- `GET|PUT /api/v1/managers/profile` — view and update the Manager's own
  profile only.
- `GET|POST /api/v1/managers/relationship-managers` — list and create the
  Relationship Managers reporting to the Manager.
- `PUT /api/v1/managers/relationship-managers/{id}` — edit, activate or
  deactivate an owned Relationship Manager.
- `GET /api/v1/managers/employees` — read-only list of employees under the
  Manager's Relationship Managers.
- Angular routes `/manager/dashboard`, `/manager/profile`,
  `/manager/relationship-managers` and `/manager/employees`, guarded by
  `authGuard` + `roleGuard` with `roles: ['manager']`.
- Manager-only data lives in the `managers` table, joined 1:1 to `users`.
- Managers cannot reach another Manager's subtree or Super Admin routes.
