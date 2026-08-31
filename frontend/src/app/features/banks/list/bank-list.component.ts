import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BankCriteria } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { BankService } from '@core/services/bank.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import {
  BankerCriteriaDialogComponent,
  BankerCriteriaDialogData,
} from '../../banker/criteria/criteria-dialog/banker-criteria-dialog.component';

export interface BankGroup {
  bankName: string;
  products: BankCriteria[];
  productCount: number;
  avgTicketSize: number;
  active: boolean;
}

/**
 * Banks — the shared `/banks` route, visible to every role that can see
 * lending products (Super Admin sees every bank; a Banker's own rows are
 * scoped server-side same as everywhere else). Presents the real
 * `BankCriteria[]` grouped by bank name (a client-side aggregation over
 * real rows — the API has no separate "Bank" entity, so "Bank" here is a
 * derived grouping, not a fabricated one) and reuses
 * `BankerCriteriaDialogComponent` for create/edit instead of duplicating
 * that form inline.
 */
@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusPillComponent,
  ],
  templateUrl: './bank-list.component.html',
  styleUrl: './bank-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankListComponent implements OnInit {
  private readonly banks = inject(BankService);
  private readonly leads = inject(LeadService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly rows = signal<BankCriteria[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly employmentTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expandedBank = signal<string | null>(null);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
  });

  private readonly appliedSearch = signal('');
  private readonly appliedStatus = signal('');

  readonly groups = computed<BankGroup[]>(() => {
    const search = this.appliedSearch().trim().toLowerCase();
    const status = this.appliedStatus();

    const byBank = new Map<string, BankCriteria[]>();
    for (const row of this.rows()) {
      const key = row.bank_name;
      const list = byBank.get(key) ?? [];
      list.push(row);
      byBank.set(key, list);
    }

    return [...byBank.entries()]
      .map(([bankName, products]): BankGroup => {
        // Per-product ticket = midpoint of its own min/max range; the bank's
        // "avg. ticket size" is the mean of those midpoints across its
        // products — real numbers derived from real rows, not invented.
        const midpoints = products.map((p) => (p.min_loan_amount + (p.max_loan_amount ?? p.min_loan_amount)) / 2);
        const avgTicketSize = midpoints.reduce((sum, m) => sum + m, 0) / midpoints.length;
        return {
          bankName,
          products,
          productCount: products.length,
          avgTicketSize,
          active: products.some((p) => p.is_active),
        };
      })
      .filter((group) => {
        if (search && !group.bankName.toLowerCase().includes(search)) {
          return false;
        }
        if (status === 'active' && !group.active) {
          return false;
        }
        if (status === 'inactive' && group.active) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.bankName.localeCompare(b.bankName));
  });

  canManage(): boolean {
    return this.auth.hasRole('super_admin', 'banker');
  }

  isMine(row: BankCriteria): boolean {
    return this.auth.hasRole('banker') && row.banker_id === this.auth.user()?.id;
  }

  /** Super Admin can toggle any row; a Banker can only toggle their own. */
  canToggle(row: BankCriteria): boolean {
    return this.auth.hasRole('super_admin') || this.isMine(row);
  }

  ngOnInit(): void {
    this.load();
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
      error: () => undefined,
    });
  }

  load(): void {
    this.loading.set(true);
    this.banks.list({ per_page: 50 }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Bank criteria could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    const raw = this.filters.getRawValue();
    this.appliedSearch.set(raw.search);
    this.appliedStatus.set(raw.status);
  }

  toggleExpanded(bankName: string): void {
    this.expandedBank.set(this.expandedBank() === bankName ? null : bankName);
  }

  openCreate(): void {
    this.openDialog(null);
  }

  editProduct(row: BankCriteria): void {
    this.openDialog(row);
  }

  toggle(row: BankCriteria): void {
    this.banks.update(row.id, { is_active: !row.is_active }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('The bank product could not be updated.'),
    });
  }

  private openDialog(criteria: BankCriteria | null): void {
    this.dialog
      .open(BankerCriteriaDialogComponent, {
        data: {
          criteria,
          loanTypes: this.loanTypes(),
          employmentTypes: this.employmentTypes(),
        } satisfies BankerCriteriaDialogData,
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) {
          return;
        }

        const request = criteria ? this.banks.update(criteria.id, payload) : this.banks.create(payload);
        request.subscribe({
          next: () => {
            this.snackBar.open(criteria ? 'Criteria updated.' : 'Criteria added.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: () => this.snackBar.open('The bank product could not be saved.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
