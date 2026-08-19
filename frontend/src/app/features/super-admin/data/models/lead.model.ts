/** The Super Admin module's "Leads" interface group. */
export type {
  Lead,
  LeadStatusHistoryEntry,
  LeadDetail,
  LeadMatch,
  MatchingResult,
  UserSummary,
  CatalogueOption,
} from '@core/models/lead.model';

import { CatalogueOption } from '@core/models/lead.model';

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
