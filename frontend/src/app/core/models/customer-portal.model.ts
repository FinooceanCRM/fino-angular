export type StatusTone = 'neutral' | 'info' | 'warning' | 'success';

/** Customer-facing wording for an application's state (never the internal status). */
export interface CustomerStatus {
  key: string;
  label: string;
  message: string;
  step: number;
  tone: StatusTone;
  action_required: boolean;
}

export interface CustomerApplication {
  id: number;
  reference: string;
  loan_type: string;
  loan_type_label: string;
  loan_amount: number;
  tenure_months: number | null;
  city: string | null;
  applied_on: string | null;
  updated_at: string | null;
  status: CustomerStatus;
  // Present on the detail view only.
  steps?: { key: string; label: string }[];
  documents?: CustomerRequiredDocument[];
  timeline?: { label: string; message: string; at: string | null }[];
  details?: { employment_type?: string; monthly_income?: number };
}

export type DocumentState = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface CustomerRequiredDocument {
  type: string;
  label: string;
  status: DocumentState;
  /** false for the extra documents a customer may add (address proof, property, other). */
  required?: boolean;
  document_id: number | null;
  file_name: string | null;
  remarks: string | null;
  uploaded_at: string | null;
}

export interface CustomerDocument {
  id: number;
  lead_id: number;
  reference: string | null;
  type: string;
  label: string;
  file_name: string;
  status: DocumentState;
  remarks: string | null;
  uploaded_at: string | null;
}

export interface CustomerDashboard {
  name: string;
  counts: { total: number; active: number; completed: number };
  recent_applications: CustomerApplication[];
  pending_actions: {
    lead_id: number;
    reference: string;
    message: string;
    missing_documents: string[];
  }[];
  profile_completion: { percent: number; steps: { key: string; label: string; done: boolean }[] };
  unread_notifications: number;
}

export interface CustomerNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string | null;
}

export interface ApplyPayload {
  product: string;
  loan_amount: number;
  tenure_months?: number | null;
  monthly_income?: number | null;
  existing_emi?: number | null;
  employment_type?: string | null;
  city: string;
  applicant_phone?: string | null;
  /** Pre-filled from the account; the customer may change them for this application. */
  applicant_name?: string;
  applicant_email?: string;
  /** Ticked on the review step: save what was entered back to the profile. */
  update_profile?: boolean;
  consent: boolean;
  idempotency_key: string;
  /** Token returned by a successful OTP check; marks the phone as verified on the application. */
  otp_token?: string | null;
  applicant?: { dob?: string; gender?: string; marital_status?: string; pan?: string; aadhaar?: string };
  employment?: { company?: string; designation?: string; experience_years?: number; office_address?: string };
  loan?: { purpose?: string; has_existing_loans?: boolean };
}

export interface OtpSent {
  expires_in: number;
  resend_in: number;
  /** Only present when the server runs locally / in tests (no SMS provider is wired up yet). */
  dev_code?: string;
}
