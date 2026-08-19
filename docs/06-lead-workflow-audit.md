# Lead Workflow Audit

This document describes lead creation, visibility, assignment, reassignment, ownership and history mechanisms.

Lead creation
- Endpoint: POST /api/v1/leads -> [LeadController@store](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php#L116)
- Anyone active may create a lead (LoanLeadPolicy::create returns is_active). The service stamps created_by and initial status `new`.

Lead visibility
- Visibility is enforced at repository scope: LeadService->findVisible uses LoanLeadRepositoryInterface->findVisible and paginateVisible implementations. See repository implementations under [backend/app/Repositories/](/C:/fino-angular/fino-angular/backend/app/Repositories).
- Controller authorizes view via LoanLeadPolicy::view/viewAny but visibility scope prevents access to leads outside actor's subtree.

Lead assignment & reassignment
- Assignment endpoint: POST /api/v1/leads/{lead}/assign -> LeadController@assign
- Assignment authorization: LoanLeadPolicy::assign allows SuperAdmin, Manager, RelationshipManager.
- LeadService->assign enforces further rules (guardAssignment) and cascades assigned_employee/relationship_manager/manager fields.
- Reassignment: assignment creates LeadAssignment history entries and deactivates prior active assignment records.

Lead status changes
- Endpoint: POST /api/v1/leads/{lead}/status -> LeadController@updateStatus
- Policy: LoanLeadPolicy::changeStatus currently allows SuperAdmin, Manager, RelationshipManager, and ALSO allows Employee and Banker when they are the assigned party.
- Business requirement (audit prompt) states only Super Admin, Manager, Relationship Manager can change status — codebase deviates (allows assigned Employee/Banker). Marked as INCORRECT (see recommendations).

Lead ownership & transfer
- Ownership is recorded on loan_leads via assigned_employee_id, assigned_relationship_manager_id, assigned_manager_id, assigned_banker_id and created_by.
- LeadAssignment table stores assignment history; LeadStatusHistory stores status transition history; Document table stores uploads.

Lead history
- LeadController@show loads statusHistory, assignments and matches to produce a complete audit trail.
- Models: LeadAssignment, LeadStatusHistory and Document are used for history/trace.

Workflow diagram (textual)
- Create (any active role) -> created_by, status=new -> notifications to assigned RM/Manager
- Assign (SuperAdmin/Manager/RM) -> cascades assigned_* fields, assignment history entry, status becomes `assigned` if was `new` -> notify assignee
- Change status (per policy) -> leads->changeStatus records status history and notifies stakeholders
- Match (non-banker/connector roles) -> matching service invoked to produce bank matches

References
- [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
- [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php)
- [backend/app/Http/Controllers/Api/V1/LeadController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php)

(End of lead workflow audit)
