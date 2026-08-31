# FINOOCEAN — UI Mockups ("Tidewater" direction)

47 high-fidelity mockup images covering every page, role dashboard, popup/dialog,
form, filter bar, and notification pattern in the fino-angular project — reimagined
with a distinctive visual identity built around the brand's own name.

## The idea

"FinoOcean" was sitting right there unused. Instead of another generic blue
SaaS-gradient dashboard, this direction leans all the way into the name:

- **Palette** — deep-sea navy (#0A2A43) and lagoon teal (#17A398) carry every
  structural surface (topbar, sidebar, navigation, charts). A single warm
  **coral** (#E85A3B) is reserved only for actions and decisions — primary
  buttons, checkboxes, the modal accent bar — so colour temperature itself
  tells you what's navigation versus what's a choice.
- **Type** — Lora (serif) for the handful of moments that carry the brand's
  voice: hero headlines, page titles, the login screen. Poppins (geometric
  sans) for everything dense — tables, forms, nav, buttons — so legibility
  never suffers.
- **Wave motifs** — a thin shoreline line rides under every topbar; layered
  horizon waves animate the login screen and every dashboard's hero banner,
  instead of the generic blurred-circle "AI gradient blob" look.
- **Signature element — Voyage Progress**: the lead lifecycle (Lead Created →
  Assigned → Documents → Under Review → Bank Matched → Disbursed) is rendered
  as a wave path with buoy markers — teal-filled and checked for completed
  stages, a glowing coral buoy for the current stage, hollow for what's ahead.
  It's not decoration: it's the same information a plain progress bar would
  carry, staged as the literal "voyage" a loan takes to harbour. See
  `03-leads/02_lead_detail_overview.png` and `03-leads/03_lead_detail_workflow.png`.
- **Brand mark** — the topbar icon is now an anchor rather than a generic bank
  glyph, doubling as a small nod to stability/trust for a lending platform.

Sample data (names, loan amounts, banks, statuses) is illustrative placeholder
content, not real user data.

## Folder guide

| Folder | Contents |
|---|---|
| 01-auth | Login (wave horizon, serif headline, anchor mark), 403 Not Authorised, 404 Not Found |
| 02-dashboards | All 7 role dashboards with a wave-bottomed welcome banner: Super Admin, Manager, Relationship Manager, Employee, Banker, Connector, Telecaller |
| 03-leads | Leads list (filters), Lead detail (Overview + Workflow tabs, **with the Voyage Progress signature**), New Lead form, PD multi-section form, Lead quick-view popup, Reassign popup |
| 04-customers | Customer profile, Edit-customer popup, Document preview popup |
| 05-users-access | Users list (role tabs), Add/Edit-user popup, View-user popup, Roles & Permissions, Access Requests, Approval Center |
| 06-banks | Banks list, Bank Criteria page + Edit-criteria popup |
| 07-matching-commissions | Matching Engine, Assign-banker popup, Commission Accounting/Payouts, Affiliate & Connector Commission |
| 08-reports | Reports overview (gradient wave charts), User performance reports |
| 09-notifications-search | Notifications page, Notification bell dropdown popup, Global search overlay popup |
| 10-settings-audit | General Settings (tabbed), Audit Logs list, Audit log detail popup |
| 11-team-tasks-docs | Team hierarchy/performance, Task list (bucket nav), New-task popup, Documents page |
| 12-profile | My Profile page |
| 13-design-system | UI Kit reference sheet (palette, type, buttons, pills, form fields), Toast/snackbar notification example |

## File naming

Files are numbered in each folder for suggested review order, e.g.
`03-leads/02_lead_detail_overview.png`.

## Notes for handoff

- These are visual/functional mockups for review and sign-off — recreate them
  as real Figma files or in code for production. The underlying structure
  (sidebar, topbar, cards, tables) still maps directly onto the existing
  Angular components.
- Typefaces: **Lora** (display) + **Poppins** (UI/body) — both are free on
  Google Fonts; self-host or link them in `index.html` if this direction is
  adopted.
- Icons are simplified custom line icons standing in for the Material Icons
  font used in the real app, plus a few new maritime ones (anchor, compass,
  lighthouse) used for brand flavour — swap in a proper icon set for build.
- The Voyage Progress component is the one deliberate "signature" risk in this
  set — everything else stays disciplined and quiet around it, per the brief
  of taking one real risk rather than decorating every screen.
