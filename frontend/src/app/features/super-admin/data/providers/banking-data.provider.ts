import { Injectable, inject, signal } from '@angular/core';

import { BankCriteria, BankCriteriaPayload } from '@core/models/bank.model';
import { BankService } from '@core/services/bank.service';

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

function toPayload(payload: BankCriteriaUpsertPayload): BankCriteriaPayload & { banker_id?: number | null } {
  return {
    bank_name: payload.bank_name,
    product_name: payload.product_name,
    loan_type: payload.loan_type,
    min_loan_amount: payload.min_loan_amount,
    max_loan_amount: payload.max_loan_amount,
    min_monthly_income: payload.min_monthly_income,
    min_credit_score: payload.min_credit_score,
    interest_rate: payload.interest_rate,
    is_active: payload.is_active,
    ...(payload.banker_id !== undefined ? { banker_id: payload.banker_id } : {}),
  };
}

/**
 * Centralized state for bank products (Phase 2) — a thin signal-store
 * wrapping the real `BankService` (`GET/POST/PUT/DELETE banks`), the same
 * "real service, mock-shaped provider" pattern `CommissionDataProvider`
 * already uses for connectors/affiliates/payouts/ledger. Root-provided, so
 * Bank Criteria, the Matching Engine dashboard and Manager's Bankers pages
 * (via `ManagerBankerDataProvider`) all read the same live list.
 *
 * The matching engine itself is no longer simulated here — see
 * SuperAdminMatchingEngineComponent, which now calls the real
 * `POST leads/{lead}/match` endpoint directly via LeadService.runMatching().
 */
@Injectable({ providedIn: 'root' })
export class BankingDataProvider {
  private readonly bankApi = inject(BankService);

  private readonly _criteria = signal<BankCriteria[]>([]);
  private readonly _loading = signal(false);

  readonly criteria = this._criteria.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.load();
  }

  create(payload: BankCriteriaUpsertPayload): void {
    this.bankApi.create(toPayload(payload)).subscribe({ next: () => this.load() });
  }

  /** Edits an existing bank product in place — used by both Super Admin's catalogue and a Banker's own Bank Criteria page. */
  update(id: number, payload: BankCriteriaUpsertPayload): void {
    this.bankApi.update(id, toPayload(payload)).subscribe({ next: () => this.load() });
  }

  toggleActive(id: number): void {
    const row = this._criteria().find((criteria) => criteria.id === id);
    if (!row) {
      return;
    }
    this.bankApi.update(id, { is_active: !row.is_active }).subscribe({ next: () => this.load() });
  }

  private load(): void {
    this._loading.set(true);
    this.bankApi.list({ per_page: 200 }).subscribe({
      next: (result) => {
        this._criteria.set(result.items);
        this._loading.set(false);
      },
      error: () => {
        this._criteria.set([]);
        this._loading.set(false);
      },
    });
  }
}
