import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { AssignableUser, UserSummary } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { Lead, LEAD_STATUS_CATALOGUE, LOAN_TYPE_CATALOGUE, TERMINAL_LEAD_STATUSES } from '../../data/models/lead-catalogue.model';
import {
  ManagerReassignDialogComponent,
  ManagerReassignDialogResult,
} from '../reassign-dialog/manager-reassign-dialog.component';

const ROLE_LABEL: Record<string, string> = {
  relationship_manager: 'Relationship Manager',
  employee: 'Employee',
  manager: 'Manager',
  banker: 'Banker',
  telecaller: 'Telecaller',
  connector: 'Connector',
  super_admin: 'Super Admin',
  affiliate: 'Affiliate',
};

/** Short prefix used in the Source column, e.g. "con-Rahul Sharma". */
const SOURCE_PREFIX: Record<string, string> = {
  connector: 'con',
  manager: 'mgr',
  relationship_manager: 'rm',
  employee: 'emp',
  banker: 'bank',
  telecaller: 'tc',
  super_admin: 'admin',
  affiliate: 'aff',
};

/**
 * Reusable list page for one lead-status bucket (All / New / Assigned /
 * Processing / Approved / Disbursed / Rejected). Backed by the real
 * `GET leads` endpoint via `LeadService` — filtering, sorting and paging all
 * happen server-side. Search plus an expandable "advanced filters" row, row
 * selection with a bulk-reassign action bar.
 */
@Component({
  selector: 'app-manager-lead-status-table',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-lead-status-table.component.html',
  styleUrl: './manager-lead-status-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadStatusTableComponent {
  /** null = All Leads (also the only bucket that shows the extra status filter). */
  readonly statuses = input<string[] | null>(null);
  readonly title = input.required<string>();
  readonly subtitle = input('');
  /** When set, further restricts the bucket to leads owned by this Relationship Manager (direct or via their Employees) — the RM-scoped views. */
  readonly scopeToRelationshipManagerId = input<number | null>(null);
  /** When set, further restricts the bucket to leads owned by this Employee — the Employee-scoped "My Leads" view. */
  readonly scopeToEmployeeId = input<number | null>(null);
  /** When set, further restricts the bucket to leads matched to this Banker — the Banker-scoped "My Leads" view. */
  readonly scopeToBankerId = input<number | null>(null);
  /** When set, further restricts the bucket to leads created by this user — the Telecaller-scoped "My Submitted Leads" view. */
  readonly scopeToCreatedBy = input<number | null>(null);
  /** When set, further restricts the bucket to leads attributed to this Connector — the Connector-scoped "My Submitted Leads" view. */
  readonly scopeToConnectorId = input<number | null>(null);
  /** Row-action "View" and the reassign pool both key off this — lets the same component serve both the Manager and RM route trees. */
  readonly basePath = input('/manager/leads');
  /** Employees can see who a lead is assigned to but can't reassign it — hides the select column, bulk bar and row reassign action. */
  readonly allowReassign = input(true);

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly leads = inject(LeadService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly statusOptions = LEAD_STATUS_CATALOGUE;
  protected readonly showAdvanced = signal(false);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    loanType: '',
    city: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly selected = signal<ReadonlySet<number>>(new Set());

  protected readonly rows = signal<Lead[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly assignableStaff = signal<AssignableUser[]>([]);
  protected readonly canViewSource = computed(() =>
    this.auth.hasRole('super_admin', 'manager', 'relationship_manager'),
  );

  protected readonly columns = computed<TableColumn<Lead>[]>(() => [
    ...(this.allowReassign() ? [{ key: 'select', label: '' }] : []),
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    ...(this.canViewSource() ? [{ key: 'source', label: 'Source' }] : []),
    { key: 'loan', label: 'Loan' },
    { key: 'city', label: 'City', formatter: (row) => row.city ?? '—' },
    { key: 'assignee', label: 'Assigned to' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
  ]);

  protected readonly pageSelectedCount = computed(() => {
    const selected = this.selected();
    return this.rows().filter((row) => selected.has(row.id)).length;
  });

  protected readonly allOnPageSelected = computed(
    () => this.rows().length > 0 && this.pageSelectedCount() === this.rows().length,
  );

  constructor() {
    this.leads.assignableUsers().subscribe({
      next: (users) => this.assignableStaff.set(users),
      error: () => this.assignableStaff.set([]),
    });

    // Re-fetch whenever the applied filters, scope inputs or page change.
    effect(() => {
      const f = this.filterValues();
      const bucket = this.statuses();
      const rmId = this.scopeToRelationshipManagerId();
      const employeeId = this.scopeToEmployeeId();
      const bankerId = this.scopeToBankerId();
      const createdBy = this.scopeToCreatedBy();
      const connectorId = this.scopeToConnectorId();
      const page = this.pageIndex();
      const size = this.pageSize();

      this.load(f, bucket, rmId, employeeId, bankerId, createdBy, connectorId, page, size);
    });
  }

  private load(
    f: ReturnType<typeof this.filterValues>,
    bucket: string[] | null,
    rmId: number | null,
    employeeId: number | null,
    bankerId: number | null,
    createdBy: number | null,
    connectorId: number | null,
    page: number,
    size: number,
  ): void {
    this.loading.set(true);
    this.error.set(null);

    const status = bucket ? bucket.join(',') : f.status || undefined;

    this.leads
      .list({
        search: f.search || undefined,
        status,
        loan_type: f.loanType || undefined,
        city: f.city || undefined,
        min_amount: f.minAmount || undefined,
        max_amount: f.maxAmount || undefined,
        created_from: f.dateFrom || undefined,
        created_to: f.dateTo || undefined,
        assigned_relationship_manager_id: rmId ?? undefined,
        assigned_employee_id: employeeId ?? undefined,
        assigned_banker_id: bankerId ?? undefined,
        created_by: createdBy ?? undefined,
        connector_id: connectorId ?? undefined,
        page: page + 1,
        per_page: size,
      })
      .subscribe({
        next: ({ items, meta }) => {
          this.rows.set(items);
          this.total.set(meta.total ?? items.length);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.error.set('Could not load leads.');
          this.loading.set(false);
        },
      });
  }

  protected roleLabel(role: string): string {
    return ROLE_LABEL[role] ?? role;
  }

  /** Who this lead came from — the connector if one is attached, else whoever created it, else organic. */
  protected sourcePerson(row: Lead): UserSummary | null {
    return row.connector ?? row.created_by ?? null;
  }

  protected sourceLabel(row: Lead): string {
    const person = this.sourcePerson(row);
    if (!person) {
      return '—';
    }
    const prefix = SOURCE_PREFIX[person.role] ?? person.role;
    return `${prefix}-${person.name}`;
  }

  protected sourceTooltip(row: Lead): string {
    const person = this.sourcePerson(row);
    if (!person) {
      return 'No source recorded — organic/direct lead.';
    }
    return [
      `Name - ${person.name}`,
      `Email - ${person.email}`,
      `Mob - ${person.phone ?? '—'}`,
      `Source - ${this.roleLabel(person.role)}`,
    ].join('\n');
  }

  protected loanTypeLabel(value: string): string {
    return this.loanTypes.find((option) => option.value === value)?.label ?? value;
  }

  protected assigneeLabel(row: Lead): string {
    return (
      row.assigned_employee?.name ??
      row.assigned_relationship_manager?.name ??
      row.assigned_telecaller?.name ??
      row.assigned_banker?.name ??
      'Unassigned'
    );
  }

  /** Terminal-status leads (Closed) can no longer transition — mirrors `LeadStatus::isTerminal()` on the backend. */
  protected isTerminal(row: Lead): boolean {
    return TERMINAL_LEAD_STATUSES.includes(row.status);
  }

  protected resetAdvanced(): void {
    this.filters.patchValue({
      loanType: '',
      city: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      status: '',
    });
    this.pageIndex.set(0);
  }

  protected applyFilters(): void {
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected isSelected(row: Lead): boolean {
    return this.selected().has(row.id);
  }

  protected toggleRow(row: Lead): void {
    const next = new Set(this.selected());
    if (next.has(row.id)) {
      next.delete(row.id);
    } else {
      next.add(row.id);
    }
    this.selected.set(next);
  }

  protected toggleAllOnPage(): void {
    const next = new Set(this.selected());
    if (this.allOnPageSelected()) {
      for (const row of this.rows()) {
        next.delete(row.id);
      }
    } else {
      for (const row of this.rows()) {
        next.add(row.id);
      }
    }
    this.selected.set(next);
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected reassignSelected(): void {
    this.openReassignDialog([...this.selected()]);
  }

  protected reassignOne(row: Lead): void {
    this.openReassignDialog([row.id]);
  }

  private openReassignDialog(leadIds: number[]): void {
    if (leadIds.length === 0) {
      return;
    }

    const rmId = this.scopeToRelationshipManagerId();
    const pool = rmId !== null
      ? this.assignableStaff().filter((person) => person.role === 'employee' && person.relationship_manager_id === rmId)
      : this.assignableStaff();
    const staff = pool.map((person) => ({ ...person, role_label: this.roleLabel(person.role) }));

    this.dialog
      .open<ManagerReassignDialogComponent, unknown, ManagerReassignDialogResult>(ManagerReassignDialogComponent, {
        data: { count: leadIds.length, staff },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        let remaining = leadIds.length;
        let failures = 0;

        for (const leadId of leadIds) {
          this.leads.assign(leadId, result.assignee.id, result.remarks).subscribe({
            next: () => {
              remaining -= 1;
              if (remaining === 0) {
                this.finishReassign(leadIds.length, failures, result.assignee.name);
              }
            },
            error: () => {
              remaining -= 1;
              failures += 1;
              if (remaining === 0) {
                this.finishReassign(leadIds.length, failures, result.assignee.name);
              }
            },
          });
        }
      });
  }

  private finishReassign(count: number, failures: number, assigneeName: string): void {
    this.clearSelection();
    this.load(
      this.filterValues(),
      this.statuses(),
      this.scopeToRelationshipManagerId(),
      this.scopeToEmployeeId(),
      this.scopeToBankerId(),
      this.scopeToCreatedBy(),
      this.scopeToConnectorId(),
      this.pageIndex(),
      this.pageSize(),
    );

    if (failures === 0) {
      this.snackBar.open(
        count === 1 ? `Reassigned to ${assigneeName}.` : `${count} leads reassigned to ${assigneeName}.`,
        'Dismiss',
        { duration: 4000 },
      );
    } else {
      this.snackBar.open(`${failures} of ${count} reassignments failed.`, 'Dismiss', { duration: 5000 });
    }
  }
}
