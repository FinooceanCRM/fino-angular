# Implementation Roadmap

This roadmap lists critical, high, medium and low priority items to align the implementation with the business requirements provided.

Critical issues
1. Policy mismatch: Restricting status changes
   - What exists: LoanLeadPolicy::changeStatus currently allows Employees and Bankers to change status for leads assigned to them.
   - What's missing: Business rule requires only Super Admin, Manager, Relationship Manager may change lead status.
   - Required files: [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
   - Required APIs: none (policy change only)
   - Required DB changes: none
   - Implementation steps:
     1. Modify LoanLeadPolicy::changeStatus to only allow SuperAdmin, Manager, RelationshipManager (remove Employee/Banker branches), or add explicit config toggle.
     2. Add regresion tests for status-change authorization.

High-priority issues
2. Universal Lead Form: missing fields
   - What exists: loan_leads table and model include applicant_name, applicant_email, applicant_phone, loan_type, loan_amount, monthly_income, credit_score, employment_type, city, state, pincode, notes.
   - What's missing: alternative_phone, gender, date_of_birth, company_name, existing_emi, annual_turnover, property_value, property_type, and existing-loan checklist flags (repayment_track, noc, foreclosure, soa, lod).
   - Required files: migrations to add columns (database/migrations/...), updates to model [backend/app/Models/LoanLead.php], update request validation (StoreLeadRequest, UpdateLeadRequest), update frontend form (frontend/src/app/...)
   - Required APIs: none new, extend existing POST /api/v1/leads and PUT /api/v1/leads/{id} to accept/validate fields
   - Required DB changes: add new nullable columns to loan_leads via migration; consider JSON column for checklist if many boolean flags.
   - Implementation steps:
     1. Create migration to add missing columns.
     2. Update LoanLead::$fillable and $casts.
     3. Update StoreLeadRequest/UpdateLeadRequest rules.
     4. Update frontend form to include fields and map to backend metadata if needed.

Medium-priority issues
3. Telecaller workflows and call history
   - What exists: UI may reference telecaller flows; backend lacks dedicated persistence and role-specific routes.
   - What's missing: telecaller role in backend (enum), call logs table, APIs to log calls, telecaller dashboard endpoints.
   - Required files: migration for call_logs, model, controller, routes and policy; frontend pages/components.
   - Implementation steps:
     1. Add Telecaller role to UserRole enum if required.
     2. Add call_logs migration and model.
     3. Add APIs under a telecallers prefix and policies.

4. Document type: Electricity Bill
   - Add `electricity_bill` to DocumentType enum and reflect it in frontend UI.

Low-priority issues
5. Document versioning
   - Add versioning table/columns or implement copy+reference to track document uploads over time.

6. Analytics & reports
   - Implement or expand reports/dashboard endpoints and frontend visualizations.

For every change, ensure:
- Update Form Requests for validation
- Add tests (unit and integration) to cover authorization, repository visibility scopes and matching logic
- Update API docs / OpenAPI spec if present

(End of roadmap)
