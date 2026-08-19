# Banker Audit

Banker-related features: bank criteria, lead requests, assignment and document requests.

Bank criteria
- Bank criteria table and controller exist: endpoints under `/api/v1/banks` are implemented in [BankCriteriaController](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/BankCriteriaController.php) and migration in `database/migrations`.
- Bank criteria include `eligibility_rules` JSON (see [2024_01_08_000000_extend_loan_workflow_tables.php](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_08_000000_extend_loan_workflow_tables.php)).

Lead requests & assignment
- Bankers are a standalone role (UserRole::Banker). They can have leads assigned via assigned_banker_id (added 2026 migration).
- LeadService::assign allows SuperAdmin/Manager/RM to assign leads to bankers as a special case (guardAssignment), so bank assignment flow is supported.

Document requests & loan processing
- Bankers may upload documents if assigned (DocumentController upload is guarded by uploadDocument policy which allows banker when update() returns true). Confirm DocumentController and DocumentService behavior.

Recommendations
- Ensure banker-specific actions (loan processing steps) are represented in API and UI (e.g., banker dashboards, status transitions unique to banker workflows).

References
- [backend/app/Enums/UserRole.php](/C:/fino-angular/fino-angular/backend/app/Enums/UserRole.php)
- [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
- [backend/database/migrations/2026_08_14_100300_add_assigned_banker_id_to_loan_leads_table.php](/C:/fino-angular/fino-angular/backend/database/migrations/2026_08_14_100300_add_assigned_banker_id_to_loan_leads_table.php)
