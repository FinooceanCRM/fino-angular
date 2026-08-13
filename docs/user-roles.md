# User Roles & Hierarchy

FINOOCEAN uses five application roles. Four form a strict reporting hierarchy;
the Connector role is independent. The **Vendor** role has been removed
completely and must not be reintroduced.

```text
                 SUPER ADMIN
                      |
        +-------------+-------------+
        |                           |
     MANAGER                     MANAGER
        |                           |
  RELATIONSHIP MANAGER      RELATIONSHIP MANAGER
        |                           |
     EMPLOYEE                    EMPLOYEE

  CONNECTOR  (independent — no parent, no reports)
```

## Roles

| Role | Value | Position |
| --- | --- | --- |
| Super Admin | `super_admin` | Root of the hierarchy |
| Manager | `manager` | Reports to Super Admin |
| Relationship Manager | `relationship_manager` | Reports to a Manager |
| Employee | `employee` | Reports to a Relationship Manager |
| Connector | `connector` | Outside the hierarchy |

> `banker` remains in the enum only to support the `bank_criteria` table from
> Phase 3. It has no user-management capabilities.

## Hierarchy columns on `users`

| Column | Meaning |
| --- | --- |
| `manager_id` | The Manager the user rolls up to (null for Super Admin / Connector) |
| `relationship_manager_id` | The RM an Employee is assigned to |
| `employee_id` | Reserved link for future lead ownership |
| `is_active` | Inactive users are rejected at authentication |

## Management matrix

| Actor | May manage |
| --- | --- |
| Super Admin | Every user |
| Manager | Relationship Managers with `manager_id = actor`, and Employees under those RMs |
| Relationship Manager | Employees with `relationship_manager_id = actor` |
| Employee | Nobody |
| Connector | Nobody |

## Permissions

Defined in `App\Enums\Permission` (backend) and mirrored in
`frontend/src/app/core/auth/permissions.ts`.

| Permission | Super Admin | Manager | RM | Employee | Connector |
| --- | --- | --- | --- | --- | --- |
| `users.view` | yes | yes | yes | no | no |
| `users.create` | yes | yes | yes | no | no |
| `users.update` | yes | yes | yes | no | no |
| `users.delete` | yes | no | no | no | no |

A permission grants the *capability*; `UserPolicy` + `UserHierarchyService`
then decide whether the specific target record is inside the actor's subtree.

## Assignable roles when creating users

| Actor | Can create |
| --- | --- |
| Super Admin | Manager, Relationship Manager, Employee, Connector |
| Manager | Relationship Manager, Employee (auto-assigned to themselves) |
| Relationship Manager | Employee (auto-assigned to themselves) |
| Employee / Connector | none |

## Connector role (Phase 5)

A Connector never appears in the reporting tree:

- `manager_id`, `relationship_manager_id` and `employee_id` are always `null`.
- No role manages a Connector's workspace; the profile is self-owned.
- Connectors hold none of the `users.*` permissions and cannot open `/users`.
- Connector-specific data lives in the `connectors` table (1:1 with `users`);
  identity fields are never duplicated.
- Frontend area: `/connector/dashboard` and `/connector/profile`, protected by
  `authGuard` + `roleGuard` with `data: { roles: ['connector'] }`.

| Action | Connector | Super Admin | Manager | RM | Employee |
| --- | --- | --- | --- | --- | --- |
| `GET /connectors/dashboard` | yes (own) | no | no | no | no |
| `GET /connectors/profile` | yes (own) | no | no | no | no |
| `PUT /connectors/profile` | yes (own, active) | no | no | no | no |

## Employee role (Phase 6)

The Employee is the leaf of the hierarchy:

- Always reports to a Relationship Manager (`relationship_manager_id`), and
  inherits the Manager above that RM (`manager_id`).
- Can read and update **only their own** profile; role, status, employee code
  and reporting links are never editable by the employee.
- Cannot create users, edit other users, or delete users.
- Cannot access Manager, Super Admin or Connector routes.
- Employee-specific data lives in the `employees` table (1:1 with `users`).
- Frontend area: `/employee/dashboard`, `/employee/profile`, `/employee/team`,
  protected by `authGuard` + `roleGuard` with `data: { roles: ['employee'] }`.

| Action | Employee | Super Admin | Manager | RM | Connector |
| --- | --- | --- | --- | --- | --- |
| `GET /employees/dashboard` | yes (own) | no | no | no | no |
| `GET /employees/profile` | yes (own) | no | no | no | no |
| `PUT /employees/profile` | yes (own, active) | no | no | no | no |
| `GET /employees/team` | yes (own) | no | no | no | no |
| Create / edit / delete users | no | yes | subtree | subtree | no |

## Relationship Manager role (Phase 7)

The Relationship Manager sits between the Manager and the Employee:

- Always reports to a Manager (`manager_id`).
- Owns the employees whose `relationship_manager_id` points at them.
- May be the point of contact for connectors
  (`connectors.relationship_manager_id`); connectors stay outside the
  hierarchy and are never managed by the RM.
- Can read and update **only their own** profile; role, status, RM code and
  the reporting link to a Manager are never editable by the RM.
- Cannot access Manager or Super Admin routes.
- RM-specific data lives in the `relationship_managers` table (1:1 with
  `users`).
- Frontend area: `/relationship-manager/dashboard`, `/profile`, `/employees`,
  `/connectors`, protected by `authGuard` + `roleGuard` with
  `data: { roles: ['relationship_manager'] }`.

| Action | RM | Super Admin | Manager | Employee | Connector |
| --- | --- | --- | --- | --- | --- |
| `GET /relationship-managers/dashboard` | yes (own) | no | no | no | no |
| `GET /relationship-managers/profile` | yes (own) | no | no | no | no |
| `PUT /relationship-managers/profile` | yes (own, active) | no | no | no | no |
| `GET /relationship-managers/employees` | yes (assigned only) | no | no | no | no |
| `GET /relationship-managers/connectors` | yes (assigned only) | no | no | no | no |

## Manager role (Phase 8)

The Manager sits directly below the Super Admin and owns one branch of the
reporting tree:

- Reports to the Super Admin (`manager_id` is null; the Super Admin is the
  implicit root).
- Owns the Relationship Managers whose `manager_id` points at them, and
  transitively the Employees assigned to those RMs.
- May create Relationship Managers; the new RM is always attached to the
  acting Manager.
- May edit, activate and deactivate their own Relationship Managers.
- Sees employees in their subtree read-only.
- Can read and update **only their own** profile; role, status, manager code
  and the reporting link are never editable by the Manager.
- Cannot access another Manager's subtree, Super Admin functionality, or the
  Connector module.
- Manager-specific data lives in the `managers` table (1:1 with `users`).
- Frontend area: `/manager/dashboard`, `/manager/profile`,
  `/manager/relationship-managers`, `/manager/employees`, protected by
  `authGuard` + `roleGuard` with `data: { roles: ['manager'] }`.

| Action | Manager | Super Admin | RM | Employee | Connector |
| --- | --- | --- | --- | --- | --- |
| `GET /managers/dashboard` | yes (own) | no | no | no | no |
| `GET /managers/profile` | yes (own) | no | no | no | no |
| `PUT /managers/profile` | yes (own, active) | no | no | no | no |
| `GET /managers/relationship-managers` | yes (own subtree) | no | no | no | no |
| `POST /managers/relationship-managers` | yes (auto-assigned) | no | no | no | no |
| `PUT /managers/relationship-managers/{id}` | yes (own subtree) | no | no | no | no |
| `GET /managers/employees` | yes (own subtree) | no | no | no | no |

## Seeded test users

Password for every account: `12345678`

| Email | Role | Reports to |
| --- | --- | --- |
| superadmin@finoocean.test | Super Admin | — |
| manager1@finoocean.test | Manager | Super Admin |
| manager2@finoocean.test | Manager | Super Admin |
| rm1@finoocean.test | Relationship Manager | Manager 1 |
| rm2@finoocean.test | Relationship Manager | Manager 1 |
| rm3@finoocean.test | Relationship Manager | Manager 2 |
| rm4@finoocean.test | Relationship Manager | Manager 2 |
| employee1@finoocean.test | Employee | RM 1 |
| employee2@finoocean.test | Employee | RM 1 |
| employee3@finoocean.test | Employee | RM 2 |
| employee4@finoocean.test | Employee | RM 2 |
| employee5@finoocean.test | Employee | RM 3 |
| employee6@finoocean.test | Employee | RM 3 |
| employee7@finoocean.test | Employee | RM 4 |
| employee8@finoocean.test | Employee | RM 4 |
| connector1@finoocean.test | Connector | — |
| connector2@finoocean.test | Connector | — |
