/** Loan-management domain models (Phase 9). */

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Lead {
  id: number;
  reference: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  loan_type: string;
  loan_amount: number;
  tenure_months: number | null;
  monthly_income: number | null;
  credit_score: number | null;
  employment_type: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: string;
  status_label: string;
  status_colour: string;
  notes: string | null;
  connector: UserSummary | null;
  assigned_employee: UserSummary | null;
  assigned_relationship_manager: UserSummary | null;
  assigned_manager: UserSummary | null;
  created_by: UserSummary | null;
  updated_by: UserSummary | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadStatusHistoryEntry {
  id: number;
  from_status: string | null;
  to_status: string;
  remarks: string | null;
  changed_by: string | null;
  created_at: string | null;
}

export interface LeadMatch {
  id: number;
  match_score: number;
  status: string;
  reasons: string[];
  bank_name: string | null;
  product_name: string | null;
  interest_rate: number | null;
}

export interface LeadDetail {
  lead: Lead;
  status_history: LeadStatusHistoryEntry[];
  matches: LeadMatch[];
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

export interface LeadFilters {
  search?: string;
  status?: string;
  loan_type?: string;
  city?: string;
  state?: string;
  min_amount?: number | string;
  max_amount?: number | string;
  page?: number;
  per_page?: number;
}

export interface LeadPayload {
  applicant_name: string;
  applicant_email?: string | null;
  applicant_phone: string;
  loan_type: string;
  loan_amount: number;
  tenure_months?: number | null;
  monthly_income?: number | null;
  credit_score?: number | null;
  employment_type?: string | null;
  city: string;
  state: string;
  pincode?: string | null;
  notes?: string | null;
}

export interface CatalogueOption {
  value: string;
  label: string;
  is_terminal?: boolean;
  colour?: string;
}

export interface LeadMetadata {
  statuses: CatalogueOption[];
  loan_types: CatalogueOption[];
  employment_types: CatalogueOption[];
}

export interface MatchingResult {
  lead_id: number;
  evaluated: number;
  matched: number;
  matches: Array<{
    bank_criteria_id: number;
    bank_name: string;
    product_name: string;
    interest_rate: number | null;
    score: number;
    reasons: string[];
  }>;
  rejected: Array<{
    bank_name: string;
    product_name: string;
    reasons: string[];
  }>;
}
