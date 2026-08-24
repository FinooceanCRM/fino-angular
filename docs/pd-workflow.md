# PD Workflow: Basic Lead Form vs. Full PD Form

This document describes the two-tier lead data collection workflow: the
**Basic Lead Form** (lead creation, unchanged) and the **Full PD Form** (new
— recreates the legacy WordPress Fluent Form #39 "PD Form" natively).

## 1. Basic Lead Form

Unchanged by this work. Creates the initial `LoanLead` record.

- **Frontend**: `frontend/src/app/features/leads/form/lead-form.component.ts`, routed at `leads/create` and `leads/:id/edit`. Shared across every role — no per-role lead-creation forms exist.
- **Backend**: `POST /api/v1/leads` → `LeadController::store()` → `StoreLeadRequest` → `LeadService::create()`.
- **Roles**: any active user (`LoanLeadPolicy::create()` — `$actor->is_active`). Relationship Manager, Employee, Banker, Connector, Telecaller, Manager and Super Admin can all submit it.
- **Fields**: the core lead record (applicant name/phone/email, loan type/amount, city/state) plus a free-form `details` JSON blob capturing ~19 wizard fields (gender, DOB, address, loan-type-specific fields). This is a *different* JSON column from the new `pd_details` below.

## 2. Full PD Form

New. Captures the ~275-field pre-disbursement verification dataset the
original Fluent Form #39 collected, for a lead that already exists.

- **Frontend**: `frontend/src/app/features/leads/pd/pd-form.component.ts`, routed at `leads/:id/pd` (shared route tree, same pattern as `leads/create`).
- **Backend**: `POST /api/v1/leads/{lead}/pd` → `LeadController::submitPd()` → `SubmitPdRequest` → `LeadService::submitPd()`. Existing data (to resume/pre-fill) is read via `GET /api/v1/leads/{lead}/pd` → `LeadController::showPd()`.

### 2.1 Relationship to the old `pd-complete` endpoint

The original Phase 6 workflow (`POST /api/v1/leads/{lead}/pd-complete` →
`LeadController::completePd()` → `CompletePdRequest` → `LeadService::completePd()`
→ `LoanLeadPolicy::completePd()`) only ever recorded a timestamp and an
actor — no applicant data. It is **left completely untouched** by this work:
the route, controller method, request class, service method and policy
method all still exist and still work if called. The Telecaller UI simply no
longer links to it — both "Mark PD complete" call sites (`telecaller-lead-panel`,
`telecaller-pd-queue`) now navigate to the Full PD form instead.

## 3. Roles & authorization

| Role | Full PD |
|---|---|
| Super Admin | ✅ allowed |
| Manager | ✅ allowed |
| Telecaller | ✅ allowed |
| Relationship Manager | ❌ forbidden |
| Employee | ❌ forbidden |
| Banker | ❌ forbidden |
| Connector | ❌ forbidden |

Enforced in **two independent layers**:

- **Backend (authoritative)**: `LoanLeadPolicy::submitPd()` —
  ```php
  public function submitPd(User $actor, LoanLead $lead): bool
  {
      return in_array($actor->roleEnum(), [
          UserRole::SuperAdmin, UserRole::Manager, UserRole::Telecaller,
      ], true) && $lead->pd_completed_at === null;
  }
  ```
  Checked via `$this->authorize('submitPd', $model)` in `LeadController::submitPd()`. A non-allowed role (or a lead whose PD is already complete) gets a 403, regardless of what the frontend shows.
- **Frontend (UX only)**: the `leads/:id/pd` route carries `canActivate: [authGuard, roleGuard]` with `data: { roles: ['super_admin', 'manager', 'telecaller'] }`. The "Complete Full PD" action itself is shown/hidden via a `can_submit_pd` flag on the `Lead` API resource (mirrors `LoanLeadPolicy::submitPd()`, same pattern as the existing `can_change_status`/`can_assign` flags), consumed by:
  - `telecaller-lead-panel` / `telecaller-pd-queue` (Telecaller)
  - `manager-lead-detail` — shared by Manager **and** Relationship Manager; the button only appears for Manager because `can_submit_pd` is server-computed per actor, so RM viewing the identical component sees it hidden without any client-side role branching.
  - `super-admin-lead-detail` — one static button (this module's lead-detail screen is entirely mock-data-driven, so it isn't flag-gated; the real backend enforces authorization regardless of what this screen shows).

## 4. Conditional logic

Recreated natively via a small, generic evaluator rather than per-field
`if` statements — `frontend/src/app/features/leads/pd/pd-visibility.util.ts`:

```ts
pdConditionsMet(form, conditions)
```

Each conditional field/section in the templates is wrapped in
`@if (pdVisible([{ field: 'LOAN_TYPE', value: 'Home Loan' }, ...]))`. Rule:
the field/section is visible if **any** listed condition currently matches —
plain disjunction over the flat list, whether two conditions name the same
field or different ones. This mirrors the source Form 39 export's own
`conditional_logics.type` verbatim: every rule in the entire ~275-field
export that actually names a field uses `"type":"any"` (Fluent Forms' "match
ANY of these" mode); the only two `"type":"all"` occurrences in the whole
file are unconfigured placeholders with an empty field/value, never a real
rule. Examples:

- `LOAN_TYPE = Home Loan` → show HL sub-type field
- `LOAN_TYPE = Personal Loan` OR `Type_of_Customer = If Salaried` → show the salaried-employment fieldset
- `Type_of_Customer = Business` OR `Professional` OR `Salaried` → show the Family Member repeater (effectively always, since those are the only three values)

A field can also carry its *own* condition on top of its enclosing
container's — those two layers genuinely AND together (e.g. the
Partner/Director repeater's container requires `Type_of_Customer = Business`
OR `Partnership_Business = YES`, and `Type_of_Firm` additionally requires its
own `PARTNERSHIP = YES` before it shows) — but within a single
`conditions` list passed to one `pdVisible()` call, it's always OR.

An earlier version of `pdConditionsMet()` AND'd conditions naming different
fields together (e.g. requiring `LOAN_TYPE = Personal Loan` *and*
`Type_of_Customer = If Salaried`), which doesn't match the source form at
all — it silently made several sections unreachable, since the extra field
in the AND is sometimes only ever set via a different, unrelated flow (e.g.
`Partnership_Business` is only set from the Salaried "other income = Business"
sub-path, never from the direct Business/Self-employed flow whose own
section it was gating).

The same evaluator gates the 7 address blocks (e.g. `Office_Address` only for `Type_of_Customer = If Professional`) and the 3 repeaters.

Backend validation does **not** enforce these conditions — every field is
`nullable` regardless of whether its section is currently visible, matching
the source form (zero required fields) and avoiding brittle cross-field
required-if rules for a 275-field dataset that a Telecaller may need to
save partially.

## 5. Database structure

One new nullable `pd_details` JSON column on `loan_leads`
(migration `2026_08_22_000000_add_pd_details_to_loan_leads_table.php`),
cast as `array` on the `LoanLead` model. This mirrors the existing `details`
JSON column already used by the Basic Lead Form's wizard — same storage
pattern, kept as a **separate** column since the two are captured at
different workflow stages by different roles.

- **Flat fields** (~169): stored as top-level keys, e.g. `pd_details->LOAN_TYPE`, `pd_details->Age`.
- **Address groups** (7): `Current_Residential_Address`, `Permanent_Address`, `Current_Employer_Company_Address`, `Employer_Address`, `Office_Address`, `Business__Employement_Address`, `Property_Address__as_per_site_` — each a nested object (`address_line_1`, `address_line_2`, `city`, `state`, `zip`, `country`, `latitude`, `longitude`).
- **Repeaters** (3): `existing_loans`, `family_members`, `partner_directors` — arrays of row objects.

Field names deliberately match the original Form 39 field names (not
renamed to snake_case), so the Angular payload, `SubmitPdRequest` validation
keys and the stored JSON are all identical — no mapping/transform layer.

Every key is validated individually in `SubmitPdRequest` (types/lengths per
the original field type — `numeric` for number fields, `date` for date
fields, `Rule::in(['YES','NO'])` for checkboxes, `.*.` wildcard rules for
the 3 repeater arrays) rather than accepted as an opaque blob — this is the
same pattern already used for `BankCriteria.eligibility_rules`.

PD completion metadata (unchanged from Phase 6): `pd_completed_at`
(timestamp) and `pd_completed_by` (FK to `users`).

## 6. API endpoints

| Method | Path | Controller method | Purpose |
|---|---|---|---|
| GET | `/api/v1/leads/{lead}/pd` | `showPd()` | Existing `pd_details` + `can_submit_pd`, to pre-fill/resume the form |
| POST | `/api/v1/leads/{lead}/pd` | `submitPd()` | Validate + persist the full PD dataset, set completion metadata |
| POST | `/api/v1/leads/{lead}/pd-complete` | `completePd()` | Legacy, untouched — timestamp-only completion (no longer linked from the UI) |

No route-level `role:` middleware — authorization is policy-level only,
consistent with every other `leads/*` route.

## 7. Angular components

```
frontend/src/app/features/leads/pd/
  pd-form.component.ts/.html          — master stepper shell, owns the ONE shared FormGroup
  pd-visibility.util.ts               — pdConditionsMet() conditional-logic evaluator
  pd-repeater-factories.ts            — row-group factories for the 3 repeaters (shared between
                                         "Add row" and pre-fill, so both build identical rows)
  sections/
    applicant-basics/                 — loan basics, caste, personal address
    employment-business/              — employment type, employer/company info, references
    salaried-income-banking/          — salary type, bank details, salaried other income
    professional/                     — profession info, incorporation, office address
    business-partner/                 — business & partner info, business incorporation, business address
    applicant-itr/                    — applicant's 3-year ITR
    firm-itr/                         — firm's 3-year ITR
    existing-loans/                   — FormArray repeater
    family-members/                   — FormArray repeater
    partner-directors/                — FormArray repeater (partnership-only)
    property/                         — home/mortgage/LAP property info & address
```

All 11 section components are presentational: each takes the master
`form: FormGroup` as an `input.required<FormGroup>()` and binds directly
against it (`[formGroup]="form()"`), so submission is a single
`form.getRawValue()` — no per-section merge/transform step. This follows
the codebase's one existing multi-step form precedent
(`lead-form.component.ts`'s `mat-stepper`) and its one existing `FormArray`
precedent (`super-admin-matching-engine-settings.component.ts`'s add/remove-row idiom).

Shared CSS (`.pd-form__grid`, `.pd-form__section-title`, `.pd-form__address`,
`.pd-form__repeater-row`) lives in the global `frontend/src/styles.scss`
rather than a per-component stylesheet, because each section is its own
standalone component with its own emulated view encapsulation — a class
scoped to the shell's stylesheet would never reach markup rendered by a
child section component's template.

## 8. Repeaters

Three genuinely repeating structures, each a `FormArray` with an
add/remove-row UI (mirrors the existing FormArray precedent):

1. **Existing Loans / Obligations** — Sr. No., loan type, EMI amount, bounces, loan amount, EMI paid, overdue amount, opening date, status, tenure, remark.
2. **Family Member Income & Banking** — relation, co-borrower, name, bank & branch, age, A/C type, account number, IFSC, education, income type/amount, closing balance, other credits.
3. **Partner / Director Information** — name, number, KYC available, 3-year ITR available. Only shown when `Partnership_Business = YES` AND `PARTNERSHIP = YES`.

## 9. PD completion workflow

```
Basic Lead Form (any role) → LoanLead created
                │
                ▼
   Lead appears in the appropriate queues (unchanged)
                │
                ▼
   Telecaller / Manager / Super Admin opens the lead
                │
                ▼
   "Complete Full PD" button (shown only if can_submit_pd)
                │
                ▼
   Full PD Form — 8-step stepper, conditional sections
   based on loan type / customer type / partnership / property-selected
                │
                ▼
   Submit → SubmitPdRequest validates every field individually
                │
                ▼
   LeadService::submitPd():
     - guards against double-completion (pd_completed_at !== null)
     - persists pd_details, pd_completed_at, pd_completed_by
     - writes a lead_status_history entry (same-status, no real
       transition) so PD completion appears in the existing lead
       timeline — a gap the old completePd() action had
     - notifies the assigned RM and Manager (type: lead.full_pd_completed)
                │
                ▼
   Existing downstream workflow continues unchanged — status is
   deliberately not touched (only Super Admin/Manager/RM change status,
   per the pre-existing business rule); no new LeadStatus value was added.
```

## 10. What was deliberately left unchanged

- `StoreLeadRequest`, `LeadFormComponent`, `LeadService::create()`, the `details` JSON column and every existing lead-creation field/validator.
- `CompletePdRequest`, `LeadController::completePd()`, `LeadService::completePd()`, `LoanLeadPolicy::completePd()`, the `/pd-complete` route — all untouched and still callable.
- `LeadStatus` enum — no new status added.
- Super Admin's mock `LeadDataProvider`/`NotificationDataProvider` module — untouched beyond the one added button.
- Every other role's dashboards, policies and routes.
