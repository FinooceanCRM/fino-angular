# Telecaller Audit

Scope: PD workflow (pre-sales / telecaller), customer verification, status updates and call history.

Findings
- Backend routes and policies do not explicitly mention a Telecaller role in lead-specific endpoints. The UserRole enum includes roles: `connector`, `banker`, `employee`, `relationship_manager`, `manager`, `super_admin` — no explicit `telecaller` enum value.
- The API route groups mention phases for Employee, RM, Manager, Banker and Connector; there is no dedicated `telecallers` prefix in `routes/api.php`.

Customer verification
- No dedicated telecaller verification controller or call-log table was found named `telecaller_calls` or similar. Document uploads and notes exist and can be used to record verification steps.

Status updates
- Telecallers are not explicitly permitted to change status by policy (LoanLeadPolicy::changeStatus). The policy allows status changes by SuperAdmin, Manager, RM and — as currently implemented — by Employees/Bankers for assigned leads.

Call history
- No dedicated call-history table or model found in the migrations (no `call_logs` or `telecaller_calls`). Suggest adding a call logs table if telecaller detailed workflows are required.

Conclusion
- Telecaller functionality appears to be planned at a UI level, but backend support (role, routes, call-history persistence) is missing or incomplete.

Recommendations
- If telecaller workflows are required: add a Telecaller role to UserRole enum, create API endpoints and persistence for call logs, and clarify what telecallers may view/modify (create leads, add notes, verify identity).

References
- [backend/app/Enums/UserRole.php](/C:/fino-angular/fino-angular/backend/app/Enums/UserRole.php)
- [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)
