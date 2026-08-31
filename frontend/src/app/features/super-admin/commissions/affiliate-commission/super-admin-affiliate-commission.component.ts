import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { Affiliate } from '../../data/models/commission.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';

/**
 * Affiliate Commission — real affiliate data (Phase 8), backed by
 * GET super-admin/affiliates via CommissionDataProvider. No tiers in v1
 * (locked decision), so there's no tier filter/column here.
 */
@Component({
  selector: 'app-super-admin-affiliate-commission',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-affiliate-commission.component.html',
  styleUrl: './super-admin-affiliate-commission.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAffiliateCommissionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commissionData = inject(CommissionDataProvider);

  protected readonly rows = this.commissionData.affiliates;
  protected readonly loading = this.commissionData.affiliatesLoading;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    if (!search) {
      return this.rows();
    }

    return this.rows().filter(
      (row) =>
        row.user.name.toLowerCase().includes(search) ||
        row.user.email.toLowerCase().includes(search) ||
        row.referral_code.toLowerCase().includes(search),
    );
  });

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const totalReferrals = rows.reduce((sum, row) => sum + (row.referral_count ?? 0), 0);
    const totalConversions = rows.reduce((sum, row) => sum + (row.converted_count ?? 0), 0);
    const totalEarned = rows.reduce((sum, row) => sum + (row.commission_accrued ?? 0), 0);
    const conversionRate = totalReferrals ? Math.round((totalConversions / totalReferrals) * 1000) / 10 : 0;

    return {
      totalAffiliates: rows.length,
      totalReferrals,
      totalEarned,
      conversionRate,
    };
  });

  /**
   * Email and referral code move into the name cell's secondary line
   * (same pattern as UserRoleTableComponent's avatar+name cell, mirrored
   * on the sibling Connector Commission page) rather than their own
   * columns — presentation only, values are unchanged and still exported
   * in full via `export()` below.
   */
  protected readonly columns: TableColumn<Affiliate>[] = [
    { key: 'name', label: 'Affiliate', formatter: (row) => row.user.name },
    { key: 'referrals', label: 'Referrals', formatter: (row) => String(row.referral_count ?? 0), align: 'right' },
    {
      key: 'conversions',
      label: 'Conversions',
      formatter: (row) => String(row.converted_count ?? 0),
      align: 'right',
    },
    { key: 'rate', label: 'Commission Rate', align: 'right' },
    { key: 'earned', label: 'Commission Earned', align: 'right' },
    { key: 'status', label: 'Status' },
  ];

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected export(): void {
    exportToCsv(
      'affiliate-commission',
      this.filteredRows().map((row) => ({
        affiliate: row.user.name,
        email: row.user.email,
        referral_code: row.referral_code,
        referrals: row.referral_count ?? 0,
        conversions: row.converted_count ?? 0,
        commission_rate_pct: row.commission_rate ?? '',
        commission_earned: row.commission_accrued ?? 0,
        commission_paid: row.commission_paid ?? 0,
        status: row.status,
        joined_at: row.joined_at ?? '',
      })),
    );
  }
}
