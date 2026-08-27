import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AffiliatePayout as ApiAffiliatePayout } from '@core/models/affiliate.model';
import { ConnectorPayout as ApiConnectorPayout } from '@core/models/connector.model';
import { ApiLedgerEntry, LedgerService } from '@core/services/ledger.service';
import { SuperAdminAffiliateService } from '@core/services/super-admin-affiliate.service';
import { SuperAdminConnectorService } from '@core/services/super-admin-connector.service';

import { Affiliate, Connector, LedgerEntry, Payout } from '../models/commission.model';

function toLedgerEntry(row: ApiLedgerEntry): LedgerEntry {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    description: row.description,
    debit: row.debit,
    credit: row.credit,
  };
}

const PAYOUT_METHOD_LABEL: Record<string, Payout['method']> = {
  bank_transfer: 'Bank Transfer',
  upi: 'UPI',
};

function toAffiliatePayoutRow(payout: ApiAffiliatePayout): Payout {
  return {
    id: payout.id,
    reference: payout.reference,
    payee_name: payout.affiliate?.name ?? 'Unknown affiliate',
    payee_type: 'affiliate',
    amount: payout.amount,
    method: PAYOUT_METHOD_LABEL[payout.method] ?? 'Bank Transfer',
    status: payout.status as Payout['status'],
    requested_at: payout.requested_at ?? payout.created_at ?? '',
    paid_at: payout.status === 'paid' ? payout.processed_at : null,
  };
}

function toConnectorPayoutRow(payout: ApiConnectorPayout): Payout {
  return {
    id: payout.id,
    reference: payout.reference,
    payee_name: payout.connector?.name ?? 'Unknown connector',
    payee_type: 'connector',
    amount: payout.amount,
    method: PAYOUT_METHOD_LABEL[payout.method] ?? 'Bank Transfer',
    status: payout.status as Payout['status'],
    requested_at: payout.requested_at ?? payout.created_at ?? '',
    paid_at: payout.status === 'paid' ? payout.processed_at : null,
  };
}

/**
 * Centralized state for connector commission, affiliate commission,
 * payouts and the accounting ledger. Root-provided so every Commission
 * page, every relevant report, and the Dashboard read the same live data.
 *
 * Connectors and affiliates are both real data now, fetched from their
 * respective Super Admin endpoints (GET super-admin/connectors,
 * GET super-admin/affiliates) — same aggregate-row shape for both (no
 * per-lead-per-level commission ledger endpoint exists for either). Payouts
 * for both are also real. The accounting Ledger (Phase 2) is real too, read
 * from GET super-admin/ledger and mapped down to the `LedgerEntry` shape the
 * Accounting and Commission Reports pages already expect — those pages
 * compute their own running balance/labels client-side from the full list,
 * same as before.
 */
@Injectable({ providedIn: 'root' })
export class CommissionDataProvider {
  private readonly affiliatesApi = inject(SuperAdminAffiliateService);
  private readonly connectorsApi = inject(SuperAdminConnectorService);
  private readonly ledgerApi = inject(LedgerService);

  private readonly _connectors = signal<Connector[]>([]);
  private readonly _connectorsLoading = signal(false);
  private readonly _affiliates = signal<Affiliate[]>([]);
  private readonly _affiliatesLoading = signal(false);
  private readonly _connectorPayouts = signal<Payout[]>([]);
  private readonly _affiliatePayouts = signal<Payout[]>([]);
  private readonly _payoutsLoading = signal(false);
  private readonly _ledger = signal<LedgerEntry[]>([]);
  private readonly _ledgerLoading = signal(false);

  readonly connectors = this._connectors.asReadonly();
  readonly connectorsLoading = this._connectorsLoading.asReadonly();
  readonly affiliates = this._affiliates.asReadonly();
  readonly affiliatesLoading = this._affiliatesLoading.asReadonly();
  readonly payouts = computed(() => [...this._connectorPayouts(), ...this._affiliatePayouts()]);
  readonly payoutsLoading = this._payoutsLoading.asReadonly();
  readonly ledger = this._ledger.asReadonly();
  readonly ledgerLoading = this._ledgerLoading.asReadonly();

  constructor() {
    this.loadAffiliates();
    this.loadConnectors();
    this.loadConnectorPayouts();
    this.loadAffiliatePayouts();
    this.loadLedger();
  }

  /**
   * Approves, marks-paid or rejects one payout, dispatching to the
   * connector or affiliate backend service by `row.payee_type`, then
   * reloads that payee type's payouts so the table reflects the new
   * status. `reason` is required (and sent) only for `'reject'`.
   */
  decidePayout(row: Payout, action: 'approve' | 'markPaid' | 'reject', reason?: string): Observable<unknown> {
    if (row.payee_type === 'connector') {
      const request$ =
        action === 'approve' ? this.connectorsApi.approvePayout(row.id)
        : action === 'markPaid' ? this.connectorsApi.markPayoutPaid(row.id)
        : this.connectorsApi.rejectPayout(row.id, reason ?? '');
      return request$.pipe(tap(() => this.loadConnectorPayouts()));
    }

    const request$ =
      action === 'approve' ? this.affiliatesApi.approvePayout(row.id)
      : action === 'markPaid' ? this.affiliatesApi.markPayoutPaid(row.id)
      : this.affiliatesApi.rejectPayout(row.id, reason ?? '');
    return request$.pipe(tap(() => this.loadAffiliatePayouts()));
  }

  private loadAffiliates(): void {
    this._affiliatesLoading.set(true);
    this.affiliatesApi.list({ per_page: 100 }).subscribe({
      next: (result) => {
        this._affiliates.set(result.items);
        this._affiliatesLoading.set(false);
      },
      error: () => {
        this._affiliates.set([]);
        this._affiliatesLoading.set(false);
      },
    });
  }

  private loadConnectors(): void {
    this._connectorsLoading.set(true);
    this.connectorsApi.list({ per_page: 100 }).subscribe({
      next: (result) => {
        this._connectors.set(result.items);
        this._connectorsLoading.set(false);
      },
      error: () => {
        this._connectors.set([]);
        this._connectorsLoading.set(false);
      },
    });
  }

  private loadAffiliatePayouts(): void {
    this._payoutsLoading.set(true);
    this.affiliatesApi.payouts({ per_page: 100, status: 'pending,processing,paid,failed' }).subscribe({
      next: (result) => {
        this._affiliatePayouts.set(result.items.map(toAffiliatePayoutRow));
        this._payoutsLoading.set(false);
      },
      error: () => {
        this._affiliatePayouts.set([]);
        this._payoutsLoading.set(false);
      },
    });
  }

  private loadConnectorPayouts(): void {
    this._payoutsLoading.set(true);
    this.connectorsApi.payouts({ per_page: 100, status: 'pending,processing,paid,failed' }).subscribe({
      next: (result) => {
        this._connectorPayouts.set(result.items.map(toConnectorPayoutRow));
        this._payoutsLoading.set(false);
      },
      error: () => {
        this._connectorPayouts.set([]);
        this._payoutsLoading.set(false);
      },
    });
  }

  private loadLedger(): void {
    this._ledgerLoading.set(true);
    this.ledgerApi.list({ per_page: 500 }).subscribe({
      next: (result) => {
        this._ledger.set(result.items.map(toLedgerEntry));
        this._ledgerLoading.set(false);
      },
      error: () => {
        this._ledger.set([]);
        this._ledgerLoading.set(false);
      },
    });
  }
}
