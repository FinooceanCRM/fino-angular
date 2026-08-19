# Matching Engine Audit

This section inspects the matching algorithm and how bank criteria are used to produce matches.

Implementation
- Matching service: [backend/app/Services/LeadMatchingService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadMatchingService.php) (used by LeadService->runMatching).
- Lead matches are stored in `lead_matches` table (migration: [2024_01_03_000003_create_lead_matches_table.php](/C:/fino-angular/fino-anglaer/backend/database/migrations/2024_01_03_000003_create_lead_matches_table.php)).
- Bank criteria stored in `bank_criteria` table with `eligibility_rules` JSON; matching engine evaluates eligibility_rules against lead attributes.

Criteria comparison
- Eligibility rules reside as JSON and are interpreted by the matching service (read the service to confirm supported operators and scoring rules).

Score calculation & ranking
- The matching service computes a match_score and reasons; stored fields include match_score, reasons and status on each match record.
- Rank is returned by LeadController@show in the `matches` payload (match_score and reasons included).

Assignment
- Matching is independent from assignment. A separate assignment flow assigns leads to users/bankers after matching.

Recommendations
- Validate matching logic against all intended bank eligibility criteria and unit-test edge cases.
- Externalize complex eligibility rules to a formal DSL or rule engine if they grow beyond simple JSON comparison.

References
- [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
- [backend/app/Services/LeadMatchingService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadMatchingService.php)
- [backend/database/migrations/2024_01_03_000003_create_lead_matches_table.php](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000003_create_lead_matches_table.php)
