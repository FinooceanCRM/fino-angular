export interface Address {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export type KycState = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

export interface KycDocument {
  id: number;
  type: string;
  label: string;
  file_name: string;
  mime_type: string;
  status: KycState;
  remarks: string | null;
  reference: string | null;
  uploaded_at: string | null;
}

export interface KycType {
  type: string;
  label: string;
  required: boolean;
  status: KycState;
  document: KycDocument | null;
}

export interface KycSummary {
  percent: number;
  verified: number;
  uploaded: number;
  total: number;
  complete: boolean;
  stage: 'upload' | 'in_review' | 'verified';
  types: KycType[];
}

export interface ProfileView {
  name: string;
  email: string;
  phone: string | null;
  customer_id: string | null;
  dob: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  /** Optional details the loan application asks for; kept here so the form can be pre-filled. */
  pan: string | null;
  aadhaar_masked: string | null;
  employment_type: string | null;
  company: string | null;
  designation: string | null;
  experience_years: number | null;
  monthly_income: number | null;
  office_address: string | null;
  work_city: string | null;
  language: string;
  has_photo: boolean;
  current_address: Address | null;
  permanent_address: Address | null;
  permanent_same_as_current: boolean;
  kyc: KycSummary;
  deletion_requested_at: string | null;
}

/** What we already know about the customer, used to pre-fill forms. Anything unknown is null. */
export interface PrefillView {
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  marital_status: string | null;
  occupation: string | null;
  pan: string | null;
  /** The customer's own saved Aadhaar (12 digits), only ever returned to them. Null when none is saved. */
  aadhaar: string | null;
  aadhaar_last4: string | null;
  city: string | null;
  employment_type: string | null;
  company: string | null;
  designation: string | null;
  experience_years: number | null;
  office_address: string | null;
  monthly_income: number | null;
  has_saved_application: boolean;
}

export interface BankAccount {
  id: number;
  holder_name: string;
  bank_name: string;
  account_masked: string;
  ifsc: string;
  account_type: string;
  branch: string | null;
  is_primary: boolean;
  status: 'pending' | 'verified';
  added_at: string | null;
}

export interface BankForm {
  holder_name: string;
  bank_name: string;
  account_number: string;
  account_number_confirmation: string;
  ifsc: string;
  account_type: string;
  branch: string;
  confirm: boolean;
}

export interface UpiId {
  id: number;
  vpa: string;
  app: string;
  is_primary: boolean;
  status: 'unverified' | 'verified';
  added_at: string | null;
}

export type Channel = 'email' | 'sms' | 'whatsapp' | 'in_app';
export type EventKey = 'payment_reminders' | 'payment_confirmations' | 'disbursal_updates' | 'application_updates' | 'account_alerts';
export type MarketingKey = 'exclusive_offers' | 'education_tips' | 'product_updates' | 'festive_offers' | 'surveys';

export interface CommunicationPrefs {
  events: Record<EventKey, Record<Channel, boolean>>;
  marketing: Record<MarketingKey, boolean>;
  language: string;
  quiet_hours: { enabled: boolean; start: string; end: string };
}

export interface SessionRow {
  id: number;
  current: boolean;
  signed_in_at: string | null;
  last_used_at: string | null;
}
