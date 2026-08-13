import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { DashboardReport } from '@core/models/report.model';
import { ReportService } from '@core/services/report.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Reports"
      subtitle="Lead statistics for everything you can see"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (report(); as data) {
      <div class="tiles">
        <mat-card class="tile">
          <mat-card-content>
            <span class="label">Total leads</span>
            <strong>{{ data.totals.leads }}</strong>
          </mat-card-content>
        </mat-card>
        <mat-card class="tile">
          <mat-card-content>
            <span class="label">Approved</span><strong>{{ data.totals.approved }}</strong>
          </mat-card-content>
        </mat-card>
        <mat-card class="tile">
          <mat-card-content>
            <span class="label">Rejected</span><strong>{{ data.totals.rejected }}</strong>
          </mat-card-content>
        </mat-card>
        <mat-card class="tile">
          <mat-card-content>
            <span class="label">Disbursed</span><strong>{{ data.totals.disbursed }}</strong>
          </mat-card-content>
        </mat-card>
        @for (entry of data.team | keyvalue; track entry.key) {
          <mat-card class="tile">
            <mat-card-content>
              <span class="label">{{ entry.key }}</span><strong>{{ entry.value }}</strong>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <mat-card class="card">
        <mat-card-header><mat-card-title>Leads by status</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (row of data.by_status; track row.status) {
              <mat-list-item>
                <span matListItemTitle>{{ row.label }}</span>
                <span matListItemMeta>{{ row.count }}</span>
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>
      </mat-card>

      <mat-card class="card">
        <mat-card-header><mat-card-title>Recent leads</mat-card-title></mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (lead of data.recent_leads; track lead.id) {
              <mat-list-item>
                <span matListItemTitle>
                  <a [routerLink]="['/leads', lead.id]">{{ lead.reference }}</a> ·
                  {{ lead.applicant_name }}
                </span>
                <span matListItemLine>
                  {{ lead.loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }} ·
                  {{ lead.status }}
                </span>
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [
    `
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .tile strong {
        display: block;
        font-size: 1.75rem;
      }
      .label {
        opacity: 0.7;
        font-size: 0.8rem;
        text-transform: capitalize;
      }
      .card {
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  private readonly reports = inject(ReportService);

  readonly report = signal<DashboardReport | null>(null);
  readonly loading = signal(false);

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
