import { Injectable, computed, inject, signal } from '@angular/core';

import { BankCriteria } from '@core/models/bank.model';
import { ManagedUser } from '@core/models/user.model';
import { LeadService } from '@core/services/lead.service';
import { UserService } from '@core/services/user.service';

import { BankingDataProvider } from '@features/super-admin/data/providers/banking-data.provider';

import { Lead, UserSummary } from '../../data/models/lead-catalogue.model';
import { ManagerLeadsDataProvider } from '../../data/providers/manager-leads.provider';

export interface BankerPerformance {
  leadsHandled: number;
  approved: number;
  disbursed: number;
  rejected: number;
  conversionRatePct: number;
}

/**
 * Manager-scoped view over bankers — composes the platform's real banker
 * directory (`UserService`, `GET users?role=banker`), real bank products
 * (`BankingDataProvider`) and the manager's own real leads
 * (`ManagerLeadsDataProvider`). No separate dataset: bank names, criteria
 * and lead counts all come from the same live sources Super Admin's Banking
 * pages and the Manager's Leads pages read and write.
 */
@Injectable({ providedIn: 'root' })
export class ManagerBankerDataProvider {
  private readonly userApi = inject(UserService);
  private readonly leadApi = inject(LeadService);
  private readonly bankingData = inject(BankingDataProvider);
  private readonly leadData = inject(ManagerLeadsDataProvider);

  private readonly _bankers = signal<ManagedUser[]>([]);
  readonly bankers = this._bankers.asReadonly();

  readonly criteria = this.bankingData.criteria;

  readonly leads = this.leadData.leads;

  /** Bankers who have at least one of the manager's leads assigned to them. */
  readonly assignedBankers = computed(() =>
    this.bankers()
      .map((banker) => ({ banker, leads: this.leadsFor(banker.id) }))
      .filter((row) => row.leads.length > 0),
  );

  constructor() {
    this.loadBankers();
  }

  bankNameFor(bankerId: number): string {
    const product = this.criteria().find((row) => row.banker_id === bankerId);
    return product?.bank_name ?? '—';
  }

  criteriaFor(bankerId: number): BankCriteria[] {
    return this.criteria().filter((row) => row.banker_id === bankerId);
  }

  leadsFor(bankerId: number): Lead[] {
    return this.leads().filter((lead) => lead.assigned_banker?.id === bankerId);
  }

  performanceFor(bankerId: number): BankerPerformance {
    const rows = this.leadsFor(bankerId);
    const approved = rows.filter((row) => row.status === 'approved' || row.status === 'disbursed').length;
    const disbursed = rows.filter((row) => row.status === 'disbursed').length;
    const rejected = rows.filter((row) => row.status === 'rejected').length;
    const conversionRatePct = rows.length === 0 ? 0 : Math.round((approved / rows.length) * 100);

    return { leadsHandled: rows.length, approved, disbursed, rejected, conversionRatePct };
  }

  /** Bankers eligible to be assigned to a lead — every active banker on the platform. */
  assignableBankers(): UserSummary[] {
    return this.bankers()
      .filter((banker) => banker.is_active)
      .map((banker) => ({ id: banker.id, name: banker.name, email: banker.email, role: banker.role }));
  }

  /**
   * Assigns a banker to a lead via the real `POST leads/{lead}/assign`
   * endpoint (the same generic assignment endpoint the RM/Employee
   * assignment flow uses — it dispatches to `assigned_banker_id` when the
   * assignee is a Banker). `banker === null` ("unassign") is a no-op: no
   * real endpoint can clear `assigned_banker_id` today (`assign` requires a
   * non-null assignee, and the generic lead-update endpoint doesn't accept
   * that field) — a small, genuine backend gap left for a future phase.
   */
  assignBanker(leadId: number, banker: UserSummary | null): void {
    if (!banker) {
      return;
    }

    this.leadApi.assign(leadId, banker.id).subscribe({ next: () => this.leadData.reload() });
  }

  private loadBankers(): void {
    this.userApi.list({ role: 'banker', perPage: 200 }).subscribe({
      next: (bankers) => this._bankers.set(bankers),
      error: () => this._bankers.set([]),
    });
  }
}
