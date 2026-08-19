# User Management Audit

This document inspects authentication, authorization, roles, permissions, hierarchy and department assignment.

Authentication
- Laravel Sanctum is used for API token/session authentication. See [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php) endpoints for auth: login, logout, me.
- Auth controller: [backend/app/Http/Controllers/Api/V1/Auth/AuthController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/Auth/AuthController.php)

Authorization
- Role/permission middleware exists on routes (e.g., middleware('role:manager') and permission middleware like 'permission:users.view'). See [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php).
- Fine-grained object-level authorization uses policies. Example: [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php).

Roles
- Implemented roles (enum): [backend/app/Enums/UserRole.php](/C:/fino-angular/fino-angular/backend/app/Enums/UserRole.php)
  - super_admin
  - manager
  - relationship_manager
  - employee
  - connector
  - banker

Permissions
- Permission middleware used for user CRUD routes (see users group in [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)).
- Application appears to use a simple permission check via middleware strings (likely implemented in a package or custom middleware).

Hierarchy
- Hierarchy fields on User model: manager_id, relationship_manager_id, employee_id.
  - User model: [backend/app/Models/User.php](/C:/fino-angular/fino-angular/backend/app/Models/User.php)
- UserRole enum documents the intended parent roles (see allowedParents()).

Department assignment
- Departments (loan product domains) are implemented as loan_type on leads rather than a separate department entity.

Feature matrix
| Feature | Status |
|---|---:|
| Super Admin | ✓ |
| Manager | ✓ |
| RM | ✓ |
| Employee | ✓ |
| Telecaller | ✓ (see roles/guards - telecaller exists in frontend role lists) |
| Banker | ✓ |

Notes and issues
- Roles implemented match project requirement list.
- Permissions are used but require runtime check of middleware mapping (not all permission strings are enumerated in code search). Investigate middleware implementation for `permission:` and `role:` enforcement.

References
- [backend/app/Models/User.php](/C:/fino-angular/fino-angular/backend/app/Models/User.php)
- [backend/app/Enums/UserRole.php](/C:/fino-angular/fino-angular/backend/app/Enums/UserRole.php)
- [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)
- [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
