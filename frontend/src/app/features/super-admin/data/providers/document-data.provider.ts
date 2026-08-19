import { Injectable } from '@angular/core';

import { LeadDocument } from '../models/document.model';

const DOCUMENT_TYPES = [
  'PAN Card',
  'Aadhaar Card',
  'Income Proof',
  'Bank Statement (6 months)',
  'Property Papers',
  'Address Proof',
  'Photograph',
];

const UPLOADERS = ['Applicant (self-upload)', 'Amit Sharma', 'Farhan Ali', 'Divya Menon', 'Priya Nair'];

function daysAgoIso(days: number): string {
  const reference = new Date('2026-08-16T10:00:00+05:30');
  reference.setDate(reference.getDate() - days);
  return reference.toISOString();
}

/**
 * Centralized, read-only document list per lead. There's no upload flow in
 * this build, so — unlike the other providers — there's nothing to mutate:
 * `documentsFor()` deterministically derives a plausible 3–5 document set
 * from the lead id alone, so the same lead always shows the same files.
 */
@Injectable({ providedIn: 'root' })
export class DocumentDataProvider {
  documentsFor(leadId: number): LeadDocument[] {
    const count = 3 + (leadId % 3);

    return Array.from({ length: count }, (_, index) => {
      const type = DOCUMENT_TYPES[(leadId + index * 3) % DOCUMENT_TYPES.length];
      const uploader = UPLOADERS[(leadId + index) % UPLOADERS.length];
      const sizeKb = 150 + ((leadId * (index + 3) * 37) % 900);

      return {
        id: leadId * 100 + index + 1,
        lead_id: leadId,
        document_type: type,
        file_name: `${type.replace(/[^a-zA-Z0-9]+/g, '_')}_${leadId}.pdf`,
        file_size_kb: sizeKb,
        uploaded_by: uploader,
        uploaded_at: daysAgoIso(((leadId + index) % 20) + 1),
      };
    });
  }
}
