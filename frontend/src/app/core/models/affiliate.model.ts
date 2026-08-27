import { PaginationMeta } from './lead.model';
import { AuthenticatedUser } from './user.model';

/** Affiliate-specific profile data (users table holds the identity). */
export interface AffiliateProfile {
  id: number;
  user: AuthenticatedUser;
  referral_code: string;
  commission_rate: number | null;
  status: string;
  status_label: string;
  status_colour: string;
  email_verified_at: string | null;
  alternate_phone: string | null;
  payout_method: string | null;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_ifsc_or_upi: string | null;
  joined_at: string | null;
  updated_at: string | null;
  /**
   * Only populated by the Super Admin list endpoint
   * (GET super-admin/affiliates) — null on every other path (self-service
   * profile), where these aggregates aren't computed.
   */
  referral_count: number | null;
  converted_count: number | null;
  commission_accrued: number | null;
  commission_paid: number | null;
}

export interface UpdateAffiliateProfilePayload {
  name?: string;
  phone?: string | null;
  alternate_phone?: string | null;
  payout_method?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_ifsc_or_upi?: string | null;
}

export interface AffiliateDashboard {
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
  referral: {
    code: string;
    link: string;
  };
  totals: {
    referral_count: number;
    converted_count: number;
    commission_accrued: number;
    commission_paid: number;
    pending_payout: number;
  };
  account_status: {
    is_active: boolean;
    status: string;
    email_verified: boolean;
  };
}

/** One row of GET affiliates/referrals — a lead attributed to this affiliate. */
export interface AffiliateReferral {
  id: number;
  reference: string;
  applicant_name: string;
  loan_type: string;
  status: string;
  status_label: string;
  status_colour: string;
  created_at: string | null;
}

export interface AffiliateCommission {
  id: number;
  loan_lead: {
    id: number;
    reference: string;
    applicant_name: string;
  } | null;
  commission_rate: number;
  commission_amount: number;
  status: string;
  status_label: string;
  status_colour: string;
  accrued_at: string | null;
  paid_at: string | null;
}

export interface AffiliatePayout {
  id: number;
  reference: string;
  affiliate: {
    id: number;
    name: string;
    email: string;
  } | null;
  amount: number;
  method: string;
  status: string;
  status_label: string;
  status_colour: string;
  failure_reason: string | null;
  requested_at: string | null;
  processed_at: string | null;
  processed_by: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string | null;
}

export interface AffiliateListFilters {
  status?: string;
  page?: number;
  per_page?: number;
}
