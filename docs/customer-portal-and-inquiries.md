# Public website, customer portal and Customer Inquiries

Extension of the existing CRM — one Laravel API, one Angular app, one `loan_leads` table.

## Flow

```
Public website → eligibility estimate → inquiry (anonymous or signed-in customer)
  → loan_leads row (source = website | customer_portal, inquiry_status = new)
  → Customer Inquiries queue (Telecaller + Super Admin only)
  → Telecaller claims / calls / logs follow-ups
  → assigns to a Manager (routing rules per department, row-locked, audited)
  → existing Manager → RM → Employee → Banker workflow
  → customer sees mapped status + next actions in /account
```

**Update — apply requires an account.** Eligibility and the EMI calculator are open and create nothing (no inquiry,
no reference number). Applying requires a customer account: "Apply" / "Create a free account to apply" go to
`/register?redirectTo=/account/apply?product=…&amount=…&years=…`, so after sign-up (or login) the customer lands on the
application form with those values pre-filled, and the application appears on their own dashboard. The anonymous
`POST /public/inquiries` returns 403 unless `WEBSITE_ANONYMOUS_INQUIRIES=true` (`config/website.php`).

## Roles and access

**Single sign-in:** staff and customers use the same page (`/login`) and the same endpoint (`POST /auth/login`);
the app routes by role afterwards (customer → `/account`, staff → their workspace). `/auth/login` redirects to `/login`.
A customer token is harmless against the CRM because the `staff` middleware refuses it on every CRM route.
`POST /customer/auth/login` still exists (customer-only) but the UI no longer uses it.

| Surface | Customer | Telecaller | Super Admin | Manager / RM / Employee / Banker / others |
|---|---|---|---|---|
| Public site, `/public/*` | yes | yes | yes | yes |
| `/customer/*` API, `/account/*` UI | own data only | 403 | 403 | 403 |
| `/inquiries*` API, `/inquiries` UI | 403 | yes (claim-on-first-touch) | yes (all, override, routing rules) | 403 |
| Every pre-existing CRM route | 403 (`staff` middleware) | unchanged | unchanged | unchanged |

Enforcement is server-side: `EnsureUserIsStaff` (`staff`) fences customers out of every CRM route,
`role:customer` guards the portal, `role:telecaller,super_admin` guards the queue and
`InquiryQueueService::assertStaff` repeats the check. Angular guards are UX only.

## Data model changes (`2026_10_28_000100_customer_portal_and_inquiries`)

- `users.role` ENUM gains `customer` (MySQL only; same technique as the vendor role).
- `customers.user_id` (unique, nullable) links a portal login to its `customers` row.
- `loan_leads`: `source`, `customer_id`, `inquiry_status`, `inquiry_key` (unique, idempotency),
  `last_contacted_at`, `next_follow_up_at`, `resubmission_count`. Existing rows default to `source = internal`.
- `inquiry_activities` — notes, contacts, status changes, assignments (internal only, never shown to customers).
- `inquiry_routing_rules` — department → Manager(s).

Rollback is supported (`down()`), but only safe before any `customer` user exists (the ENUM shrink would fail otherwise).

## API (all under `/api/v1`)

Public: `GET public/loan-products[/{slug}]`, `POST public/eligibility`, `POST public/inquiries`,
`POST customer/auth/register`, `POST customer/auth/login`.
Customer (`role:customer`): `customer/dashboard|applications|applications/{id}|documents|notifications`,
`POST customer/applications`, `POST customer/applications/{id}/documents`, `GET customer/documents/{id}/download`,
`PUT customer/profile`; `auth/me|logout|password` are shared.
Staff (`role:telecaller,super_admin`): `inquiries`, `inquiries/{meta,stats,routing-rules}`, `inquiries/{id}`,
`…/claim|status|activities|managers|assign`; `PUT inquiries/routing-rules/{department}` is Super Admin only.

## Rules worth knowing

- **Ownership:** the first Telecaller to act claims an inquiry; another Telecaller gets 409. Super Admin may act on any.
- **Assignment:** row-locked transaction; Telecaller can assign once, only to a Manager configured for the lead's
  department (any active Manager if the department has no rule); Super Admin can reassign with a reason. Records
  `lead_assignments`, status history, activity, audit log, and notifies the Manager and the customer.
- **Duplicates:** same idempotency key → same lead. Open inquiry for the same phone + loan type within 30 days →
  no new lead; `resubmission_count` incremented and the owner notified. Other leads sharing the phone are shown as a
  warning on the detail page; nothing is merged. A customer is linked to a lead only when submitting while signed in.
- **Customer status mapping:** `App\Support\CustomerFacingStatus` is the only translation; internal statuses and remarks
  never reach the portal. Customers cannot set statuses.
- **Documents:** stored on the private `local` disk, served only through the authenticated, ownership-checked endpoint,
  PDF/JPG/PNG ≤ 5 MB (extension and sniffed MIME), verified documents cannot be replaced by the customer.
- **Eligibility:** `config/eligibility.php` holds PLACEHOLDER rules (FOIR, assumed rates, minimum income). They are not
  approved by the credit team; the result is always labelled indicative. Content in `config/loan_products.php`
  contains no rates, partners or approval claims.

## Configuration / deployment notes

- Run `php artisan migrate`. No seeder is required; Super Admin sets inquiry routing at `/inquiries/routing`.
- Set `CAPTCHA_SECRET_KEY` (see `config/services.php`) in production. The public inquiry endpoint enforces hCaptcha **only when
  a secret is configured**; without one it relies on throttling (10/hour/IP) and the honeypot.
- `config/loan_products.php`, `config/eligibility.php` and `features/website/website.config.ts` (contact details, FAQs)
  contain business content that must be confirmed before launch.

## Not built (needs business/backend decisions — nothing is simulated)

- **Payments, EMI dashboard, prepayment, foreclosure, loan closure/NOC:** no repayment, schedule or payment-provider backend
  exists. Needs a loan-account model, a payment gateway integration and reconciliation. The customer nav has no such items.
- **Offers, support tickets, KYC verification wizard, bank/UPI details, communication preferences, delete-account:** no backend.
  KYC status is shown per document (Verified / Under review / Rejected) using the existing document review flow.
- **Blog and testimonials:** no genuine approved content exists; not published.
- **Mobile-OTP login, password reset, email verification:** not built (MSG91 DLT approval pending). Because phone/email are
  unverified, anonymous inquiries are **not** auto-linked to a later-registered account.
- **Customer-facing "assigned advisor" details:** deliberately not exposed (internal assignment data).

## Test plan (to run next)

Backend: customer register/login (and staff login refusing a customer); `staff` fencing on a sample of CRM routes;
`/customer/applications/{other customer's id}` → 404; `/inquiries*` → 403 for manager/banker/customer, 200 for
telecaller/super_admin; claim race → 409; assign (rule honoured, reassign needs reason, atomic, history rows);
duplicate/idempotency; upload validation and private download; existing suite green.
Frontend: `ng build`; walk home → eligibility → apply → register → track; telecaller + super-admin queue; mobile widths.
