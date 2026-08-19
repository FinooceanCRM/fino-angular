import { Injectable, signal } from '@angular/core';

import { Lead, MatchingResult } from '../models/lead.model';
import { BankCriteria } from '../models/banker.model';

const SEED_BANK_CRITERIA: BankCriteria[] = [
  { id: 1, bank_name: 'HDFC Bank', product_name: 'Home Advantage', loan_type: 'home', min_loan_amount: 1000000, max_loan_amount: 10000000, min_monthly_income: 40000, min_credit_score: 700, min_age: 21, max_age: 60, employment_type: null, interest_rate: 8.5, eligibility_rules: [], is_active: true, banker_id: 25, created_at: '2026-01-10T09:00:00+05:30', updated_at: '2026-01-10T09:00:00+05:30' },
  { id: 2, bank_name: 'HDFC Bank', product_name: 'Quick Personal', loan_type: 'personal', min_loan_amount: 100000, max_loan_amount: 1500000, min_monthly_income: 25000, min_credit_score: 680, min_age: 21, max_age: 58, employment_type: null, interest_rate: 12.0, eligibility_rules: [], is_active: true, banker_id: 25, created_at: '2026-01-10T09:05:00+05:30', updated_at: '2026-01-10T09:05:00+05:30' },
  { id: 3, bank_name: 'HDFC Bank', product_name: 'Property Line', loan_type: 'loan_against_property', min_loan_amount: 1500000, max_loan_amount: 25000000, min_monthly_income: 65000, min_credit_score: 700, min_age: 25, max_age: 60, employment_type: null, interest_rate: 9.5, eligibility_rules: [], is_active: true, banker_id: 25, created_at: '2026-01-12T09:00:00+05:30', updated_at: '2026-01-12T09:00:00+05:30' },
  { id: 4, bank_name: 'ICICI Bank', product_name: 'Home Assure', loan_type: 'home', min_loan_amount: 1500000, max_loan_amount: 15000000, min_monthly_income: 50000, min_credit_score: 720, min_age: 23, max_age: 60, employment_type: null, interest_rate: 8.2, eligibility_rules: [], is_active: true, banker_id: 26, created_at: '2026-01-14T09:00:00+05:30', updated_at: '2026-01-14T09:00:00+05:30' },
  { id: 5, bank_name: 'ICICI Bank', product_name: 'Business Edge', loan_type: 'business', min_loan_amount: 500000, max_loan_amount: 8000000, min_monthly_income: 60000, min_credit_score: 700, min_age: 25, max_age: 60, employment_type: 'self_employed', interest_rate: 11.5, eligibility_rules: [], is_active: true, banker_id: 26, created_at: '2026-01-16T09:00:00+05:30', updated_at: '2026-01-16T09:00:00+05:30' },
  { id: 6, bank_name: 'Axis Bank', product_name: 'Drive Easy', loan_type: 'auto', min_loan_amount: 200000, max_loan_amount: 2000000, min_monthly_income: 30000, min_credit_score: 680, min_age: 21, max_age: 58, employment_type: null, interest_rate: 9.5, eligibility_rules: [], is_active: false, banker_id: 27, created_at: '2026-01-18T09:00:00+05:30', updated_at: '2026-02-01T09:00:00+05:30' },
  { id: 7, bank_name: 'State Bank of India', product_name: 'SBI Griha', loan_type: 'home', min_loan_amount: 500000, max_loan_amount: 12000000, min_monthly_income: 35000, min_credit_score: 680, min_age: 21, max_age: 60, employment_type: null, interest_rate: 8.0, eligibility_rules: [], is_active: true, banker_id: 28, created_at: '2026-01-20T09:00:00+05:30', updated_at: '2026-01-20T09:00:00+05:30' },
  { id: 8, bank_name: 'State Bank of India', product_name: 'Vidya Lakshmi', loan_type: 'education', min_loan_amount: 200000, max_loan_amount: 2000000, min_monthly_income: 20000, min_credit_score: 650, min_age: 18, max_age: 35, employment_type: null, interest_rate: 9.0, eligibility_rules: [], is_active: true, banker_id: 28, created_at: '2026-01-22T09:00:00+05:30', updated_at: '2026-01-22T09:00:00+05:30' },
  { id: 9, bank_name: 'Kotak Mahindra Bank', product_name: 'Personal Flexi', loan_type: 'personal', min_loan_amount: 150000, max_loan_amount: 2000000, min_monthly_income: 35000, min_credit_score: 700, min_age: 23, max_age: 58, employment_type: null, interest_rate: 11.0, eligibility_rules: [], is_active: true, banker_id: 29, created_at: '2026-01-24T09:00:00+05:30', updated_at: '2026-01-24T09:00:00+05:30' },
  { id: 10, bank_name: 'Kotak Mahindra Bank', product_name: 'Property Power', loan_type: 'loan_against_property', min_loan_amount: 2000000, max_loan_amount: 20000000, min_monthly_income: 70000, min_credit_score: 720, min_age: 25, max_age: 60, employment_type: null, interest_rate: 9.8, eligibility_rules: [], is_active: true, banker_id: 29, created_at: '2026-01-26T09:00:00+05:30', updated_at: '2026-01-26T09:00:00+05:30' },
  { id: 11, bank_name: 'Yes Bank', product_name: 'Business Grow', loan_type: 'business', min_loan_amount: 1000000, max_loan_amount: 10000000, min_monthly_income: 55000, min_credit_score: 690, min_age: 25, max_age: 60, employment_type: 'self_employed', interest_rate: 12.5, eligibility_rules: [], is_active: true, banker_id: 30, created_at: '2026-01-28T09:00:00+05:30', updated_at: '2026-01-28T09:00:00+05:30' },
  { id: 12, bank_name: 'Yes Bank', product_name: 'Auto Select', loan_type: 'auto', min_loan_amount: 300000, max_loan_amount: 2500000, min_monthly_income: 28000, min_credit_score: 660, min_age: 21, max_age: 58, employment_type: null, interest_rate: 10.0, eligibility_rules: [], is_active: true, banker_id: 30, created_at: '2026-01-30T09:00:00+05:30', updated_at: '2026-01-30T09:00:00+05:30' },
];

export interface BankCriteriaUpsertPayload {
  bank_name: string;
  product_name: string;
  loan_type: string;
  min_loan_amount: number;
  max_loan_amount: number | null;
  min_monthly_income: number;
  min_credit_score: number | null;
  interest_rate: number | null;
  is_active: boolean;
  /** Owning banker, when the product is being created/edited from a Banker's own Bank Criteria page. Left unset (→ null) for Super Admin's platform-wide catalogue. */
  banker_id?: number | null;
}

/**
 * Centralized state for mock bank products, plus the (simplified) matching
 * engine that evaluates a lead against them. Root-provided, so Bank
 * Criteria, the Matching Engine dashboard and the Dashboard's own KPIs all
 * read the same live list.
 */
@Injectable({ providedIn: 'root' })
export class BankingDataProvider {
  private readonly _criteria = signal<BankCriteria[]>(SEED_BANK_CRITERIA);
  private nextId = 100;

  readonly criteria = this._criteria.asReadonly();

  create(payload: BankCriteriaUpsertPayload): void {
    const now = new Date().toISOString();
    this._criteria.update((current) => [
      {
        id: this.nextId++,
        bank_name: payload.bank_name,
        product_name: payload.product_name,
        loan_type: payload.loan_type,
        min_loan_amount: payload.min_loan_amount,
        max_loan_amount: payload.max_loan_amount,
        min_monthly_income: payload.min_monthly_income,
        min_credit_score: payload.min_credit_score,
        min_age: null,
        max_age: null,
        employment_type: null,
        interest_rate: payload.interest_rate,
        eligibility_rules: [],
        is_active: payload.is_active,
        banker_id: payload.banker_id ?? null,
        created_at: now,
        updated_at: now,
      },
      ...current,
    ]);
  }

  /** Edits an existing bank product in place — used by both Super Admin's catalogue and a Banker's own Bank Criteria page. */
  update(id: number, payload: BankCriteriaUpsertPayload): void {
    this._criteria.update((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              bank_name: payload.bank_name,
              product_name: payload.product_name,
              loan_type: payload.loan_type,
              min_loan_amount: payload.min_loan_amount,
              max_loan_amount: payload.max_loan_amount,
              min_monthly_income: payload.min_monthly_income,
              min_credit_score: payload.min_credit_score,
              interest_rate: payload.interest_rate,
              is_active: payload.is_active,
              banker_id: payload.banker_id ?? row.banker_id,
              updated_at: new Date().toISOString(),
            }
          : row,
      ),
    );
  }

  toggleActive(id: number): void {
    this._criteria.update((current) =>
      current.map((row) => (row.id === id ? { ...row, is_active: !row.is_active } : row)),
    );
  }

  /**
   * Evaluates a lead against every active bank product — loan type, amount
   * range, income and credit score — mirroring what the real backend's
   * matching engine would check. Deterministic, no randomness.
   */
  runMatching(lead: Lead): MatchingResult {
    const active = this._criteria().filter((product) => product.is_active);
    const matches: MatchingResult['matches'] = [];
    const rejected: MatchingResult['rejected'] = [];

    for (const product of active) {
      const reasons: string[] = [];

      if (product.loan_type !== lead.loan_type) {
        reasons.push(`Does not offer ${lead.loan_type.replace(/_/g, ' ')} loans`);
      }
      if (lead.loan_amount < product.min_loan_amount) {
        reasons.push(`Amount below the ₹${product.min_loan_amount.toLocaleString('en-IN')} minimum`);
      }
      if (product.max_loan_amount !== null && lead.loan_amount > product.max_loan_amount) {
        reasons.push(`Amount above the ₹${product.max_loan_amount.toLocaleString('en-IN')} maximum`);
      }
      if ((lead.monthly_income ?? 0) < product.min_monthly_income) {
        reasons.push(`Income below the ₹${product.min_monthly_income.toLocaleString('en-IN')}/mo minimum`);
      }
      if (product.min_credit_score !== null && (lead.credit_score ?? 0) < product.min_credit_score) {
        reasons.push(`Credit score below ${product.min_credit_score}`);
      }

      if (reasons.length > 0) {
        rejected.push({ bank_name: product.bank_name, product_name: product.product_name, reasons });
        continue;
      }

      const creditHeadroom = product.min_credit_score
        ? Math.min(20, (lead.credit_score ?? 0) - product.min_credit_score)
        : 10;
      const incomeHeadroom = Math.min(
        20,
        Math.round((((lead.monthly_income ?? 0) - product.min_monthly_income) / product.min_monthly_income) * 20),
      );
      const score = Math.max(60, Math.min(99, 70 + creditHeadroom + incomeHeadroom));

      matches.push({
        bank_criteria_id: product.id,
        bank_name: product.bank_name,
        product_name: product.product_name,
        interest_rate: product.interest_rate,
        score,
        reasons: ['Meets all eligibility criteria'],
      });
    }

    matches.sort((a, b) => b.score - a.score);

    return {
      lead_id: lead.id,
      evaluated: active.length,
      matched: matches.length,
      matches,
      rejected,
    };
  }
}
