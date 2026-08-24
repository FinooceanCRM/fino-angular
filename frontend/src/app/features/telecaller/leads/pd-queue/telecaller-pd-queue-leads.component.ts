import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';

import { Lead } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

type PdView = 'pending' | 'completed';

/**
 * PD (pre-disbursement verification call) Queue — the Telecaller's view of
 * every lead she is allowed to see (her department's employee-sourced leads
 * plus her own submissions), split by whether Full PD has been completed
 * yet. Backed by `LeadService.list()`; "Mark PD complete" now navigates to
 * the Full PD data-entry form (`leads/:id/pd`) rather than one-click
 * completing it — the repository's Telecaller visibility scope already
 * limits what comes back, so no extra filter is needed here.
 */
@Component({
  selector: 'app-telecaller-pd-queue-leads',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
    TelecallerLeadBucketNavComponent,
  ],
  template: `
    <app-telecaller-lead-bucket-nav />
    <app-page-header
      title="PD Queue"
      subtitle="Leads awaiting a pre-disbursement verification call."
    />

    @if (error(); as message) {
      <p class="pd-queue__error" role="alert">{{ message }}</p>
    }

    <mat-button-toggle-group class="pd-queue__toggle" [value]="view()" (change)="view.set($event.value)">
      <mat-button-toggle value="pending">Pending ({{ pending().length }})</mat-button-toggle>
      <mat-button-toggle value="completed">Completed ({{ completed().length }})</mat-button-toggle>
    </mat-button-toggle-group>

    <app-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      emptyMessage="No leads in this view."
      itemLabel="leads"
    >
      <ng-template appTableCell="reference" let-row>
        <a [routerLink]="['/telecaller/leads', row.id]">{{ row.reference }}</a>
      </ng-template>

      <ng-template appTableCell="applicant_name" let-row>
        {{ row.applicant_name }}
      </ng-template>

      <ng-template appTableCell="loan_amount" let-row>
        {{ row.loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }}
      </ng-template>

      <ng-template appTableCell="status" let-row>
        <app-status-pill [label]="row.status_label" [colour]="row.status_colour" />
      </ng-template>

      <ng-template appTableCell="source" let-row>
        {{ row.created_by?.id === telecallerId ? 'Self-submitted' : 'Employee-sourced' }}
      </ng-template>

      <ng-template #rowActions let-row>
        <a mat-icon-button type="button" matTooltip="View" aria-label="View" [routerLink]="['/telecaller/leads', row.id]">
          <mat-icon>visibility</mat-icon>
        </a>
        @if (view() === 'pending' && row.can_submit_pd) {
          <button
            mat-icon-button
            type="button"
            color="primary"
            matTooltip="Complete Full PD"
            aria-label="Complete Full PD"
            (click)="completePd(row)"
          >
            <mat-icon>call_end</mat-icon>
          </button>
        }
      </ng-template>
    </app-table>
  `,
  styles: [
    `
      .pd-queue__toggle {
        margin-bottom: var(--app-space-4);
      }
      .pd-queue__error {
        color: var(--mat-sys-error);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerPdQueueLeadsComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly telecallerId = this.auth.user()?.id ?? null;

  protected readonly all = signal<Lead[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly view = signal<PdView>('pending');

  protected readonly pending = computed(() => this.all().filter((lead) => !lead.pd_completed_at));
  protected readonly completed = computed(() => this.all().filter((lead) => !!lead.pd_completed_at));
  protected readonly rows = computed(() => (this.view() === 'pending' ? this.pending() : this.completed()));

  protected readonly columns: TableColumn<Lead>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan_amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'source', label: 'Source' },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leads.list({ per_page: 100 }).subscribe({
      next: (result) => {
        this.all.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The PD queue could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected completePd(row: Lead): void {
    this.router.navigate(['/leads', row.id, 'pd']);
  }
}
