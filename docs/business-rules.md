# Business Rules — Hierarchy & Access Control (Phase 4)

## BR-1 Roles

1. The system supports exactly five operational roles: Super Admin, Manager,
   Relationship Manager, Employee, Connector.
2. The Vendor role is removed and must never be reintroduced.
3. `banker` exists only as a data label for `bank_criteria` records and carries
   no user-management capability.

## BR-2 Reporting hierarchy

1. Super Admin is the single root; it has no parent.
2. A Manager reports to the Super Admin (`manager_id` points at the Super Admin).
3. A Relationship Manager reports to exactly one Manager (`manager_id`).
4. An Employee reports to exactly one Relationship Manager
   (`relationship_manager_id`) and inherits that RM's Manager.
5. A Connector has no parent and no reports; it is fully independent.

## BR-3 Visibility

1. Super Admin sees every user.
2. A Manager sees the users whose `manager_id` is the Manager, plus every
   Employee assigned to one of the Manager's RMs.
3. A Relationship Manager sees only Employees with
   `relationship_manager_id = actor`.
4. Employees and Connectors see no other users.
5. Every user may always read their own record.

## BR-4 Creation

1. A user can only be created with a role the actor is allowed to assign
   (see `docs/user-roles.md`).
2. When a Manager creates a user, `manager_id` is forced to the Manager.
3. When a Relationship Manager creates a user, `relationship_manager_id` is
   forced to the RM and `manager_id` is inherited from the RM.
4. An Employee must always have a Relationship Manager; creation fails with 422
   otherwise.
5. A Connector is always created with all hierarchy columns set to `null`.
6. Email addresses are unique and stored lower-cased.
7. Passwords are at least 8 characters and always stored hashed.

## BR-5 Updates

1. Updating a user requires the `users.update` permission **and** the target
   being inside the actor's subtree.
2. Changing a role re-applies all creation rules of BR-4.
3. An empty `password` field leaves the existing password untouched.

## BR-6 Deletion

1. Only a Super Admin may delete a user.
2. No user may delete their own account.

## BR-7 Authentication

1. Authentication is bearer-token only (Sanctum). No cookies, sessions or CSRF
   are used by the SPA.
2. Accounts with `is_active = false` cannot authenticate and their existing
   tokens are rejected.

## BR-8 Enforcement layers

| Layer | Responsibility |
| --- | --- |
| `permission` middleware | Coarse capability check per route |
| `UserPolicy` | Per-record authorisation |
| `UserHierarchyService` | Single source of truth for subtree membership |
| `UserService` | Business rules for role assignment and hierarchy defaults |
| Angular guards | UX-level gating only; never a security boundary |

## BR-9 Manager module (Phase 8)

1. A Manager may read and update **only their own** profile. Role, status,
   `manager_code` and the reporting link to the Super Admin are never editable
   by the Manager.
2. A Manager sees only the Relationship Managers whose `manager_id` equals
   their own id.
3. A Manager sees only the Employees whose `relationship_manager_id` points at
   one of those Relationship Managers. Employee records are read-only for the
   Manager.
4. Creating a Relationship Manager always sets `role = relationship_manager`
   and `manager_id` to the acting Manager. The caller cannot choose a parent
   and cannot create any other role from this module.
5. Updating a Relationship Manager is allowed only when the RM is inside the
   acting Manager's subtree; otherwise the request fails with `403`.
   Activation and deactivation happen through the `is_active` flag.
6. A Manager can never reach another Manager's subtree, Super Admin
   functionality, or the Connector module.
7. Connectors stay outside the reporting hierarchy and are never visible to a
   Manager.
