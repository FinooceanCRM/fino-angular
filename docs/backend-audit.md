# Backend Audit — Super Admin / Manager / Relationship Manager Support

Audit of the existing Laravel 12 backend at `backend/`, scoped to what's needed for the Super Admin, Manager, and Relationship Manager frontend modules.

## 1. Route inventory (`routes/api.php`)

**Public**
- `GET /api/v1/health` → `HealthController@index`
- `POST /api/v1/auth/login` → `AuthController@login` (throttle:10,1)

**Authenticated (`auth:sanctum` + `auth.active`)**
- `GET auth/me`, `POST auth/logout` → `AuthController`
- **Connectors** (`role:connector`): `GET connectors/dashboard`, `GET/PUT connectors/profile`
- **Super Admin** (`role:super_admin`): `GET super-admin/dashboard` — the only route in the entire module
- **Bankers** (`role:banker`): `GET bankers/dashboard`, `GET/PUT bankers/profile`
- **Employees** (`role:employee`): `GET employees/dashboard`, `GET/PUT employees/profile`, `GET employees/team`
- **Relationship Managers** (`role:relationship_manager`): `GET relationship-managers/dashboard`, `GET/PUT .../profile`, `GET .../employees`, `GET .../connectors`
- **Managers** (`role:manager`): `GET managers/dashboard`, `GET/PUT .../profile`, `GET/POST .../relationship-managers`, `PUT .../relationship-managers/{id}`, `GET .../employees`
- **Leads** (no role middleware, policy-scoped): `GET metadata`, `GET assignable-users`, `GET /`, `POST /`, `GET/PUT/DELETE {lead}`, `POST {lead}/assign`, `POST {lead}/status`, `POST {lead}/match`, `GET/POST {lead}/documents`, `GET/POST {lead}/access-requests`
- **Access requests**: `GET access-requests` (pending), `POST {id}/approve`, `POST {id}/reject`
- **Documents**: `GET {id}/download`, `DELETE {id}`
- **Banks**: full CRUD `GET/POST/{id} GET/PUT/DELETE`
- **Notifications**: `GET /`, `POST read-all`, `POST {id}/read`
- **Reports**: `GET reports/dashboard` only
- **Users** (`permission:users.*`): full CRUD `GET/POST /users`, `GET/PUT/DELETE /users/{id}`

There is **no `RoleController`/`PermissionController`**, **no settings endpoints**, **no commission/payout endpoints**, **no audit-log endpoints**, and **no global search endpoint** anywhere in `routes/api.php`.

## 2. SuperAdminController / SuperAdminService — exact functionality

Single endpoint: `GET /api/v1/super-admin/dashboard` → `SuperAdminService::dashboardFor()`. Returns:
- `welcome` (headline/message)
- `stats`: `total_users`, `managers` count, `active_leads` (sum of status counts minus closed), `partner_banks` (active `BankCriteria` count)
- `users_by_role`: count per `UserRole` case
- `recent_activity`: last 8 `LeadStatusHistory` rows (lead reference, applicant name, status, changed_by, timestamp)

That is **the entirety** of Super Admin backend functionality — read-only platform dashboard. No user-management-specific SA actions, no settings, no reports beyond the generic dashboard, no commission/audit data.

## 3. Feature-area existence checks

**Audit logging / activity log** — MISSING. No matches anywhere in `backend/app` or `backend/database/migrations` for "audit", "activity_log", "ActivityLog". `LeadStatusHistory` (table `lead_status_history`, model `App\Models\LeadStatusHistory`) is the only "history"-like construct, and it only tracks lead status transitions (`loan_lead_id, from_status, to_status, changed_by, remarks`) — not a general audit trail of user/CRUD actions.

**Commissions / payouts / affiliate / accounting** — MISSING entirely. Zero matches for "commission", "payout", "affiliate" in the whole backend tree (app or migrations). No model, table, service, or controller.

**Settings (general/matching-engine/notification/security)** — MISSING. Zero matches for "Setting"/"settings" as a model/table/controller in `app/`. There is no `settings` table in `database/migrations`. Matching-engine weights (amount 40, income 25, credit score 25, employment 10) are hard-coded in `LeadMatchingService`, not configurable via a settings API.

**Global search** — MISSING. No `search` action in any controller in `app/Http/Controllers`. `LeadController` presumably has query-based filtering, but there's no dedicated cross-entity search endpoint.

**Roles & permissions management API** — PARTIAL/MISSING. `app/Models/Role.php` and `app/Models/Permission.php` exist (DB-backed, tables `roles`, `permissions`, pivot `permission_role`) and are seeded, but there is **no `RoleController` or `PermissionController`** — confirmed absent via glob. Super Admin cannot CRUD roles/permissions through the API today. Authorization actually runs on `App\Enums\Permission` (hard-coded `forRole()` match expression: only `users.view/create/update/delete`), not on the DB-backed Role/Permission tables — i.e., two parallel, disconnected permission systems exist (DB tables are effectively unused by the auth layer).

**Banker module** — PARTIAL, more built than expected but still narrow:
- `app/Models/Banker.php`: table `bankers`, fillable `user_id, bank_name, branch, designation, employee_code, alternate_phone, address_line1, address_line2, city, state, pincode`; `belongsTo(User)`.
- Migration `2026_08_14_100200_create_bankers_table.php`: `id, user_id (unique FK→users, cascade), bank_name, branch, designation, employee_code(40), alternate_phone(20), address_line1, address_line2, city(100), state(100), pincode(10), timestamps`; indexes on city/state.
- `BankerController.php` exists: `GET bankers/dashboard`, `GET/PUT bankers/profile`, all delegating to `BankerService`, gated by `BankerPolicy` (`viewDashboard`, `viewOwnProfile`, `updateOwnProfile`, `view`, `update`).
- `LeadAccessRequestController.php`: full workflow — `store` (banker requests access to a matched lead), `forLead` (list requests for a lead), `pending` (queue for approvers), `approve`, `reject`. Backed by `LeadAccessRequestService` and `LeadAccessRequestPolicy` (`create`, `view`, `decide`).
- Migration `2026_08_14_100400_create_lead_access_requests_table.php`: `id, loan_lead_id (FK→loan_leads cascade), banker_id (FK→users cascade), status(20, default pending, indexed), remarks, decision_remarks, decided_by (FK→users, nullOnDelete), decided_at, timestamps`; composite index `(loan_lead_id, banker_id)`.
- `AccessRequestStatus` enum: `Pending`, `Approved`, `Rejected`.
- Gap: Banker has **no leads list/queue endpoint of its own** — only dashboard/profile and the access-request flow; no banker-side "my approved leads" view; no commission tie-in.

**Reports** — MINIMAL, single generic dashboard, not a reporting suite:
- `ReportService::dashboard()` returns role-scoped totals (leads/approved/rejected/disbursed/in_progress/new), `by_status` breakdown, `recent_leads` (5), and `team` counts (varies by role: SA gets managers/RMs/employees/connectors counts; Manager gets own RM/employee counts; RM gets own employee count).
- `ReportController` exposes **only** `GET /reports/dashboard` — no lead reports, user reports, performance reports, or commission reports (commissions don't exist at all). No date-range filtering, no export, no per-manager/per-RM drill-down report.

## 4. Enums (full value lists)

- **UserRole**: `SuperAdmin=super_admin, Manager=manager, RelationshipManager=relationship_manager, Employee=employee, Connector=connector, Banker=banker`. `allowedParents()`: Manager←SuperAdmin, RM←Manager, Employee←RM; Connector/Banker have none (standalone).
- **Permission**: `ViewUsers=users.view, CreateUsers=users.create, UpdateUsers=users.update, DeleteUsers=users.delete` — that's the **entire** permission set. `forRole()`: SuperAdmin gets all 4; Manager & RM get view/create/update (no delete); everyone else gets none.
- **LeadStatus**: `New, Assigned, InProgress, DocumentsPending, UnderReview, Approved, Rejected, Disbursed, Closed`. Only `Closed` is terminal.
- **LoanType**: `Home, Personal, Business, Auto, Education, LoanAgainstProperty`.
- **DocumentType**: `Aadhaar, Pan, BankStatement, IncomeProof, Other`.
- **AccessRequestStatus**: `Pending, Approved, Rejected`.

## 5. Models — columns/fillable/relationships

**User** (`app/Models/User.php`): fillable `name, email, password, role, manager_id, relationship_manager_id, employee_id, phone, is_active`; hidden `password, remember_token`; casts `role→UserRole, is_active→bool, email_verified_at→datetime, password→hashed`. Relations: `manager()`, `relationshipManager()`, `employee()` (all self `belongsTo`), `managedUsers()`/`relationshipManagedUsers()` (self `hasMany`), `loanLeads()` (created_by), `leadAssignments()` (assigned_to), `bankCriteria()` (banker_id), `documents()` (uploaded_by), `notifications()`. Helper methods `roleEnum()`, `hasRole(...)`. **No commission, salary, or audit relations.**

**Manager** (`app/Models/Manager.php`): table `managers`; fillable `user_id, manager_code, designation, branch, region, date_of_joining, alternate_phone, address_line1, address_line2, city, state, pincode`; cast `date_of_joining→date`; `belongsTo(User)`.

**RelationshipManager** (`app/Models/RelationshipManager.php`): table `relationship_managers`; fillable `user_id, rm_code, designation, branch, region, date_of_joining, alternate_phone, address_line1, address_line2, city, state, pincode`; cast `date_of_joining→date`; `belongsTo(User)`.

Both are pure 1:1 profile-extension tables with no commission/target/performance fields.

## 6. Policies (`app/Policies`) — authorization surface

- **UserPolicy**: `viewAny, view, create, update, delete` — delegates subtree checks to `UserHierarchyService`; only Super Admin can `delete`.
- **ConnectorPolicy**: `viewDashboard, viewOwnProfile, updateOwnProfile, view, update` — self-only.
- **BankerPolicy**: `viewDashboard, viewOwnProfile, updateOwnProfile, view, update` — self-only, same shape as Connector.
- **LeadAccessRequestPolicy**: `create` (banker requesting), `view`, `decide` (approve/reject by whoever can already see the lead).
- **BankCriteriaPolicy**: `viewAny, view, create, update, delete` — write ops are Super-Admin-only per business rules.
- **RelationshipManagerPolicy**: `viewDashboard, viewOwnProfile, updateOwnProfile, viewEmployees, viewConnectors, view, update, create, delete`.
- **EmployeePolicy**: `viewDashboard, viewOwnProfile, updateOwnProfile, viewTeam, view, update, create, delete`.
- **DocumentPolicy**: `view, delete` — uploader or Super Admin/Manager/RM.
- **ManagerPolicy**: `viewDashboard, viewOwnProfile, updateOwnProfile, viewRelationshipManagers, createRelationshipManager, updateRelationshipManager, viewEmployees, view, update, create, delete`.
- **LoanLeadPolicy**: `viewAny, view, create, update, delete, assign, changeStatus, match, uploadDocument` — richest policy in the app, hierarchy-scoped throughout.

No `RolePolicy`, `PermissionPolicy`, `SettingPolicy`, `CommissionPolicy`, or `AuditLogPolicy` exist.

## 7. Docs vs. code — gaps and staleness

- **docs/user-roles.md** and **docs/database.md** describe `banker` as carrying "no user-management capabilities" and existing "only to support bank_criteria" — this is now **stale**: code has since grown a full Banker profile + dashboard + `LeadAccessRequest` workflow (migrations dated `2026_08_14`) that the docs never mention.
- **docs/features.md**'s "Not implemented" section still lists "Banker and Super Admin workflows" as not done, and "Banker workspace UI" as not implemented — partially outdated now that backend Banker/access-request plumbing exists (frontend may still be missing, not verified here).
- **docs/features.md** "Not implemented" also lists "Reports and analytics" — consistent with the current single-endpoint `ReportController`.
- None of the six docs mention **commissions/payouts**, **audit logs**, **settings**, **global search**, or a **Role/Permission management UI** anywhere, as planned or otherwise — these are genuinely outside the documented scope, not just undocumented-but-planned.
- `docs/ARCHITECTURE.md`'s phase plan ends at "5. Reporting and exports" with no phase allocated to admin settings, audit, or commissions — confirms these were never scoped.
- `docs/business-rules.md` (BR-1 through BR-10) is thorough for hierarchy/visibility/leads but has no BR section for Super Admin-specific dashboard rules, settings, commissions, or audit — Super Admin's only documented differentiator is "sees everything."

---

## Summary: A / B / C

### (A) Fully implemented and working
- Auth (Sanctum bearer tokens), role/permission middleware (`EnsureUserHasRole`, `EnsureUserCanManageUsers`), `auth.active` gating.
- User hierarchy CRUD (`UserController`, `UserPolicy`, `UserHierarchyService`) scoped by `manager_id`/`relationship_manager_id`.
- Manager module: dashboard, profile, RM CRUD (create/update, own subtree), employees list.
- Relationship Manager module: dashboard, profile, employees list, connectors list.
- Lead workflow (create/update/assign/status/match/documents/access-requests) — hierarchy-scoped via `LoanLeadPolicy`.
- Bank criteria CRUD (Super-Admin-write, hierarchy-read).
- Documents (upload/download/delete) and Notifications (list/read/read-all).
- Banker profile + dashboard + `LeadAccessRequest` request/approve/reject flow.
- Super Admin dashboard (platform-wide stats + recent lead-status activity) — this is Super Admin's **only** backend capability today.
- Generic role-aware `reports/dashboard` (totals, by-status, recent leads, team counts).

### (B) Partially implemented (exists but incomplete)
- **Super Admin module** — only a read-only dashboard exists; no dedicated Super-Admin-only management endpoints beyond the generic `/users` CRUD (e.g., no bulk actions, no impersonation, no system health/ops view).
- **Banker module** — profile/dashboard/access-request flow exist, but there's no banker-facing "my leads" queue beyond access requests, and it isn't wired to any commission/payout concept.
- **Reports** — only one dashboard endpoint; no report types beyond aggregate counts (no date filters, no CSV/export, no per-user/per-team drill-down, no commission or performance reports since commissions don't exist).
- **Roles & Permissions** — DB-backed `Role`/`Permission` models and tables exist and are seeded, but disconnected from actual authorization logic (which runs on the hard-coded `App\Enums\Permission::forRole()`), and there is no CRUD API to manage them.
- **Docs** — several docs (`user-roles.md`, `database.md`, `features.md`) predate the Banker/LeadAccessRequest additions and mischaracterize Banker as capability-less.

### (C) Completely missing
- **Audit logging / activity log**: no model, table, service, or controller anywhere. `LeadStatusHistory` only covers lead status changes, not a general system audit trail (user CRUD, logins, settings changes, etc.).
- **Commissions / payouts / affiliate / connector commission / accounting**: zero code, zero schema, zero docs mention.
- **Settings** (general, matching-engine, notification, security): no `Setting` model/table/controller; matching-engine weights are hard-coded in `LeadMatchingService`.
- **Global search**: no search endpoint/controller action across entities.
- **Role/Permission management API**: no `RoleController`/`PermissionController`; Super Admin cannot CRUD roles or permissions via API today (only via seeders/DB).
- **Super-Admin-specific admin endpoints** beyond the dashboard: no user impersonation, no system settings, no audit view, no commission oversight, no bulk role management.
