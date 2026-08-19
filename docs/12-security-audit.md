# Security Audit

This section inspects authentication, API security, file security, JWT (or token) usage and input validation.

Authentication & tokens
- Laravel Sanctum is used for API authentication (routes use `auth:sanctum`). Inspect [backend/config/sanctum.php](/C:/fino-angular/fino-angular/backend/config/sanctum.php) and [backend/app/Http/Controllers/Api/V1/Auth/AuthController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/Auth/AuthController.php).

Role permissions & API security
- Route-level role middleware (e.g., `->middleware('role:manager')`) and permission middleware (e.g., `permission:users.view`) guard routes.
- Policies provide object-level authorization (LoanLeadPolicy, etc.).

File security
- Documents are stored in `storage/app/private/lead-documents/` and downloaded via DocumentController@download which should enforce authorization. Verify the controller enforces `uploadDocument` and/or `download` policies.

Input validation
- Controller actions use Form Requests (e.g., StoreLeadRequest, UpdateLeadStatusRequest, AssignLeadRequest) for validation.
- Ensure the validation rules cover all required lead fields and document type whitelists (Document upload request uses Rule::in(DocumentType::values())).

JWT
- The project uses Sanctum, not JWT. No JWT implementation found.

Vulnerabilities / Issues found
- Policy divergence: LoanLeadPolicy::changeStatus allows Employee and Banker to change status of assigned leads which conflicts with the stated business rule. This is an authorization policy issue, not a token problem.
- Ensure file download endpoints verify lead visibility before streaming files to the requester (DocumentController should use repository scope & policy checks).

Recommendations
- Harden DocumentController@download to ensure strict visibility and policy checks (no direct path leakage). Use signed temporary URLs for downloads if required.
- Review authentication cookie configuration (sameSite, secure) if using Sanctum with SPA cookies.

References
- [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)
- [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
- [backend/app/Http/Requests/](/C:/fino-angular/fino-angular/backend/app/Http/Requests) (validation requests)
- [backend/app/Http/Controllers/Api/V1/DocumentController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/DocumentController.php)
