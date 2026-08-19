# Document Management Audit

This document inspects file uploads, storage, types and versioning.

File uploads
- Documents persisted in `documents` table with `document_type`, `path`, `uploaded_by` and `status`.
- Document types are enumerated in [backend/app/Enums/DocumentType.php](/C:/fino-angular/fino-angular/backend/app/Enums/DocumentType.php) and include: aadhaar, pan, bank_statement, income_proof, other.

Storage
- Files are stored under Laravel storage (examples under `backend/storage/app/private/lead-documents/`). Look for storage disk configuration in `backend/config/filesystems.php`.

Additional documents and version history
- There is no separate document versioning table; documents are soft-deleted when removed. No explicit version history feature is present beyond storing multiple rows per lead.

Missing items versus spec
- Required doc types listed in the audit (Front Aadhaar, Back Aadhaar, PAN Card, 6-Month Bank Statement, Electricity Bill):
  - Aadhaar and PAN: supported (DocumentType::Aadhaar, DocumentType::Pan)
  - Bank statement: supported (bank_statement) but no explicit enforcement of 6-month requirement at DB level
  - Electricity bill: not a distinct DocumentType (could be uploaded as "other").

Recommendations
- Add electricity_bill to DocumentType enum if a distinct type is required.
- Consider document versioning if legal/audit capabilities are required (store parent_id or version column).

References
- [backend/app/Enums/DocumentType.php](/C:/fino-angular/fino-angular/backend/app/Enums/DocumentType.php)
- [backend/database/migrations/2024_01_03_000005_create_documents_table.php](/C:/fino-angular/fino-angular/backend/database/migrations/2024_01_03_000005_create_documents_table.php)
- Example stored file: [backend/storage/app/private/lead-documents/](/C:/fino-angular/fino-angular/backend/storage/app/private/lead-documents)
