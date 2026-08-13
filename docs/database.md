# Database Schema (Phase 3)

MySQL 8, `utf8mb4_unicode_ci`, InnoDB. Schema only — no business logic, no CRUD.

## Roles

Hierarchy: Super Admin → Manager → Relationship Manager → Employee.
Standalone: Banker, Connector. Vendor has been removed completely.

## Tables

### users
| Column | Type | Notes |
| --- | --- | --- |
| id | bigint UP | PK |
| name | varchar(255) | |
| email | varchar(255) | unique |
| email_verified_at | timestamp | nullable |
| password | varchar(255) | hashed |
| role | enum | super_admin, manager, relationship_manager, employee, banker, connector |
| manager_id | bigint | FK → users.id, null on delete |
| relationship_manager_id | bigint | FK → users.id, null on delete |
| employee_id | bigint | FK → users.id, null on delete |
| phone | varchar(32) | nullable |
| is_active | boolean | default true |
| created_at / updated_at | timestamps | |

### roles
`id, slug (unique), name, level, description, timestamps`

### permissions
`id, slug (unique), name, group, timestamps`
Pivot `permission_role`: `role_id` FK → roles, `permission_id` FK → permissions, unique pair.

### loan_leads
`id, reference (unique), applicant_name, applicant_email, applicant_phone, loan_type, loan_amount, tenure_months, monthly_income, credit_score, employment_type, city, state, pincode, status, created_by FK → users, connector_id FK → users, notes, timestamps, deleted_at`

### lead_assignments
`id, loan_lead_id FK → loan_leads (cascade), assigned_to FK → users (cascade), assigned_by FK → users (null), status, assigned_at, released_at, remarks, timestamps`

### bank_criteria
`id, bank_name, product_name, loan_type, min_loan_amount, max_loan_amount, min_monthly_income, min_credit_score, min_age, max_age, employment_type, interest_rate, is_active, banker_id FK → users, timestamps`

### lead_matches
`id, loan_lead_id FK → loan_leads (cascade), bank_criteria_id FK → bank_criteria (cascade), match_score, status, reasons (json), timestamps` — unique(loan_lead_id, bank_criteria_id)

### lead_status_history
`id, loan_lead_id FK → loan_leads (cascade), from_status, to_status, changed_by FK → users (null), remarks, timestamps`

### documents
`id, loan_lead_id FK → loan_leads (cascade), uploaded_by FK → users (null), document_type, original_name, path, mime_type, size_bytes, status, timestamps, deleted_at`

### notifications
`id, user_id FK → users (cascade), type, title, body, data (json), read_at, timestamps`

### personal_access_tokens
Sanctum token storage (Phase 2).

## ER diagram

```text
                         +---------------------+
                         |        users        |
                         |---------------------|
                         | id (PK)             |
                         | role                |
   self-references ----> | manager_id (FK)     |
                         | relationship_manager_id (FK)
                         | employee_id (FK)    |
                         | is_active           |
                         +----------+----------+
                                    |
   +---------------+----------------+----------------+-----------------+
   |               |                |                |                 |
   v               v                v                v                 v
+--------+  +---------------+  +--------------+  +-----------+  +---------------+
| loan_  |  | lead_         |  | bank_criteria|  | documents |  | notifications |
| leads  |  | assignments   |  |  banker_id   |  | uploaded_ |  |  user_id (FK) |
| created|  | assigned_to   |  |    (FK)      |  |  by (FK)  |  +---------------+
| _by(FK)|  | assigned_by   |  +------+-------+  +-----+-----+
| connec |  +-------+-------+         |                |
| tor_id |          |                 |                |
+---+----+          |                 |                |
    |               |                 |                |
    | 1..N          | N..1            | 1..N           | N..1
    +---------------+-----------------+----------------+
    |
    +--> lead_matches (loan_lead_id FK, bank_criteria_id FK, unique pair)
    +--> lead_status_history (loan_lead_id FK, changed_by FK -> users)
    +--> documents (loan_lead_id FK)
    +--> lead_assignments (loan_lead_id FK)

+-------+        permission_role         +-------------+
| roles |<----------- N:N -------------->| permissions |
+-------+                                +-------------+
```

## Seeded data

`php artisan migrate --seed` creates:

- Roles + permissions with all permissions granted to Super Admin
- User hierarchy (password `12345678`):
  - superadmin@finoocean.test
  - manager1@finoocean.test, manager2@finoocean.test
  - rm1–rm4@finoocean.test
  - employee1@finoocean.test
  - banker@finoocean.test, connector@finoocean.test
- Four sample `bank_criteria` rows
