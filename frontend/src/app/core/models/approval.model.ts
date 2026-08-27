/**
 * Approval Center domain models (Phase 5, Part A). Mirrors the backend's
 * ApprovalResource shape. Covers the Banker/Lead/Document approval types —
 * the Access type is served by `AccessRequestService` /
 * `access-request.model.ts` and rendered by a separate list component.
 */
import { UserSummary } from './lead.model';

export type ApprovalType = 'banker' | 'lead' | 'document';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalLeadSummary {
  id: number;
  reference: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  city: string | null;
  banker: UserSummary | null;
}

export interface ApprovalComment {
  id: number;
  author: string;
  body: string;
  created_at: string | null;
}

export interface Approval {
  id: number;
  type: ApprovalType;
  title: string;
  subtitle: string | null;
  requested_by: UserSummary | null;
  requested_at: string | null;
  status: ApprovalStatus;
  decided_by: UserSummary | null;
  decided_at: string | null;
  decision_remarks: string | null;
  lead_id: number | null;
  lead: ApprovalLeadSummary | null;
  comments: ApprovalComment[];
  created_at: string | null;
}

export interface ApprovalDraft {
  type: ApprovalType;
  title: string;
  subtitle?: string | null;
  loan_lead_id?: number | null;
}

export interface ApprovalFilters {
  type?: ApprovalType;
  status?: ApprovalStatus;
  page?: number;
  per_page?: number;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
