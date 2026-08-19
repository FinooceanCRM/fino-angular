import { Injectable, computed, inject, signal } from '@angular/core';

import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';

import { currentRmId } from '../../leads/current-rm';

export type KycDocumentType = 'PAN Card' | 'Aadhaar Card' | 'Income Proof' | 'Bank Statement' | 'Photograph';
export type KycStatus = 'pending' | 'verified' | 'rejected';

export interface KycDocument {
  id: number;
  leadId: number;
  documentType: KycDocumentType;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: KycStatus;
  rejectionReason: string | null;
}

const NOW = new Date('2026-08-15T10:00:00+05:30');

function daysAgoIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - days);
  return at.toISOString();
}

interface KycSeed {
  leadId: number;
  documentType: KycDocumentType;
  fileName: string;
  uploadedBy: string;
  daysAgo: number;
  status: KycStatus;
  rejectionReason?: string;
}

// leadId values are drawn from ManagerLeadDataProvider's own seed set, scoped to Priya Nair (id 111).
const SEEDS: KycSeed[] = [
  { leadId: 6, documentType: 'PAN Card', fileName: 'pan_rohan_kulkarni.pdf', uploadedBy: 'Amit Sharma', daysAgo: 1, status: 'pending' },
  { leadId: 6, documentType: 'Aadhaar Card', fileName: 'aadhaar_rohan_kulkarni.pdf', uploadedBy: 'Amit Sharma', daysAgo: 1, status: 'pending' },
  { leadId: 7, documentType: 'PAN Card', fileName: 'pan_ishita_verma.pdf', uploadedBy: 'Farhan Ali', daysAgo: 2, status: 'verified' },
  { leadId: 10, documentType: 'Income Proof', fileName: 'salary_kabir_malhotra.pdf', uploadedBy: 'Amit Sharma', daysAgo: 3, status: 'pending' },
  { leadId: 11, documentType: 'Aadhaar Card', fileName: 'aadhaar_riya_chatterjee.pdf', uploadedBy: 'Farhan Ali', daysAgo: 4, status: 'rejected', rejectionReason: 'Scan is blurred — name not legible.' },
  { leadId: 15, documentType: 'Bank Statement', fileName: 'bank_stmt_diya_pillai.pdf', uploadedBy: 'Farhan Ali', daysAgo: 2, status: 'pending' },
  { leadId: 18, documentType: 'PAN Card', fileName: 'pan_vikram_oberoi.pdf', uploadedBy: 'Amit Sharma', daysAgo: 5, status: 'verified' },
  { leadId: 18, documentType: 'Photograph', fileName: 'photo_vikram_oberoi.jpg', uploadedBy: 'Amit Sharma', daysAgo: 5, status: 'pending' },
  { leadId: 19, documentType: 'Aadhaar Card', fileName: 'aadhaar_pooja_nambiar.pdf', uploadedBy: 'Farhan Ali', daysAgo: 1, status: 'pending' },
  { leadId: 22, documentType: 'Income Proof', fileName: 'salary_simone_dsouza.pdf', uploadedBy: 'Amit Sharma', daysAgo: 8, status: 'verified' },
  { leadId: 26, documentType: 'PAN Card', fileName: 'pan_kritika_suri.pdf', uploadedBy: 'Amit Sharma', daysAgo: 6, status: 'rejected', rejectionReason: 'PAN number does not match applicant details.' },
];

/**
 * KYC Verification — the same "document verification" concept the shared
 * Documents page tracks (status: Verified/Pending/Rejected), presented as a
 * dedicated review queue scoped to this RM's own leads. Mock state only.
 */
@Injectable({ providedIn: 'root' })
export class RelationshipManagerKycDataProvider {
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly rmId = currentRmId();

  private readonly _documents = signal<KycDocument[]>(
    SEEDS.map((seed, index) => ({
      id: index + 1,
      leadId: seed.leadId,
      documentType: seed.documentType,
      fileName: seed.fileName,
      uploadedBy: seed.uploadedBy,
      uploadedAt: daysAgoIso(seed.daysAgo),
      status: seed.status,
      rejectionReason: seed.rejectionReason ?? null,
    })),
  );

  readonly documents = computed(() => {
    const myLeadIds = new Set(
      this.leadData.leads().filter((lead) => lead.assigned_relationship_manager?.id === this.rmId).map((lead) => lead.id),
    );
    return this._documents().filter((doc) => myLeadIds.has(doc.leadId));
  });

  leadFor(leadId: number) {
    return this.leadData.getById(leadId);
  }

  verify(id: number): void {
    this._documents.update((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, status: 'verified', rejectionReason: null } : doc)),
    );
  }

  reject(id: number, reason: string): void {
    this._documents.update((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, status: 'rejected', rejectionReason: reason } : doc)),
    );
  }
}
