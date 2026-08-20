import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { Lead } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { LeadService } from '@core/services/lead.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { TelecallerLeadBucketNavComponent } from '../lead-bucket-nav/telecaller-lead-bucket-nav.component';

type PdView = 'pending' | 'completed';

/**
 * PD (pre-disbursement verification call) Queue — the Telecaller's view of
 * every lead she is allowed to see (her department's employee-sourced leads
 * plus her own submissions), split by whether the PD call has been logged
 * yet. Backed by `LeadService.list()` + `LeadService.completePd()`,
 * unmodified — the repository's Telecaller visibility scope already limits
 * what comes back, so no extra filter is needed here.
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
        @if (view() === 'pending') {
          <button
            mat-icon-button
            type="button"
            color="primary"
            matTooltip="Mark PD complete"
            aria-label="Mark PD complete"
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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
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
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Mark PD complete',
          message: `Confirm the pre-disbursement call for ${row.applicant_name} has been completed?`,
          confirmLabel: 'Mark complete',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.leads.completePd(row.id).subscribe({
          next: () => {
            this.snackBar.open('PD marked complete.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: (err: NormalizedApiError) => {
            this.snackBar.open(err.message ?? 'The PD call could not be marked complete.', 'Dismiss', {
              duration: 6000,
            });
          },
        });
      });
  }
}
