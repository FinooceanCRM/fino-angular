import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LeadService } from '@core/services/lead.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';

import { Lead, MatchingResult } from '../../data/models/lead.model';
import { BankingDataProvider } from '../../data/providers/banking-data.provider';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';

/**
 * Lead matching dashboard — the "Run matching engine" action calls the real
 * `POST leads/{lead}/match` endpoint (Phase 2) via `LeadService.runMatching`,
 * which scores the lead server-side and persists the results; this page just
 * displays what comes back. `leads` itself is still sourced from the mock
 * `LeadDataProvider` (a later phase's work), so the selected lead's id may
 * not resolve to a real backend lead until Leads itself goes real — a known
 * gap, not something this phase's scope covers.
 *
 * The old client-side "run against every lead" overview stats
 * (`leadsWithMatch`/`avgMatches`) are gone: the real endpoint persists a
 * `LeadMatch` row per bank product it evaluates, so silently calling it for
 * every lead just to populate a dashboard tile would spam writes with no
 * user intent behind them. The overview now only shows what's free to know
 * without matching anything (total leads, active bank products).
 */
@Component({
  selector: 'app-super-admin-matching-engine',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
  ],
  templateUrl: './super-admin-matching-engine.component.html',
  styleUrl: './super-admin-matching-engine.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminMatchingEngineComponent {
  private readonly leadData = inject(LeadDataProvider);
  private readonly bankingData = inject(BankingDataProvider);
  private readonly leadService = inject(LeadService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly leads = this.leadData.leads;
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly result = signal<MatchingResult | null>(null);
  protected readonly running = signal(false);

  protected readonly displayedLeadId = computed(() => this.selectedLeadId() ?? this.leads()[0]?.id ?? null);

  protected readonly selectedLead = computed<Lead | undefined>(() =>
    this.leads().find((lead) => lead.id === this.displayedLeadId()),
  );

  protected readonly overview = computed(() => ({
    totalLeads: this.leads().length,
    activeProducts: this.bankingData.criteria().filter((product) => product.is_active).length,
  }));

  protected run(): void {
    const lead = this.selectedLead();
    if (!lead) {
      return;
    }

    this.running.set(true);
    this.leadService.runMatching(lead.id).subscribe({
      next: (result) => {
        this.result.set(result);
        this.running.set(false);
      },
      error: () => {
        this.snackBar.open('Could not run the matching engine for this lead.', 'Dismiss', { duration: 4000 });
        this.running.set(false);
      },
    });
  }

  protected scoreColour(score: number): StatusPillColour {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'default';
  }
}
