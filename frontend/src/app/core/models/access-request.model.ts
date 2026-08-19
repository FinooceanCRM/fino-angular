import { UserSummary } from './lead.model';

export interface AccessRequestLeadSummary {
  id: number;
  reference: string;
  applicant_name: string;
  loan_type: string;
  status: string;
}

export type AccessRequestStatusFilter = 'pending' | 'approved' | 'rejected';
/** "matched" = Send Request from Matched Leads; "priority" = Request Full Details from Priority Leads. */
export type AccessRequestOrigin = 'matched' | 'priority';

export interface AccessRequest {
  id: number;
  status: AccessRequestStatusFilter;
  status_label: string;
  status_colour: string;
  origin: AccessRequestOrigin;
  origin_label: string;
  remarks: string | null;
  decision_remarks: string | null;
  lead: AccessRequestLeadSummary | null;
  banker: UserSummary | null;
  decided_by: UserSummary | null;
  decided_at: string | null;
  created_at: string | null;
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
