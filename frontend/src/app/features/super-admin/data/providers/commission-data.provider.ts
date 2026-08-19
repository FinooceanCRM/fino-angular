import { Injectable, signal } from '@angular/core';

import { Affiliate, ConnectorCommissionRow, LedgerEntry, Payout } from '../models/commission.model';

/** Same six connectors seeded in the Users provider (ids 19–24). */
const CONNECTORS = [
  { id: 19, name: 'Suresh Patil' },
  { id: 20, name: 'Zoya Ahmed' },
  { id: 21, name: 'Ganesh Rao' },
  { id: 22, name: 'Lakshmi Iyer' },
  { id: 23, name: 'Imran Sheikh' },
  { id: 24, name: 'Nisha Gupta' },
];

const COMMISSION_RATE = 0.01; // 1% of disbursed loan amount, flat — mirrors the Matching Engine settings default.

interface ConnectorSeed {
  connectorIndex: number;
  reference: string;
  applicant: string;
  loanType: string;
  amount: number;
  status: 'accrued' | 'paid' | 'pending';
  daysAgo: number;
  paidDaysAgo?: number;
}

const CONNECTOR_SEEDS: ConnectorSeed[] = [
  { connectorIndex: 0, reference: 'LD-2406100412', applicant: 'Rahul Bhandari', loanType: 'home', amount: 4200000, status: 'paid', daysAgo: 70, paidDaysAgo: 55 },
  { connectorIndex: 0, reference: 'LD-2407100488', applicant: 'Sanjana Iyer', loanType: 'personal', amount: 480000, status: 'paid', daysAgo: 50, paidDaysAgo: 40 },
  { connectorIndex: 0, reference: 'LD-2408001001', applicant: 'Aditya Rao', loanType: 'home', amount: 4200000, status: 'accrued', daysAgo: 30 },
  { connectorIndex: 1, reference: 'LD-2406100455', applicant: 'Wasim Akram', loanType: 'business', amount: 3600000, status: 'paid', daysAgo: 65, paidDaysAgo: 50 },
  { connectorIndex: 1, reference: 'LD-2407100512', applicant: 'Divya Rangan', loanType: 'auto', amount: 820000, status: 'paid', daysAgo: 42, paidDaysAgo: 30 },
  { connectorIndex: 1, reference: 'LD-2408001003', applicant: 'Karthik Iyer', loanType: 'business', amount: 3200000, status: 'pending', daysAgo: 2 },
  { connectorIndex: 2, reference: 'LD-2405100322', applicant: 'Meenal Kulkarni', loanType: 'auto', amount: 700000, status: 'paid', daysAgo: 95, paidDaysAgo: 80 },
  { connectorIndex: 2, reference: 'LD-2406100390', applicant: 'Firoz Khan', loanType: 'personal', amount: 350000, status: 'paid', daysAgo: 80, paidDaysAgo: 68 },
  { connectorIndex: 3, reference: 'LD-2407100540', applicant: 'Geeta Nambiar', loanType: 'home', amount: 5100000, status: 'accrued', daysAgo: 22 },
  { connectorIndex: 3, reference: 'LD-2406100470', applicant: 'Anil Kapoor', loanType: 'loan_against_property', amount: 6800000, status: 'paid', daysAgo: 60, paidDaysAgo: 48 },
  { connectorIndex: 4, reference: 'LD-2407100566', applicant: 'Reshma Pillai', loanType: 'education', amount: 950000, status: 'paid', daysAgo: 48, paidDaysAgo: 35 },
  { connectorIndex: 4, reference: 'LD-2408001017', applicant: 'Harshad Patel', loanType: 'auto', amount: 650000, status: 'pending', daysAgo: 5 },
  { connectorIndex: 5, reference: 'LD-2406100501', applicant: 'Pallavi Shenoy', loanType: 'business', amount: 2900000, status: 'paid', daysAgo: 58, paidDaysAgo: 44 },
  { connectorIndex: 5, reference: 'LD-2407100588', applicant: 'Kunal Bose', loanType: 'personal', amount: 420000, status: 'paid', daysAgo: 38, paidDaysAgo: 25 },
  { connectorIndex: 5, reference: 'LD-2408001028', applicant: 'Radhika Iyer', loanType: 'business', amount: 3700000, status: 'accrued', daysAgo: 12 },
];

function daysAgoIso(days: number): string {
  const reference = new Date('2026-08-15T10:00:00+05:30');
  reference.setDate(reference.getDate() - days);
  return reference.toISOString();
}

const SEED_CONNECTOR_COMMISSIONS: ConnectorCommissionRow[] = CONNECTOR_SEEDS.map((seed, index) => {
  const connector = CONNECTORS[seed.connectorIndex];
  const commissionAmount = Math.round(seed.amount * COMMISSION_RATE);

  return {
    id: index + 1,
    connector_id: connector.id,
    connector_name: connector.name,
    lead_reference: seed.reference,
    applicant_name: seed.applicant,
    loan_type: seed.loanType,
    loan_amount: seed.amount,
    commission_rate: COMMISSION_RATE * 100,
    commission_amount: commissionAmount,
    status: seed.status,
    earned_at: daysAgoIso(seed.daysAgo),
    paid_at: seed.paidDaysAgo !== undefined ? daysAgoIso(seed.paidDaysAgo) : null,
  };
});

const SEED_AFFILIATES: Affiliate[] = [
  { id: 1, name: 'Growth Partners Media', email: 'partnerships@growthpartners.io', referral_code: 'GROWTH25', tier: 'Gold', referrals: 340, conversions: 58, commission_rate: 2.5, commission_earned: 186500, commission_paid: 150000, status: 'active', joined_at: '2025-09-12T09:00:00+05:30' },
  { id: 2, name: 'LoanBuddy Blog', email: 'hello@loanbuddy.in', referral_code: 'LOANBUDDY', tier: 'Silver', referrals: 210, conversions: 29, commission_rate: 2.0, commission_earned: 94200, commission_paid: 94200, status: 'active', joined_at: '2025-10-03T09:00:00+05:30' },
  { id: 3, name: 'FinTips Weekly', email: 'ads@fintipsweekly.com', referral_code: 'FINTIPS', tier: 'Silver', referrals: 175, conversions: 22, commission_rate: 2.0, commission_earned: 71800, commission_paid: 60000, status: 'active', joined_at: '2025-11-20T09:00:00+05:30' },
  { id: 4, name: 'Rohan Mehta (Creator)', email: 'rohan.creates@gmail.com', referral_code: 'ROHANM', tier: 'Bronze', referrals: 96, conversions: 11, commission_rate: 1.5, commission_earned: 28400, commission_paid: 28400, status: 'active', joined_at: '2025-12-05T09:00:00+05:30' },
  { id: 5, name: 'CreditScore Guide', email: 'team@creditscoreguide.in', referral_code: 'CSGUIDE', tier: 'Gold', referrals: 288, conversions: 45, commission_rate: 2.5, commission_earned: 152000, commission_paid: 120000, status: 'active', joined_at: '2026-01-08T09:00:00+05:30' },
  { id: 6, name: 'Priya Suresh (Creator)', email: 'priya.suresh.finance@gmail.com', referral_code: 'PRIYAS', tier: 'Bronze', referrals: 54, conversions: 6, commission_rate: 1.5, commission_earned: 14200, commission_paid: 0, status: 'active', joined_at: '2026-03-02T09:00:00+05:30' },
  { id: 7, name: 'MoneyMatters Forum', email: 'admin@moneymattersforum.com', referral_code: 'MMFORUM', tier: 'Silver', referrals: 132, conversions: 15, commission_rate: 2.0, commission_earned: 48600, commission_paid: 48600, status: 'inactive', joined_at: '2025-08-14T09:00:00+05:30' },
  { id: 8, name: 'Aarav Desai (Creator)', email: 'aarav.desai.money@gmail.com', referral_code: 'AARAVD', tier: 'Bronze', referrals: 40, conversions: 4, commission_rate: 1.5, commission_earned: 9800, commission_paid: 0, status: 'active', joined_at: '2026-05-18T09:00:00+05:30' },
];

const SEED_PAYOUTS: Payout[] = [
  { id: 1, reference: 'PO-2026-1001', payee_name: 'Suresh Patil', payee_type: 'connector', amount: 42000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(56), paid_at: daysAgoIso(55) },
  { id: 2, reference: 'PO-2026-1002', payee_name: 'Suresh Patil', payee_type: 'connector', amount: 4800, method: 'UPI', status: 'paid', requested_at: daysAgoIso(41), paid_at: daysAgoIso(40) },
  { id: 3, reference: 'PO-2026-1003', payee_name: 'Zoya Ahmed', payee_type: 'connector', amount: 36000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(51), paid_at: daysAgoIso(50) },
  { id: 4, reference: 'PO-2026-1004', payee_name: 'Zoya Ahmed', payee_type: 'connector', amount: 8200, method: 'UPI', status: 'paid', requested_at: daysAgoIso(31), paid_at: daysAgoIso(30) },
  { id: 5, reference: 'PO-2026-1005', payee_name: 'Ganesh Rao', payee_type: 'connector', amount: 7000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(81), paid_at: daysAgoIso(80) },
  { id: 6, reference: 'PO-2026-1006', payee_name: 'Ganesh Rao', payee_type: 'connector', amount: 3500, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(69), paid_at: daysAgoIso(68) },
  { id: 7, reference: 'PO-2026-1007', payee_name: 'Lakshmi Iyer', payee_type: 'connector', amount: 68000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(49), paid_at: daysAgoIso(48) },
  { id: 8, reference: 'PO-2026-1008', payee_name: 'Imran Sheikh', payee_type: 'connector', amount: 9500, method: 'UPI', status: 'paid', requested_at: daysAgoIso(36), paid_at: daysAgoIso(35) },
  { id: 9, reference: 'PO-2026-1009', payee_name: 'Nisha Gupta', payee_type: 'connector', amount: 29000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(45), paid_at: daysAgoIso(44) },
  { id: 10, reference: 'PO-2026-1010', payee_name: 'Nisha Gupta', payee_type: 'connector', amount: 4200, method: 'UPI', status: 'paid', requested_at: daysAgoIso(26), paid_at: daysAgoIso(25) },
  { id: 11, reference: 'PO-2026-1011', payee_name: 'Growth Partners Media', payee_type: 'affiliate', amount: 150000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(20), paid_at: daysAgoIso(18) },
  { id: 12, reference: 'PO-2026-1012', payee_name: 'LoanBuddy Blog', payee_type: 'affiliate', amount: 94200, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(15), paid_at: daysAgoIso(13) },
  { id: 13, reference: 'PO-2026-1013', payee_name: 'FinTips Weekly', payee_type: 'affiliate', amount: 60000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(28), paid_at: daysAgoIso(26) },
  { id: 14, reference: 'PO-2026-1014', payee_name: 'Rohan Mehta (Creator)', payee_type: 'affiliate', amount: 28400, method: 'UPI', status: 'paid', requested_at: daysAgoIso(33), paid_at: daysAgoIso(31) },
  { id: 15, reference: 'PO-2026-1015', payee_name: 'CreditScore Guide', payee_type: 'affiliate', amount: 120000, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(19), paid_at: daysAgoIso(17) },
  { id: 16, reference: 'PO-2026-1016', payee_name: 'MoneyMatters Forum', payee_type: 'affiliate', amount: 48600, method: 'Bank Transfer', status: 'paid', requested_at: daysAgoIso(60), paid_at: daysAgoIso(58) },
  { id: 17, reference: 'PO-2026-1017', payee_name: 'CreditScore Guide', payee_type: 'affiliate', amount: 32000, method: 'Bank Transfer', status: 'processing', requested_at: daysAgoIso(3), paid_at: null },
  { id: 18, reference: 'PO-2026-1018', payee_name: 'Suresh Patil', payee_type: 'connector', amount: 42000, method: 'Bank Transfer', status: 'pending', requested_at: daysAgoIso(1), paid_at: null },
  { id: 19, reference: 'PO-2026-1019', payee_name: 'Nisha Gupta', payee_type: 'connector', amount: 37000, method: 'Bank Transfer', status: 'pending', requested_at: daysAgoIso(1), paid_at: null },
  { id: 20, reference: 'PO-2026-1020', payee_name: 'Growth Partners Media', payee_type: 'affiliate', amount: 36500, method: 'Bank Transfer', status: 'failed', requested_at: daysAgoIso(9), paid_at: null },
];

const SEED_LEDGER: LedgerEntry[] = [
  { id: 1, date: daysAgoIso(80), type: 'disbursement', description: 'Loan disbursed — LD-2405100322 (Meenal Kulkarni)', debit: 700000, credit: null },
  { id: 2, date: daysAgoIso(80), type: 'connector_commission_accrued', description: 'Commission accrued — Ganesh Rao', debit: null, credit: 7000 },
  { id: 3, date: daysAgoIso(80), type: 'connector_commission_paid', description: 'Payout PO-2026-1005 — Ganesh Rao', debit: 7000, credit: null },
  { id: 4, date: daysAgoIso(70), type: 'disbursement', description: 'Loan disbursed — LD-2406100412 (Rahul Bhandari)', debit: 4200000, credit: null },
  { id: 5, date: daysAgoIso(70), type: 'connector_commission_accrued', description: 'Commission accrued — Suresh Patil', debit: null, credit: 42000 },
  { id: 6, date: daysAgoIso(69), type: 'disbursement', description: 'Loan disbursed — LD-2406100390 (Firoz Khan)', debit: 350000, credit: null },
  { id: 7, date: daysAgoIso(68), type: 'connector_commission_paid', description: 'Payout PO-2026-1006 — Ganesh Rao', debit: 3500, credit: null },
  { id: 8, date: daysAgoIso(65), type: 'disbursement', description: 'Loan disbursed — LD-2406100455 (Wasim Akram)', debit: 3600000, credit: null },
  { id: 9, date: daysAgoIso(60), type: 'disbursement', description: 'Loan disbursed — LD-2406100470 (Anil Kapoor)', debit: 6800000, credit: null },
  { id: 10, date: daysAgoIso(58), type: 'affiliate_commission_paid', description: 'Payout PO-2026-1016 — MoneyMatters Forum', debit: 48600, credit: null },
  { id: 11, date: daysAgoIso(55), type: 'connector_commission_paid', description: 'Payout PO-2026-1001 — Suresh Patil', debit: 42000, credit: null },
  { id: 12, date: daysAgoIso(50), type: 'connector_commission_paid', description: 'Payout PO-2026-1003 — Zoya Ahmed', debit: 36000, credit: null },
  { id: 13, date: daysAgoIso(48), type: 'disbursement', description: 'Loan disbursed — LD-2407100566 (Reshma Pillai)', debit: 950000, credit: null },
  { id: 14, date: daysAgoIso(44), type: 'connector_commission_paid', description: 'Payout PO-2026-1009 — Nisha Gupta', debit: 29000, credit: null },
  { id: 15, date: daysAgoIso(42), type: 'disbursement', description: 'Loan disbursed — LD-2407100512 (Divya Rangan)', debit: 820000, credit: null },
  { id: 16, date: daysAgoIso(30), type: 'connector_commission_paid', description: 'Payout PO-2026-1004 — Zoya Ahmed', debit: 8200, credit: null },
  { id: 17, date: daysAgoIso(22), type: 'connector_commission_accrued', description: 'Commission accrued — Lakshmi Iyer', debit: null, credit: 51000 },
  { id: 18, date: daysAgoIso(18), type: 'affiliate_commission_paid', description: 'Payout PO-2026-1011 — Growth Partners Media', debit: 150000, credit: null },
  { id: 19, date: daysAgoIso(12), type: 'connector_commission_accrued', description: 'Commission accrued — Nisha Gupta', debit: null, credit: 37000 },
  { id: 20, date: daysAgoIso(2), type: 'connector_commission_accrued', description: 'Commission accrued — Karthik Iyer’s referrer Zoya Ahmed', debit: null, credit: 32000 },
];

/**
 * Centralized state for connector commission, affiliate commission,
 * payouts and the accounting ledger. Root-provided so every Commission
 * page, every relevant report, and the Dashboard read the same live data.
 */
@Injectable({ providedIn: 'root' })
export class CommissionDataProvider {
  private readonly _connectorCommissions = signal<ConnectorCommissionRow[]>(SEED_CONNECTOR_COMMISSIONS);
  private readonly _affiliates = signal<Affiliate[]>(SEED_AFFILIATES);
  private readonly _payouts = signal<Payout[]>(SEED_PAYOUTS);
  private readonly _ledger = signal<LedgerEntry[]>(SEED_LEDGER);

  readonly connectorCommissions = this._connectorCommissions.asReadonly();
  readonly affiliates = this._affiliates.asReadonly();
  readonly payouts = this._payouts.asReadonly();
  readonly ledger = this._ledger.asReadonly();

  markPayoutPaid(id: number): void {
    const now = new Date().toISOString();
    this._payouts.update((current) =>
      current.map((payout) => (payout.id === id ? { ...payout, status: 'paid', paid_at: now } : payout)),
    );
  }
}
