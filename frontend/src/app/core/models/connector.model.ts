import { AuthenticatedUser } from './user.model';

/** Connector-specific profile data (users table holds the identity). */
export interface ConnectorProfile {
  id: number;
  user: AuthenticatedUser;
  company_name: string | null;
  contact_person: string | null;
  alternate_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  pan_number: string | null;
  gst_number: string | null;
  referral_code: string;
  referred_by: { id: number; name: string; email: string } | null;
  commission_rate: number | null;
  status: string;
  status_label: string | null;
  status_colour: string | null;
  phone_verified_at: string | null;
  joined_at: string | null;
  payout_method: string | null;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_ifsc_or_upi: string | null;
  /**
   * Only populated by the Super Admin list endpoint
   * (GET super-admin/connectors) — null on every other path.
   */
  referral_count: number | null;
  converted_count: number | null;
  commission_accrued: number | null;
  commission_paid: number | null;
  network_size: number | null;
  updated_at: string | null;
}

export interface UpdateConnectorProfilePayload {
  name?: string;
  phone?: string | null;
  company_name?: string | null;
  contact_person?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  pan_number?: string | null;
  gst_number?: string | null;
  payout_method?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_ifsc_or_upi?: string | null;
}

export interface ConnectorDashboard {
  welcome: {
    headline: string;
    message: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    member_since: string | null;
  };
  role: {
    value: string;
    label: string;
    independent: boolean;
    description: string;
  };
  account_status: {
    is_active: boolean;
    status: string;
    profile_complete: boolean;
  };
  stats: {
    leads_submitted: number;
    approved_leads: number;
    in_progress_leads: number;
  };
  referral: {
    code: string;
    link: string;
    direct_referrals: number;
  };
  network_totals: {
    referral_count: number;
    converted_count: number;
    commission_accrued: number;
    commission_paid: number;
    pending_payout: number;
  };
}

/** One direct referral in this connector's network. */
export interface ConnectorNetworkMember {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
  };
  referral_code: string;
  status: string;
  status_label: string;
  status_colour: string;
  joined_at: string | null;
}

export interface ConnectorCommission {
  id: number;
  loan_lead: {
    id: number;
    reference: string;
    applicant_name: string;
  } | null;
  /** 0 = this connector's own lead; 1+ = a referral-override on a descendant's earning. */
  level: number;
  source_connector: { id: number; name: string; email: string } | null;
  commission_rate: number;
  commission_amount: number;
  status: string;
  status_label: string;
  status_colour: string;
  accrued_at: string | null;
  paid_at: string | null;
}

export interface ConnectorPayout {
  id: number;
  reference: string;
  connector: { id: number; name: string; email: string } | null;
  amount: number;
  method: string;
  status: string;
  status_label: string;
  status_colour: string;
  failure_reason: string | null;
  requested_at: string | null;
  processed_at: string | null;
  processed_by: { id: number; name: string; email: string } | null;
  created_at: string | null;
}

export interface ConnectorListFilters {
  status?: string;
  page?: number;
  per_page?: number;
}
