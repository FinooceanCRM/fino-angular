/** The Super Admin module's "Commissions" interface group. */

export interface ConnectorCommissionRow {
  id: number;
  connector_id: number;
  connector_name: string;
  lead_reference: string;
  applicant_name: string;
  loan_type: string;
  loan_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'accrued' | 'paid' | 'pending';
  earned_at: string;
  paid_at: string | null;
}

export interface Affiliate {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  tier: 'Bronze' | 'Silver' | 'Gold';
  referrals: number;
  conversions: number;
  commission_rate: number;
  commission_earned: number;
  commission_paid: number;
  status: 'active' | 'inactive';
  joined_at: string;
}

export interface Payout {
  id: number;
  reference: string;
  payee_name: string;
  payee_type: 'connector' | 'affiliate';
  amount: number;
  method: 'Bank Transfer' | 'UPI';
  status: 'pending' | 'processing' | 'paid' | 'failed';
  requested_at: string;
  paid_at: string | null;
}

export type LedgerEntryType =
  | 'disbursement'
  | 'connector_commission_accrued'
  | 'connector_commission_paid'
  | 'affiliate_commission_accrued'
  | 'affiliate_commission_paid';

export interface LedgerEntry {
  id: number;
  date: string;
  type: LedgerEntryType;
  description: string;
  debit: number | null;
  credit: number | null;
}

export const LEDGER_TYPE_LABEL: Record<LedgerEntryType, string> = {
  disbursement: 'Disbursement',
  connector_commission_accrued: 'Connector commission accrued',
  connector_commission_paid: 'Connector commission paid',
  affiliate_commission_accrued: 'Affiliate commission accrued',
  affiliate_commission_paid: 'Affiliate commission paid',
};
