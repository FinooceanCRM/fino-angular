/** The Super Admin module's "Commissions" interface group. */

import { AffiliateProfile } from '@core/models/affiliate.model';
import { ConnectorProfile } from '@core/models/connector.model';

/**
 * Backed by the real AffiliateResource (GET super-admin/affiliates) —
 * see core/models/affiliate.model.ts. No `tier` field: v1 has no tiers
 * (locked decision), so there's nothing to alias here.
 */
export type Affiliate = AffiliateProfile;

/**
 * Backed by the real ConnectorProfileResource (GET super-admin/connectors)
 * — see core/models/connector.model.ts. One row per connector, aggregated
 * (referral_count/commission_accrued/etc.), same shape as `Affiliate` —
 * there is no per-lead-per-level commission ledger endpoint, mirroring how
 * Affiliate Commission already works.
 */
export type Connector = ConnectorProfile;

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
