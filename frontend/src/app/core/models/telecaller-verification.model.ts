/** Counts of everything customers have submitted that a telecaller still has to check. */
export interface VerificationSummary {
  new_inquiries: number;
  documents: number;
  kyc: number;
  bank_accounts: number;
  messages: number;
}

export interface DeskCustomer {
  name: string;
  phone: string | null;
}

/** A document uploaded on an application, waiting to be verified. */
export interface DeskDocument {
  id: number;
  type: string;
  file_name: string;
  size_bytes: number;
  uploaded_at: string | null;
  lead: { id: number; reference: string; applicant_name: string; applicant_phone: string | null };
}

/** A KYC document saved on a customer's profile. */
export interface DeskKyc {
  id: number;
  type: string;
  label: string;
  file_name: string;
  reference: string | null;
  uploaded_at: string | null;
  customer: DeskCustomer;
}

export interface DeskBank {
  id: number;
  holder_name: string;
  bank_name: string;
  account_masked: string;
  ifsc: string;
  added_at: string | null;
  customer: DeskCustomer;
}

/** A message sent from the website contact page. */
export interface DeskMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  received_at: string | null;
}

export type DeskTab = 'documents' | 'kyc' | 'bank-accounts' | 'messages';
