import { EligibilityBand, EligibilityResult } from './website.model';

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'interested'
  | 'not_reachable'
  | 'not_interested'
  | 'assigned'
  | 'converted';

export interface NamedRef {
  id: number;
  name: string;
}

/** Set only on leads that came from an offer (popup or landing page). */
export interface InquiryOffer {
  id: number | null;
  /** 'callback' = the small call-me-back popup (no offer). */
  kind?: 'offer' | 'callback';
  name: string | null;
  type: string | null;
  interested_service: string | null;
  message: string | null;
  account_status: 'guest' | 'registered';
  marketing_consent: boolean;
  visitor_id: string | null;
}

export interface Inquiry {
  id: number;
  reference: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  loan_type: string;
  loan_type_label: string | null;
  product_name: string | null;
  department: string | null;
  loan_amount: number;
  tenure_months: number | null;
  city: string | null;
  source: string;
  source_label: string | null;
  inquiry_status: InquiryStatus;
  inquiry_status_label: string | null;
  lead_status: string;
  lead_status_label: string;
  eligibility_band: EligibilityBand | null;
  eligibility_headline: string | null;
  has_account: boolean;
  offer?: InquiryOffer | null;
  resubmission_count: number;
  assigned_telecaller?: NamedRef | null;
  assigned_manager?: NamedRef | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  created_at: string | null;
}

export interface InquiryActivity {
  id: number;
  type: 'note' | 'contact' | 'status' | 'assignment' | 'resubmission' | 'created';
  body: string | null;
  meta: Record<string, unknown> | null;
  user: NamedRef | null;
  created_at: string | null;
}

export interface InquiryAssignment {
  id: number;
  assignee: NamedRef | null;
  assigned_by: NamedRef | null;
  status: string;
  remarks: string | null;
  assigned_at: string | null;
  released_at: string | null;
}

export interface InquiryDetail extends Inquiry {
  monthly_income: number | null;
  employment_type: string | null;
  existing_emi: number | null;
  eligibility: EligibilityResult | null;
  consent_at: string | null;
  activities: InquiryActivity[];
  assignments: InquiryAssignment[];
  possible_duplicates: {
    id: number;
    reference: string;
    loan_type: string;
    status: string;
    source: string;
    created_at: string | null;
  }[];
}

export interface InquiryFilters {
  search?: string;
  loan_type?: string;
  inquiry_status?: string;
  source?: string;
  offer_id?: number | string;
  assignment?: '' | 'assigned' | 'unassigned';
  date_from?: string;
  date_to?: string;
  mine?: boolean;
  follow_up_due?: boolean;
  sort?: string;
  dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface InquiryMeta {
  statuses: { value: InquiryStatus; label: string }[];
  sources: { value: string; label: string }[];
  loan_types: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  offers?: { id: number; name: string }[];
}

export interface InquiryStats {
  total: number;
  by_status: Record<string, number>;
  unassigned: number;
  follow_ups_due: number;
  mine: number;
}

export interface AssignableManager {
  id: number;
  name: string;
  email: string;
  open_leads: number;
  matches_rule: boolean;
}

export interface RoutingRule {
  id: number;
  department: string;
  department_label: string | null;
  manager: { id: number; name: string; email: string } | null;
  is_active: boolean;
}
