/** Loan-management domain models (Phase 9). */
import { PdDetails } from './pd.model';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
}

/** A candidate returned by `GET leads/assignable-users` — a UserSummary plus the hierarchy links needed to filter the reassignment pool (e.g. "only this RM's employees"). */
export interface AssignableUser extends UserSummary {
  relationship_manager_id: number | null;
  manager_id: number | null;
}

/**
 * Fields captured by the lead creation wizard that don't have a dedicated
 * `loan_leads` column. Persisted server-side as a single JSON blob (see the
 * `details` column) rather than one column per field, since most of these
 * only apply to a subset of applicants or loan types.
 */
export interface LeadApplicantDetails {
  gender?: string | null;
  dob?: string | null;
  alternative_phone?: string | null;
  age?: number | null;
  marital_status?: string | null;
  caste_category?: string | null;
  company_name?: string | null;
  net_salary?: number | null;
  salary_account_type?: string | null;
  purpose_of_loan?: string | null;
  gst_number?: string | null;
  insurance_type?: string | null;
  car_type?: string | null;
  mudra_loan_type?: string | null;
  landmark?: string | null;
  current_address?: string | null;
  residential_type?: string | null;
  since_resident?: string | null;
  /** Home Loan only. */
  property_type?: string | null;
  /** Mortgage Loan / LAP only. */
  lap_property_type?: string | null;
  balance_transfer_type?: string | null;
  balance_transfer_loan_amount?: number | null;
  topup_loan_amount?: number | null;
  /** Personal Loan + Salaried only. */
  type_of_salary?: string | null;
  /** Shown when type_of_salary = 'account_salary'. */
  type_of_account_salary?: string | null;
  /** Shown when employment_type = 'salaried'. */
  gross_salary?: number | null;
  /** Business Loan, or Business/Self-Employed employment. */
  min_income_turnover?: number | null;
  /** Home Loan only. */
  home_loan_purpose?: string | null;
  /** Home Loan only. */
  construction_status?: string | null;
  /** Mortgage Loan / LAP only. */
  collateral_available?: string | null;
  /** Shown when collateral_available = 'yes'. */
  collateral_type?: string | null;
  collateral_market_value?: number | null;
  /** Home Loan or Mortgage Loan/LAP. */
  home_loan_checklist?: string[] | null;
  /** Home Loan or Mortgage Loan/LAP. */
  ownership_documents?: string[] | null;
}

export interface CatalogueOption {
  value: string;
  label: string;
  is_terminal?: boolean;
  colour?: string;
}

/**
 * Static option catalogues for the `LeadApplicantDetails` fields — shared
 * between the lead creation wizard (dropdown source) and every lead-detail
 * view (value -> label lookup for display), so the two never drift apart.
 */
export const GENDER_OPTIONS: CatalogueOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const MARITAL_STATUS_OPTIONS: CatalogueOption[] = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

export const CASTE_CATEGORY_OPTIONS: CatalogueOption[] = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'other', label: 'Other' },
];

export const SALARY_ACCOUNT_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'savings', label: 'Savings account' },
  { value: 'current', label: 'Current account' },
  { value: 'neft', label: 'NEFT' },
  { value: 'imps', label: 'IMPS' },
  { value: 'cheque', label: 'Cheque' },
];

export const PURPOSE_OF_LOAN_OPTIONS: CatalogueOption[] = [
  { value: 'debt_consolidation', label: 'Debt consolidation' },
  { value: 'medical_emergency', label: 'Medical emergency' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'travel', label: 'Travel' },
  { value: 'home_renovation', label: 'Home renovation' },
  { value: 'vehicle_purchase', label: 'Vehicle purchase' },
  { value: 'business_mudra', label: 'Business / Mudra loan' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export const RESIDENTIAL_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'rented', label: 'Rented' },
  { value: 'parental', label: 'Parental' },
  { value: 'company_provided', label: 'Company provided' },
  { value: 'other', label: 'Other' },
];

export const PROPERTY_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'new_purchase', label: 'New purchase' },
  { value: 'resale', label: 'Resale' },
  { value: 'under_construction', label: 'Under construction' },
  { value: 'plot_purchase', label: 'Plot purchase' },
  { value: 'construction', label: 'Construction' },
  { value: 'extension', label: 'Extension' },
];

export const LAP_PROPERTY_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'residential', label: 'Residential property' },
  { value: 'commercial', label: 'Commercial property' },
  { value: 'semi_commercial', label: 'Semi-commercial property' },
  { value: 'under_construction', label: 'Under construction' },
];

export const BALANCE_TRANSFER_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'none', label: 'Not applicable' },
  { value: 'home_loan', label: 'Home loan BT' },
  { value: 'lap', label: 'LAP BT' },
  { value: 'personal_loan', label: 'Personal loan BT' },
  { value: 'business_loan', label: 'Business loan BT' },
];

export const INSURANCE_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'none', label: 'None' },
  { value: 'life', label: 'Life insurance' },
  { value: 'health', label: 'Health insurance' },
  { value: 'property', label: 'Property insurance' },
];

export const CAR_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'new_car', label: 'New Car' },
  { value: 'used_car', label: 'Resale Car' },
];

export const TYPE_OF_SALARY_OPTIONS: CatalogueOption[] = [
  { value: 'account_salary', label: 'Account Salary' },
  { value: 'cash_salary', label: 'Cash Salary' },
];

export const TYPE_OF_ACCOUNT_SALARY_OPTIONS: CatalogueOption[] = [
  { value: 'neft_rtgs', label: 'NEFT/RTGS' },
  { value: 'upi_transfer', label: 'UPI Transfer' },
  { value: 'cheque', label: 'Cheque' },
];

export const HOME_LOAN_PURPOSE_OPTIONS: CatalogueOption[] = [
  { value: 'home_purchase', label: 'Home Purchase' },
  { value: 'home_construction', label: 'Home Construction' },
  { value: 'home_improvement_extension', label: 'Home Improvement / Extension' },
  { value: 'home_loan_balance_transfer', label: 'Home Loan Balance Transfer' },
];

export const CONSTRUCTION_STATUS_OPTIONS: CatalogueOption[] = [
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'not_yet_started', label: 'Not Yet Started' },
];

export const COLLATERAL_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'residential_property', label: 'Residential Property' },
  { value: 'commercial_property', label: 'Commercial Property' },
  { value: 'fd_insurance_policy', label: 'Fixed Deposit / Insurance Policy' },
  { value: 'other', label: 'Other' },
];

export const HOME_LOAN_CHECKLIST_OPTIONS: CatalogueOption[] = [
  { value: 'agreement_to_sale', label: 'Agreement to Sale' },
  { value: 'lay_out_map', label: 'Lay-Out Map' },
  { value: 'noc', label: 'NOC' },
  { value: 'r_l_letter', label: 'R L Letter' },
  { value: 'tp_order', label: 'TP Order' },
  { value: 'previous_sale_deed', label: 'Previous Sale Deed' },
  { value: 'building_plan', label: 'Building Plan' },
  { value: 'tax_receipts', label: 'Tax Receipts' },
  { value: 'na_order', label: 'NA Order' },
  { value: 'construction_estimate', label: 'Construction Estimate' },
  { value: 'akhiv_patrika', label: 'Akhiv Patrika' },
  { value: '6a_copy', label: '6A Copy' },
];

export const OWNERSHIP_DOCUMENT_OPTIONS: CatalogueOption[] = [
  { value: '7_12_copy', label: '7/12 Copy' },
  { value: '8a_copy', label: '8A Copy' },
];

export const MUDRA_LOAN_TYPE_OPTIONS: CatalogueOption[] = [
  { value: 'shishu', label: 'Shishu (up to ₹50,000)' },
  { value: 'kishor', label: 'Kishor (₹50,000 – ₹5 lakh)' },
  { value: 'tarun', label: 'Tarun (₹5 lakh – ₹10 lakh)' },
];

/** Looks up a catalogue option's display label, falling back to the raw value for anything unmapped. */
export function labelFromOptions(options: readonly CatalogueOption[], value: string | null | undefined): string {
  if (!value) return '—';
  return options.find((option) => option.value === value)?.label ?? value;
}

export interface Lead {
  id: number;
  reference: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  loan_type: string;
  department: string;
  department_label: string;
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
  details: LeadApplicantDetails | null;
  connector: UserSummary | null;
  assigned_employee: UserSummary | null;
  assigned_relationship_manager: UserSummary | null;
  assigned_manager: UserSummary | null;
  assigned_banker: UserSummary | null;
  assigned_telecaller: UserSummary | null;
  created_by: UserSummary | null;
  updated_by: UserSummary | null;
  pd_completed_at: string | null;
  pd_completed_by: UserSummary | null;
  /** The full Full-PD dataset, once submitted (mirrors `GET leads/:id/pd`'s `pd_details`, exposed here too so the overview page can render a summary without a second request). */
  pd_details: PdDetails | null;
  created_at: string | null;
  updated_at: string | null;
  /** Always true for every role except Banker; for a Banker, whether an approved access request grants them contact/document/update rights on this lead. */
  full_access: boolean;
  /** Banker actor only — the best match score (0-100) against their own bank criteria, or null. */
  match_score: number | null;
  /** Whether the current actor may change this lead's status right now — mirrors LoanLeadPolicy::changeStatus(). False for an assigned Employee once the lead has been reassigned. */
  can_change_status: boolean;
  /** Whether the current actor may assign/reassign this lead — mirrors LoanLeadPolicy::assign(). */
  can_assign: boolean;
  /** Whether the current actor may complete the Full PD workflow — mirrors LoanLeadPolicy::submitPd() (Super Admin, Manager, Telecaller; false once pd_completed_at is set). */
  can_submit_pd: boolean;
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

export interface LeadAssignmentHistoryEntry {
  id: number;
  assignee: UserSummary | null;
  assigned_by: UserSummary | null;
  remarks: string | null;
  created_at: string | null;
}

export interface LeadDetail {
  lead: Lead;
  status_history: LeadStatusHistoryEntry[];
  assignment_history: LeadAssignmentHistoryEntry[];
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
  assigned_employee_id?: number | string;
  assigned_relationship_manager_id?: number | string;
  assigned_banker_id?: number | string;
  connector_id?: number | string;
  created_by?: number | string;
  min_amount?: number | string;
  max_amount?: number | string;
  created_from?: string;
  created_to?: string;
  /** Banker workspace only — which of the four lead buckets to return. */
  banker_bucket?: 'matched' | 'priority' | 'assigned' | 'submitted';
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
  details?: LeadApplicantDetails | null;
}

export interface LeadMetadata {
  statuses: CatalogueOption[];
  loan_types: CatalogueOption[];
  departments: CatalogueOption[];
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
