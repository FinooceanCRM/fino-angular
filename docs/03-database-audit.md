# Database Audit

This file enumerates tables, relationships, indexes, foreign keys and normalization observations relevant to lead workflow.

Implemented tables (selected)
- loan_leads: [migration](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000000_create_loan_leads_table.php)
  - columns: reference, applicant_name, applicant_email, applicant_phone, loan_type, loan_amount, tenure_months, monthly_income, credit_score, employment_type, city, state, pincode, status, created_by, connector_id, notes, timestamps, soft deletes
  - later migrations add assigned_employee_id, assigned_relationship_manager_id, assigned_manager_id, updated_by, assigned_banker_id
- documents: stores uploaded documents (document_type, path, uploaded_by) [migration](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000005_create_documents_table.php)
- lead_assignments: assignment history [migration](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000001_create_lead_assignments_table.php)
- lead_status_history: status transitions [migration](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000004_create_lead_status_history_table.php)
- lead_matches: matching results [migration](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000003_create_lead_matches_table.php)
- users: standard user table (see [backend/database/migrations](/C:/fino-angular/fino-angular/backend/database/migrations) — typical Laravel users migration present)

Relationships
- loan_leads.created_by -> users.id (nullable, nullOnDelete)
- loan_leads.connector_id -> users.id
- loan_leads.assigned_* -> users.id (cascade null on delete)
- documents.loan_lead_id -> loan_leads.id (cascade on delete)
- lead_assignments.loan_lead_id -> loan_leads.id (cascade)
- lead_status_history.loan_lead_id -> loan_leads.id (cascade)
- lead_matches.loan_lead_id -> loan_leads.id (cascade)

Indexes & constraints
- Indexes exist on loan_type and status (migrations show ->index()).
- Foreign keys created by constrained() calls in migrations.

Normalization
- Data model is normalized for leads: separate history tables (assignments, status_history, matches, documents).
- Loan types and user roles are represented as enums (application-level). No separate domain tables for loan products; bank criteria are in bank_criteria table with eligibility_rules JSON.

Missing / Incomplete items
- No dedicated departments table; "department" concept is implemented implicitly via loan_type values. If strict department-level visibility required, a department table or stronger loan_type taxonomy may be needed.
- Several universal lead form fields requested in the audit (e.g., alternative_phone, gender, date_of_birth, company_name, existing_emi, annual_turnover, property_value, property_type) are not present in `loan_leads` migration and model.

Implemented tables / Missing tables / Unused tables (summary)
- Implemented tables: loan_leads, documents, lead_assignments, lead_status_history, lead_matches, bank_criteria, users, notifications.
- Missing tables: explicit departments table (if required by spec), telecaller_call_logs (no dedicated call history table found named as such), document_versioning table (no version history for documents beyond soft deletes).
- Unused tables: none obvious from quick scan; vendor and node_modules directories contain many files but are not application tables.

Incorrect relationships
- None structurally incorrect in migrations. Relationship enforcement and visibility rely heavily on repository query scopes, not purely on DB-level constraints; ensure repository scopes match intended visibility.

References
- [backend/database/migrations/](/C:/fino-angular/fino-angular/backend/database/migrations)
- [backend/app/Models/LoanLead.php](/C:/fino-angular/fino-angular/backend/app/Models/LoanLead.php)

(End of DB audit)
