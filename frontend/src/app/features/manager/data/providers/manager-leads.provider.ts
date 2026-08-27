import { Injectable, inject, signal } from '@angular/core';

import { Lead } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';

/**
 * Centralized state for the manager-visible slice of leads — a thin
 * signal-store wrapping the real `LeadService` (`GET leads`), the same
 * "real service, mock-shaped provider" pattern `BankingDataProvider` and
 * `CommissionDataProvider` already use. `GET leads` is already scoped
 * server-side to the signed-in actor's hierarchy (a Manager only ever gets
 * back their own Relationship Managers' and Employees' leads), so no
 * client-side hierarchy filtering is needed here — unlike the retired mock
 * provider this replaces, which had to fabricate that scoping itself.
 *
 * Root-provided so the Manager module's Reports pages, the Bankers module
 * (`ManagerBankerDataProvider`) and the Relationship Manager module's
 * Team Performance/Activities tabs all read the same live list.
 */
@Injectable({ providedIn: 'root' })
export class ManagerLeadsDataProvider {
  private readonly leadApi = inject(LeadService);

  private readonly _leads = signal<Lead[]>([]);
  private readonly _loading = signal(false);

  readonly leads = this._leads.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.reload();
  }

  /** Re-fetches the list — call after a mutation (e.g. assigning a banker) elsewhere touches these leads. */
  reload(): void {
    this._loading.set(true);
    this.leadApi.list({ per_page: 500 }).subscribe({
      next: (result) => {
        this._leads.set(result.items);
        this._loading.set(false);
      },
      error: () => {
        this._leads.set([]);
        this._loading.set(false);
      },
    });
  }
}
