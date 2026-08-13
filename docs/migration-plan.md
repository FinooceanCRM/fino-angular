# Migration plan — WordPress to FINOOCEAN

The legacy WordPress application is a reference only; nothing is imported
automatically. This plan describes how the legacy data maps onto the new
Laravel 12 / MySQL schema once a cut-over is scheduled.

## Phase order

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Repository scaffold (Angular 20 + Laravel 12) | done |
| 2 | Token-based authentication (Sanctum) | done |
| 3 | Database schema, models, factories, seeders | done |
| 4 | Hierarchy and access control | done |
| 5 | Connector module | done |
| 6 | Employee module | done |
| 7 | Relationship Manager module | done |
| 8 | Manager module | done |
| 9 | Complete loan management workflow | done |

## Data mapping

| Legacy WordPress | New table | Notes |
| --- | --- | --- |
| `wp_users` + role meta | `users` | role becomes the `role` column; hierarchy links are `manager_id`, `relationship_manager_id` |
| lead custom post type | `loan_leads` | post meta becomes typed columns; `reference` is regenerated as `LD-XXXXXXXXXX` |
| lead assignment meta | `lead_assignments` | one active row per lead, older rows released |
| lead status meta/log | `lead_status_history` | statuses normalised to the `LeadStatus` enum |
| bank product posts | `bank_criteria` | free-text conditions become `eligibility_rules` JSON |
| media attachments | `documents` | files re-uploaded to `storage/app/lead-documents/{lead}` |
| notification emails | `notifications` | in-app notifications replace mail-only alerts |

## Status normalisation

Legacy free-text statuses map to: `new`, `assigned`, `in_progress`,
`documents_pending`, `under_review`, `approved`, `rejected`, `disbursed`,
`closed`. Anything unrecognised is imported as `new` with the original value
copied into `notes`.

## Cut-over steps

1. Freeze writes in WordPress.
2. Run `php artisan migrate --force` on the target database.
3. Import users first, then leads, then assignments, history, documents.
4. Re-run the matching engine per lead (`POST /api/v1/leads/{id}/match`).
5. Spot-check dashboards for each role, then open the Angular app to users.
