import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';

import { Lead, MatchingResult } from '../../data/models/lead.model';
import { BankingDataProvider } from '../../data/providers/banking-data.provider';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';

/** Lead matching dashboard — runs the mock matching engine against local data, no HTTP. */
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

  protected readonly leads = this.leadData.leads;
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly result = signal<MatchingResult | null>(null);

  protected readonly displayedLeadId = computed(() => this.selectedLeadId() ?? this.leads()[0]?.id ?? null);

  protected readonly selectedLead = computed<Lead | undefined>(() =>
    this.leads().find((lead) => lead.id === this.displayedLeadId()),
  );

  protected readonly overview = computed(() => {
    const leads = this.leads();
    const perLead = leads.map((lead) => this.bankingData.runMatching(lead));
    const totalMatches = perLead.reduce((sum, entry) => sum + entry.matched, 0);
    const leadsWithMatch = perLead.filter((entry) => entry.matched > 0).length;

    return {
      totalLeads: leads.length,
      activeProducts: this.bankingData.criteria().filter((product) => product.is_active).length,
      leadsWithMatch,
      avgMatches: leads.length ? Math.round((totalMatches / leads.length) * 10) / 10 : 0,
    };
  });

  protected run(): void {
    const lead = this.selectedLead();
    if (!lead) {
      return;
    }
    this.result.set(this.bankingData.runMatching(lead));
  }

  protected scoreColour(score: number): StatusPillColour {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'default';
  }
}
