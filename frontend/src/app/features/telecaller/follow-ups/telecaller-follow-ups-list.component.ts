import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { TelecallerFollowUp } from '@core/models/telecaller-follow-up.model';
import { TelecallerFollowUpService } from '@core/services/telecaller-follow-up.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * Every pending follow-up across every lead the Telecaller owns — the
 * "Pending follow-ups" dashboard requirement, as its own full page. No
 * existing analogue in the app (the Banker follow-up log only lists
 * per-lead), so this is a new page backed directly by
 * `TelecallerFollowUpService.pending()`.
 */
@Component({
  selector: 'app-telecaller-follow-ups-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TableCellDirective,
    TableComponent,
  ],
  template: `
    <app-page-header title="Follow-ups" subtitle="Every pending follow-up across your leads." />

    @if (error(); as message) {
      <p class="follow-ups__error" role="alert">{{ message }}</p>
    }

    <app-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      emptyMessage="No pending follow-ups."
      itemLabel="follow-ups"
    >
      <ng-template appTableCell="lead" let-row>
        @if (row.lead) {
          <a [routerLink]="['/telecaller/leads', row.lead.id]">{{ row.lead.reference }}</a>
          <span class="follow-ups__applicant">{{ row.lead.applicant_name }}</span>
        } @else {
          —
        }
      </ng-template>

      <ng-template appTableCell="type" let-row>
        {{ row.type }}
      </ng-template>

      <ng-template appTableCell="notes" let-row>
        {{ row.notes || '—' }}
      </ng-template>

      <ng-template appTableCell="next_follow_up_at" let-row>
        {{ row.next_follow_up_at ? (row.next_follow_up_at | date: 'mediumDate') : '—' }}
      </ng-template>

      <ng-template #rowActions let-row>
        <button mat-button color="primary" type="button" (click)="complete(row)">
          <mat-icon>task_alt</mat-icon>
          Mark complete
        </button>
      </ng-template>
    </app-table>
  `,
  styles: [
    `
      .follow-ups__applicant {
        display: block;
        font-size: 0.8rem;
        color: var(--app-status-default-fg);
      }
      .follow-ups__error {
        color: var(--mat-sys-error);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerFollowUpsListComponent implements OnInit {
  private readonly followUpsApi = inject(TelecallerFollowUpService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rows = signal<TelecallerFollowUp[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly columns: TableColumn<TelecallerFollowUp>[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'type', label: 'Type' },
    { key: 'notes', label: 'Notes' },
    { key: 'next_follow_up_at', label: 'Next follow-up' },
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.followUpsApi.pending().subscribe({
      next: (items) => {
        this.rows.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Follow-ups could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected complete(item: TelecallerFollowUp): void {
    this.followUpsApi.complete(item.id).subscribe({
      next: () => {
        this.snackBar.open('Follow-up marked complete.', 'Dismiss', { duration: 4000 });
        this.load();
      },
      error: () => this.error.set('The follow-up could not be marked complete.'),
    });
  }
}
