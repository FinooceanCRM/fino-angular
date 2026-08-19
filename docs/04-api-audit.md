# API Audit

This document enumerates major API endpoints, controllers, authentication and access rules found during code inspection.

Routing
- All API v1 routes are defined in: [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php).
- Routes are grouped by role prefixes and guarded with `auth:sanctum` and `auth.active` middleware.

Key endpoints (non-exhaustive)
| API endpoint | Method | Controller | Authentication | Role access | Status |
|---|---|---|---|---|---|
| /api/v1/auth/login | POST | AuthController@login | unauthenticated (throttled) | public | Implemented |
| /api/v1/auth/me | GET | AuthController@me | sanctum | authenticated | Implemented |
| /api/v1/leads | GET | LeadController@index | sanctum | policy: viewAny | Implemented |
| /api/v1/leads | POST | LeadController@store | sanctum | policy: create | Implemented |
| /api/v1/leads/{lead}/assign | POST | LeadController@assign | sanctum | policy: assign | Implemented |
| /api/v1/leads/{lead}/status | POST | LeadController@updateStatus | sanctum | policy: changeStatus | Implemented |
| /api/v1/leads/{lead}/match | POST | LeadController@match | sanctum | policy: match | Implemented |
| /api/v1/documents | POST | DocumentController@store | sanctum | permission/middleware + policy | Implemented |
| /api/v1/users | GET/POST/PUT/DELETE | UserController | sanctum | permission:* | Implemented with permission middleware |

Controllers
- LeadController: [backend/app/Http/Controllers/Api/V1/LeadController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php)
- DocumentController: [backend/app/Http/Controllers/Api/V1/DocumentController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/DocumentController.php)
- UserController: [backend/app/Http/Controllers/Api/V1/UserController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/UserController.php)

Services & Repositories
- Lead workflow is implemented in service layer: [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
- A repository interface is used for loan lead persistence: [backend/app/Repositories/Contracts/LoanLeadRepositoryInterface.php](/C:/fino-angular/fino-angular/backend/app/Repositories/Contracts/LoanLeadRepositoryInterface.php) and concrete implementations under app/Repositories.

Policies & Middleware
- LoanLeadPolicy enforces who may create, update, assign, change status etc.: [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
- Routes use role middleware (e.g., `->middleware('role:manager')`) and permission middleware (e.g., `permission:users.view`). Implementation of these middleware should be reviewed (search for RoleMiddleware/PermissionMiddleware in app/Http/Middleware or registered packages).

Status / Issues
- Most endpoints for lead lifecycle are implemented and wired to service layer.
- Policy `changeStatus` allows employees and bankers to change the status of leads they are assigned to (LoanLeadPolicy::changeStatus). This contradicts the business-rule requirement that only Super Admin, Manager, Relationship Manager may change status. See `backend/app/Policies/LoanLeadPolicy.php` lines 59-66.

Recommendations
- Review LoanLeadPolicy::changeStatus and align with the business requirement (disallow Employee/Banker unless explicitly permitted).
- Verify middleware and permission mapping for role and permission strings to ensure runtime enforcement.

References
- [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)
- [backend/app/Http/Controllers/Api/V1/LeadController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php)
- [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
- [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
