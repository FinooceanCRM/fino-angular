/** Public-website loan product (GET /public/loan-products). */
export interface LoanProduct {
  slug: string;
  name: string;
  loan_type: string;
  icon: string;
  tagline: string;
  summary: string;
  highlights: string[];
  documents: string[];
  eligibility_notes: string[];
}

export type EmploymentType = 'salaried' | 'self_employed' | 'business' | 'professional' | 'other';

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'business', label: 'Business owner' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
];

export interface EligibilityPayload {
  product?: string;
  loan_type?: string;
  loan_amount: number;
  tenure_months?: number | null;
  monthly_income?: number | null;
  existing_emi?: number | null;
  employment_type?: EmploymentType | null;
}

export type EligibilityBand = 'likely' | 'possible' | 'needs_review';

/** Indicative result only — never a lending decision. */
export interface EligibilityResult {
  band: EligibilityBand;
  headline: string;
  estimated_emi: number;
  indicative_max_amount: number;
  tenure_months: number;
  reasons: string[];
  missing: string[];
  assumptions: string[];
  next_step: string;
  disclaimer: string;
}

export interface InquiryPayload extends EligibilityPayload {
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string | null;
  city: string;
  consent: boolean;
  idempotency_key: string;
  captcha_token?: string;
  /** Honeypot — must stay empty. */
  website: string;
}

export interface InquiryReceipt {
  reference: string | null;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  consent: boolean;
  /** Honeypot - must stay empty. */
  website: string;
}
