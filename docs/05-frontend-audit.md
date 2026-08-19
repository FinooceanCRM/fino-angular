# Frontend Audit

This section summarizes the Angular frontend structure, routes, components, services and state management observed in the repository.

Location
- Frontend app: [frontend/](/C:/fino-angular/fino-angular/frontend)

Pages & Routes
- Routing is defined in the Angular app (inspect src/app/app-routing.module.ts in frontend). Key pages include login, dashboard(s) for roles, leads list/detail, lead form, documents upload.

Components & Services
- Services call backend APIs (look in src/app/services or src/app/api) and consume the metadata endpoint for form catalogue values: `/api/v1/leads/metadata` (LeadController::metadata).
- Forms rely on the backend to supply loan types, statuses, and employment types.

Guards & State
- Guards use stored authentication state (probably via a token stored by an Auth service). The backend uses Sanctum; confirm frontend auth flow (sanctum cookie or token-based) in [frontend/src/app/auth] or similar.

Implemented pages
- Login page
- Role-specific dashboards (super-admin, manager, relationship-manager, banker, connector, employee)
- Lead listing and detail pages
- Lead create / edit form (consumes metadata endpoint)

Missing/Incomplete items / Broken pages
- No explicit Telecaller module was discovered in backend routes; frontend may include a telecaller-only UI page but backend role/middleware and policies must support telecaller workflows. Search frontend for "telecaller" occurrences to confirm.
- Verify file upload flows: DocumentController endpoints exist; frontend should map the document types to the backend DocumentType enum.

Unused Components
- Not exhaustively listed here — run a targeted static analysis of src/app to find unused components.

References
- [frontend/](/C:/fino-angular/fino-angular/frontend)
- Lead metadata endpoint: [backend/app/Http/Controllers/Api/V1/LeadController.php#metadata](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php)

(End of frontend audit)
