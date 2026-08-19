import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { DashboardReport } from '@core/models/report.model';
import { ReportService } from '@core/services/report.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

const STATUS_COLOUR: Record<string, string> = {
  new: 'default',
  assigned: 'primary',
  in_progress: 'primary',
  under_review: 'primary',
  documents_pending: 'accent',
  approved: 'success',
  disbursed: 'success',
  rejected: 'warn',
  closed: 'default',
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CurrencyPipe,
    KeyValuePipe,
    MatCardModule,
    MatListModule,
    MatProgressBarModule,
    PageHeaderComponent,
    RouterLink,
    StatCardComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly reports = inject(ReportService);

  readonly report = signal<DashboardReport | null>(null);
  readonly loading = signal(false);

  readonly statusBreakdown = computed(() => {
    const data = this.report();
    if (!data) {
      return [];
    }

    const max = Math.max(1, ...data.by_status.map((row) => row.count));
    return data.by_status.map((row) => ({
      ...row,
      percent: Math.round((row.count / max) * 100),
      colourVar: `var(--app-status-${STATUS_COLOUR[row.status] ?? 'default'}-fg)`,
    }));
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.reports.dashboard().subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
