/**
 * UI catalogue constants for the Manager (and Relationship Manager) module's
 * lead views — status/loan-type option lists, status-pill colours and
 * status-step icons. Mirrors the backend's `App\Enums\LeadStatus` /
 * `App\Enums\LoanType`; not served by an endpoint of its own since these
 * never change at runtime. Shared by the Manager and Relationship Manager
 * modules' lead-bucket pages, Reports pages and Bankers pages.
 */
export type {
  Lead,
  LeadStatusHistoryEntry,
  LeadAssignmentHistoryEntry as AssignmentHistoryEntry,
  UserSummary,
  AssignableUser,
  CatalogueOption,
} from '@core/models/lead.model';

import { CatalogueOption, UserSummary } from '@core/models/lead.model';

/** Mirrors `App\Enums\LeadStatus` on the backend — value, label and status-pill colour. */
export const LEAD_STATUS_CATALOGUE: CatalogueOption[] = [
  { value: 'new', label: 'New', colour: 'default' },
  { value: 'assigned', label: 'Assigned', colour: 'primary' },
  { value: 'in_progress', label: 'In Progress', colour: 'primary' },
  { value: 'documents_pending', label: 'Documents Pending', colour: 'accent' },
  { value: 'under_review', label: 'Under Review', colour: 'primary' },
  { value: 'approved', label: 'Approved', colour: 'success' },
  { value: 'rejected', label: 'Rejected', colour: 'warn' },
  { value: 'disbursed', label: 'Disbursed', colour: 'success' },
  { value: 'closed', label: 'Closed', colour: 'default' },
];

/** Mirrors `LeadStatus::isTerminal()` on the backend — only Closed can no longer transition. */
export const TERMINAL_LEAD_STATUSES = ['closed'];

/** Mirrors `App\Enums\LoanType` on the backend. */
export const LOAN_TYPE_CATALOGUE: CatalogueOption[] = [
  { value: 'home', label: 'Home Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'auto', label: 'Auto Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'loan_against_property', label: 'Loan Against Property' },
];

/** "Processing Leads" groups the three in-flight statuses between assignment and a final decision. */
export const PROCESSING_STATUSES = ['in_progress', 'documents_pending', 'under_review'];

export function leadStatusMeta(status: string): CatalogueOption {
  return LEAD_STATUS_CATALOGUE.find((option) => option.value === status) ?? LEAD_STATUS_CATALOGUE[0];
}

export function loanTypeLabel(value: string): string {
  return LOAN_TYPE_CATALOGUE.find((option) => option.value === value)?.label ?? value;
}

/** Icon shown against each status-history step on the Lead Details and Lead Timeline pages. */
export const STATUS_STEP_ICON: Record<string, string> = {
  new: 'add_circle',
  assigned: 'person_add',
  in_progress: 'sync',
  documents_pending: 'description',
  under_review: 'search',
  approved: 'task_alt',
  rejected: 'cancel',
  disbursed: 'paid',
  closed: 'archive',
};

/** A Relationship Manager or Employee the manager can hand a lead to. */
export interface AssignableStaff extends UserSummary {
  role_label: string;
}
