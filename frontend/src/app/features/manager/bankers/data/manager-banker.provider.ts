import { Injectable, computed, inject } from '@angular/core';

import { BankCriteria } from '@features/super-admin/data/models/banker.model';
import { ManagedUser } from '@features/super-admin/data/models/user.model';
import { BankingDataProvider } from '@features/super-admin/data/providers/banking-data.provider';
import { UserDataProvider } from '@features/super-admin/data/providers/user-data.provider';

import { Lead, UserSummary } from '../../leads/data/models/lead.model';
import { ManagerLeadDataProvider } from '../../leads/data/providers/lead-data.provider';

export interface BankerPerformance {
  leadsHandled: number;
  approved: number;
  disbursed: number;
  rejected: number;
  conversionRatePct: number;
}

/**
 * Manager-scoped view over bankers — composes the platform's banker
 * directory (`UserDataProvider`), bank products (`BankingDataProvider`) and
 * the manager's own leads (`ManagerLeadDataProvider`). No separate mock
 * dataset: bank names, criteria and lead counts all come from the same
 * stores Super Admin's Banking pages read and write.
 */
@Injectable({ providedIn: 'root' })
export class ManagerBankerDataProvider {
  private readonly userData = inject(UserDataProvider);
  private readonly bankingData = inject(BankingDataProvider);
  private readonly leadData = inject(ManagerLeadDataProvider);

  readonly bankers = computed<ManagedUser[]>(() => this.userData.users().filter((user) => user.role === 'banker'));

  readonly criteria = this.bankingData.criteria;

  readonly leads = this.leadData.leads;

  /** Bankers who have at least one of the manager's leads assigned to them. */
  readonly assignedBankers = computed(() =>
    this.bankers()
      .map((banker) => ({ banker, leads: this.leadsFor(banker.id) }))
      .filter((row) => row.leads.length > 0),
  );

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

  assignBanker(leadId: number, banker: UserSummary | null): void {
    this.leadData.assignBanker(leadId, banker);
  }
}
