import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CatalogueOption, Lead, labelFromOptions, PaginationMeta, UserSummary } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableComponent } from '@shared/components/table.component';

import { LeadViewDialogComponent } from '../view-dialog/lead-view-dialog.component';

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

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './lead-list.component.html',
  styleUrl: './lead-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadListComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  /** Telecallers work leads assigned to them; they don't create new ones. */
  readonly canCreateLead = !this.auth.hasRole('telecaller');

  readonly canViewSource = this.auth.hasRole('super_admin', 'manager', 'relationship_manager');
  readonly tableColumns = computed(() => [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant', label: 'Applicant' },
    ...(this.canViewSource ? [{ key: 'source', label: 'Source' }] : []),
    { key: 'loan', label: 'Loan' },
    { key: 'assignee', label: 'Assigned to' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ]);

  readonly rows = signal<Lead[]>([]);
  readonly meta = signal<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  readonly statuses = signal<CatalogueOption[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly employmentTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
    loan_type: '',
  });

  private pageSize = 15;

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.statuses.set(metadata.statuses);
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
      error: () => undefined,
    });

    const searchFromUrl = this.route.snapshot.queryParamMap.get('search');
    if (searchFromUrl) {
      this.filters.patchValue({ search: searchFromUrl });
    }

    this.load(0);
  }

  load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leads
      .list({
        ...this.filters.getRawValue(),
        page: pageIndex + 1,
        per_page: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.meta.set({
            current_page: result.meta?.current_page ?? 1,
            per_page: result.meta?.per_page ?? this.pageSize,
            total: result.meta?.total ?? result.items.length,
            last_page: result.meta?.last_page ?? 1,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex);
  }

  /** Who this lead came from — the connector if one is attached, else whoever created it, else organic. */
  sourcePerson(row: Lead): UserSummary | null {
    return row.connector ?? row.created_by ?? null;
  }

  sourceLabel(row: Lead): string {
    const person = this.sourcePerson(row);
    if (!person) {
      return '—';
    }
    const prefix = SOURCE_PREFIX[person.role] ?? person.role;
    return `${prefix}-${person.name}`;
  }

  sourceTooltip(row: Lead): string {
    const person = this.sourcePerson(row);
    if (!person) {
      return 'No source recorded — organic/direct lead.';
    }
    return [
      `Name - ${person.name}`,
      `Email - ${person.email}`,
      `Mob - ${person.phone ?? '—'}`,
      `Source - ${ROLE_LABEL[person.role] ?? person.role}`,
    ].join('\n');
  }

  /** Opens the Tidewater "Lead summary" quick-view dialog for a row without navigating away from the list. */
  openQuickView(row: Lead): void {
    this.dialog.open(LeadViewDialogComponent, {
      data: {
        lead: row,
        loanTypeLabel: labelFromOptions(this.loanTypes(), row.loan_type),
        employmentTypeLabel: labelFromOptions(this.employmentTypes(), row.employment_type),
      },
    });
  }
}
