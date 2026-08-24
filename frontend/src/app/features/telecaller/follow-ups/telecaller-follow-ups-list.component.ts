import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { TelecallerFollowUp, TelecallerFollowUpFilter } from '@core/models/telecaller-follow-up.model';
import { TelecallerFollowUpService } from '@core/services/telecaller-follow-up.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { TelecallerFollowUpCalendarComponent } from './calendar/telecaller-follow-up-calendar.component';

interface FilterOption {
  value: TelecallerFollowUpFilter;
  label: string;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: "Today's" },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const PRIORITY_COLOUR: Record<string, string> = { high: 'warn', medium: 'accent', low: 'default' };

/**
 * Every follow-up across every lead the Telecaller owns, with the same
 * All/Today/Pending/Completed/Overdue filters and a month calendar the
 * legacy WordPress Follow-up tab used. Backed by
 * `TelecallerFollowUpService.pending(filter)`.
 */
@Component({
  selector: 'app-telecaller-follow-ups-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
    TelecallerFollowUpCalendarComponent,
  ],
  template: `
    <app-page-header title="Follow-ups" subtitle="Every follow-up across your leads." />

    @if (error(); as message) {
      <p class="follow-ups__error" role="alert">{{ message }}</p>
    }

    <mat-button-toggle-group class="follow-ups__filters" [value]="filter()" (change)="onFilterChange($event.value)">
      @for (option of filters; track option.value) {
        <mat-button-toggle [value]="option.value">{{ option.label }}</mat-button-toggle>
      }
    </mat-button-toggle-group>

    <app-table
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      emptyMessage="No follow-ups in this view."
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

      <ng-template appTableCell="priority" let-row>
        <app-status-pill [label]="row.priority" [colour]="priorityColour(row.priority)" />
      </ng-template>

      <ng-template appTableCell="notes" let-row>
        {{ row.notes || '—' }}
      </ng-template>

      <ng-template appTableCell="next_follow_up_at" let-row>
        @if (row.next_follow_up_at) {
          {{ row.next_follow_up_at | date: 'mediumDate' }}
          @if (row.is_overdue) {
            <app-status-pill label="Overdue" colour="warn" />
          } @else if (row.is_today) {
            <app-status-pill label="Today" colour="accent" />
          }
        } @else {
          —
        }
      </ng-template>

      <ng-template #rowActions let-row>
        @if (!row.completed_at) {
          <button mat-button color="primary" type="button" (click)="complete(row)">
            <mat-icon>task_alt</mat-icon>
            Mark complete
          </button>
        }
      </ng-template>
    </app-table>

    <h3 class="follow-ups__calendar-title">Calendar</h3>
    <app-telecaller-follow-up-calendar [items]="calendarItems()" (daySelected)="onDaySelected($event)" />

    @if (selectedDay(); as items) {
      <div class="follow-ups__day-panel">
        <strong>{{ items.length }} follow-up(s) on the selected day</strong>
        <ul>
          @for (item of items; track item.id) {
            <li>
              {{ item.lead?.applicant_name ?? '—' }} · {{ item.type }} · {{ item.priority }}
              @if (item.notes) {
                — {{ item.notes }}
              }
            </li>
          } @empty {
            <li>No follow-ups on this day.</li>
          }
        </ul>
      </div>
    }
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
      .follow-ups__filters {
        margin-bottom: var(--app-space-4);
      }
      .follow-ups__calendar-title {
        margin-top: var(--app-space-5);
      }
      .follow-ups__day-panel {
        margin-top: var(--app-space-3);
        padding: var(--app-space-3);
        border-radius: var(--app-radius-md);
        background: var(--mat-sys-surface-container);
      }
      .follow-ups__day-panel ul {
        margin: var(--app-space-2) 0 0;
        padding-left: 1.1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerFollowUpsListComponent implements OnInit {
  private readonly followUpsApi = inject(TelecallerFollowUpService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly filters = FILTERS;
  protected readonly filter = signal<TelecallerFollowUpFilter>('pending');
  protected readonly rows = signal<TelecallerFollowUp[]>([]);
  protected readonly calendarItems = signal<TelecallerFollowUp[]>([]);
  protected readonly selectedDay = signal<TelecallerFollowUp[] | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly columns: TableColumn<TelecallerFollowUp>[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'type', label: 'Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'notes', label: 'Notes' },
    { key: 'next_follow_up_at', label: 'Next follow-up' },
  ];

  ngOnInit(): void {
    this.load();
    // The calendar always shows the full picture regardless of the active table filter.
    this.followUpsApi.pending('all').subscribe({
      next: (items) => this.calendarItems.set(items),
      error: () => this.calendarItems.set([]),
    });
  }

  protected onFilterChange(value: TelecallerFollowUpFilter): void {
    this.filter.set(value);
    this.load();
  }

  protected onDaySelected(items: TelecallerFollowUp[]): void {
    this.selectedDay.set(items);
  }

  protected priorityColour(priority: string): string {
    return PRIORITY_COLOUR[priority] ?? 'default';
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.followUpsApi.pending(this.filter()).subscribe({
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
