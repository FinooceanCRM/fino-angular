# Project Overview

Summary based on repository inspection (key files referenced).

Project architecture
- Monorepo with Angular frontend and Laravel backend.
  - Frontend: [frontend/](/C:/fino-angular/fino-angular/frontend)
  - Backend: [backend/](/C:/fino-angular/fino-angular/backend)
  - Public assets: [public/](/C:/fino-angular/fino-angular/public)

Frontend stack
- Angular (TypeScript). Node.js-based toolchain and dependencies under [frontend/package.json](/C:/fino-angular/fino-angular/frontend/package.json).
- Angular CLI cache present: [frontend/.angular/](/C:/fino-angular/fino-angular/frontend/.angular)

Backend stack
- Laravel (PHP) application in [backend/](/C:/fino-angular/fino-angular/backend).
- Authentication: Laravel Sanctum (see [backend/config/sanctum.php](/C:/fino-angular/fino-angular/backend/config/sanctum.php)).
- Policies and services implement business logic (examples: [backend/app/Policies/LoanLeadPolicy.php](/C:/fino-angular/fino-angular/backend/app/Policies/LoanLeadPolicy.php), [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)).

Database
- Migrations under [backend/database/migrations/](/C:/fino-angular/fino-angular/backend/database/migrations).
- Primary lead table: [backend/database/migrations/2024_01_03_000000_create_loan_leads_table.php](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000000_create_loan_leads_table.php)

Folder structure (high-level)
- backend/
  - app/ (Models, Http, Services, Policies)
  - routes/ (api.php)
  - database/ (migrations, seeders, factories)
  - config/
- frontend/
  - src/ (Angular app)
  - package.json

Dependencies
- Backend: composer-managed packages (see [backend/composer.json](/C:/fino-angular/fino-angular/backend/composer.json), [backend/composer.lock](/C:/fino-angular/fino-angular/backend/composer.lock)).
- Frontend: npm/yarn packages under [frontend/package.json](/C:/fino-angular/fino-angular/frontend/package.json) and large node_modules folder.

Notes and quick observations
- The backend implements a phased development plan (comments mention "Phase 9" for lead workflow).
- Business rules (assignment, visibility, matching) are enforced across repository, services and policies rather than purely in controllers.
- Several enums are used for typed domains: [backend/app/Enums/](/C:/fino-angular/fino-angular/backend/app/Enums) (UserRole, LeadStatus, DocumentType, LoanType).

References
- API routes: [backend/routes/api.php](/C:/fino-angular/fino-angular/backend/routes/api.php)
- Lead controller: [backend/app/Http/Controllers/Api/V1/LeadController.php](/C:/fino-angular/fino-angular/backend/app/Http/Controllers/Api/V1/LeadController.php)
- Lead service: [backend/app/Services/LeadService.php](/C:/fino-angular/fino-angular/backend/app/Services/LeadService.php)
- Loan lead model: [backend/app/Models/LoanLead.php](/C:/fino-angular/fino-angular/backend/app/Models/LoanLead.php)

(End of overview)
