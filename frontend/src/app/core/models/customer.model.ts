/** Customer Management domain models (Phase 3). Mirrors the backend's CustomerResource/CustomerNoteResource/CustomerInteractionResource/CustomerDocumentResource shapes. */
import { UserSummary } from './lead.model';

export type CustomerStatus = 'active' | 'prospect' | 'inactive';
export type CustomerSegment = 'Retail' | 'SME' | 'Corporate';

/** Mirrors `App\Enums\DocumentType` on the backend — same catalogue Lead documents use. */
export type DocumentType =
  | 'aadhaar'
  | 'aadhaar_front'
  | 'aadhaar_back'
  | 'pan'
  | 'pan_card'
  | 'bank_statement'
  | 'income_proof'
  | 'other'
  | 'form_16_two_years'
  | 'three_year_itr'
  | 'six_month_bank_statement'
  | 'joining_letter'
  | 'gumasta'
  | 'electricity_bill'
  | 'udyam'
  | 'salary_slip_3_months'
  | 'company_registration'
  | 'gst_certificate';

export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface DocumentTypeOption {
  value: string;
  label: string;
}

export interface LinkedLeadSummary {
  id: number;
  reference: string;
  applicant_name: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  notes: string | null;
  created_by: UserSummary | null;
  linked_leads: LinkedLeadSummary[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomerDraft {
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  notes: string | null;
}

export interface CustomerInteraction {
  id: number;
  icon: string;
  title: string;
  subtitle: string | null;
  at: string;
}

export interface CustomerNote {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

export interface CustomerDocument {
  id: number;
  customer_id: number;
  document_type: DocumentType;
  document_type_label: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  status: DocumentStatus;
  remarks: string | null;
  uploaded_by?: { id: number; name: string } | null;
  download_url: string;
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

export interface CustomerFilters {
  search?: string;
  status?: string;
  segment?: string;
  page?: number;
  per_page?: number;
}
