import { Injectable, computed, signal } from '@angular/core';

export type ApprovalType = 'banker' | 'lead' | 'document' | 'access';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalComment {
  id: number;
  author: string;
  body: string;
  created_at: string;
}

export interface ApprovalRequest {
  id: number;
  type: ApprovalType;
  title: string;
  subtitle: string;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionRemarks: string | null;
  /** Cross-links to a lead in `ManagerLeadDataProvider`, when relevant — the UI resolves the live reference/applicant. */
  leadId: number | null;
  comments: ApprovalComment[];
}

const NOW = new Date('2026-08-15T10:00:00+05:30');

function daysAgoIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - days);
  return at.toISOString();
}

const SEED_REQUESTS: ApprovalRequest[] = [
  // Banker approvals — new banker onboarding / product line requests.
  {
    id: 1,
    type: 'banker',
    title: 'Karan Oberoi — Yes Bank',
    subtitle: 'New banker registration, Mumbai branch',
    requestedBy: 'Karan Oberoi',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(2),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: null,
    comments: [],
  },
  {
    id: 2,
    type: 'banker',
    title: 'Meera Kulkarni — IDFC First Bank',
    subtitle: 'New banker registration, Pune branch',
    requestedBy: 'Meera Kulkarni',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(1),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: null,
    comments: [
      { id: 1, author: 'Rahul Mehta', body: 'Checking with compliance on IDFC empanelment status.', created_at: daysAgoIso(0) },
    ],
  },
  {
    id: 3,
    type: 'banker',
    title: 'Vivek Joshi — HDFC Bank',
    subtitle: 'Additional product line — Home Advantage Plus',
    requestedBy: 'Vivek Joshi',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(12),
    status: 'approved',
    decidedBy: 'Rahul Mehta',
    decidedAt: daysAgoIso(10),
    decisionRemarks: 'Existing HDFC relationship in good standing.',
    leadId: null,
    comments: [],
  },

  // Lead approvals — final sign-off requested by the RM/employee handling the lead.
  {
    id: 4,
    type: 'lead',
    title: 'Final approval requested',
    subtitle: 'Business loan under credit review',
    requestedBy: 'Amit Sharma',
    requestedByRole: 'Employee',
    requestedAt: daysAgoIso(1),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 18,
    comments: [],
  },
  {
    id: 5,
    type: 'lead',
    title: 'Final approval requested',
    subtitle: 'Home loan under credit review',
    requestedBy: 'Farhan Ali',
    requestedByRole: 'Employee',
    requestedAt: daysAgoIso(2),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 19,
    comments: [
      { id: 2, author: 'Priya Nair', body: 'Income documents verified — recommending approval.', created_at: daysAgoIso(1) },
    ],
  },
  {
    id: 6,
    type: 'lead',
    title: 'Final approval requested',
    subtitle: 'Loan against property — assigned',
    requestedBy: 'Priya Nair',
    requestedByRole: 'Relationship Manager',
    requestedAt: daysAgoIso(6),
    status: 'approved',
    decidedBy: 'Rahul Mehta',
    decidedAt: daysAgoIso(5),
    decisionRemarks: 'Approved — proceed to disbursement.',
    leadId: 6,
    comments: [],
  },

  // Document approvals — KYC / income documents awaiting sign-off.
  {
    id: 7,
    type: 'document',
    title: 'Aadhaar Card',
    subtitle: 'Uploaded for documents-pending lead',
    requestedBy: 'Farhan Ali',
    requestedByRole: 'Employee',
    requestedAt: daysAgoIso(1),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 15,
    comments: [],
  },
  {
    id: 8,
    type: 'document',
    title: 'Income Proof',
    subtitle: 'Uploaded for documents-pending lead',
    requestedBy: 'Sneha Bhatt',
    requestedByRole: 'Employee',
    requestedAt: daysAgoIso(2),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 16,
    comments: [],
  },
  {
    id: 9,
    type: 'document',
    title: 'PAN Card',
    subtitle: 'Uploaded for documents-pending lead',
    requestedBy: 'Karan Verma',
    requestedByRole: 'Employee',
    requestedAt: daysAgoIso(5),
    status: 'approved',
    decidedBy: 'Rahul Mehta',
    decidedAt: daysAgoIso(4),
    decisionRemarks: 'Clear scan, matches applicant details.',
    leadId: 17,
    comments: [],
  },

  // Access approvals — bankers requesting access to a lead.
  {
    id: 10,
    type: 'access',
    title: 'Vivek Joshi requests access',
    subtitle: 'HDFC Bank — matched on loan type and income',
    requestedBy: 'Vivek Joshi',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(1),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 2,
    comments: [],
  },
  {
    id: 11,
    type: 'access',
    title: 'Swati Menon requests access',
    subtitle: 'ICICI Bank — matched on loan type and credit score',
    requestedBy: 'Swati Menon',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(2),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionRemarks: null,
    leadId: 4,
    comments: [],
  },
  {
    id: 12,
    type: 'access',
    title: 'Vivek Joshi requests access',
    subtitle: 'HDFC Bank',
    requestedBy: 'Vivek Joshi',
    requestedByRole: 'Banker',
    requestedAt: daysAgoIso(9),
    status: 'rejected',
    decidedBy: 'Rahul Mehta',
    decidedAt: daysAgoIso(8),
    decisionRemarks: 'Lead already has sufficient matches from an existing partner bank.',
    leadId: 9,
    comments: [],
  },
];

/**
 * Centralized mock state for the Approval Center — Banker, Lead, Document
 * and Access approvals share one shape (title/subtitle, requester, status,
 * comment thread) so Approve / Reject / Review / Add comments work the same
 * way across all four. `leadId` cross-links into `ManagerLeadDataProvider`
 * for display; this provider never mutates lead state itself.
 */
@Injectable({ providedIn: 'root' })
export class ManagerApprovalDataProvider {
  private readonly _requests = signal<ApprovalRequest[]>(SEED_REQUESTS);
  private nextId = SEED_REQUESTS.length + 1;
  private nextCommentId = Math.max(...SEED_REQUESTS.flatMap((r) => r.comments.map((c) => c.id)), 0) + 1;

  readonly requests = this._requests.asReadonly();

  byType(type: ApprovalType): ApprovalRequest[] {
    return this._requests()
      .filter((row) => row.type === type)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  pendingCount(type: ApprovalType): number {
    return this._requests().filter((row) => row.type === type && row.status === 'pending').length;
  }

  getById(id: number): ApprovalRequest | undefined {
    return this._requests().find((row) => row.id === id);
  }

  approve(id: number, remarks?: string): void {
    this.decide(id, 'approved', remarks ?? null);
  }

  reject(id: number, reason: string): void {
    this.decide(id, 'rejected', reason);
  }

  private decide(id: number, status: ApprovalStatus, remarks: string | null): void {
    this._requests.update((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              status,
              decidedBy: 'Rahul Mehta',
              decidedAt: new Date().toISOString(),
              decisionRemarks: remarks?.trim() || null,
            }
          : row,
      ),
    );
  }

  addComment(id: number, body: string): void {
    const comment: ApprovalComment = {
      id: this.nextCommentId++,
      author: 'Rahul Mehta',
      body,
      created_at: new Date().toISOString(),
    };

    this._requests.update((current) =>
      current.map((row) => (row.id === id ? { ...row, comments: [...row.comments, comment] } : row)),
    );
  }
}
