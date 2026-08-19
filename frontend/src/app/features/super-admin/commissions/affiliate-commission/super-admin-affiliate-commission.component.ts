import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { Affiliate } from '../../data/models/commission.model';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';

/** Affiliate Commission — separate referral/marketing program from the Connector role, mock data only. */
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
    MatSelectModule,
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

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    tier: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.rows().filter((row) => {
      const matchesSearch =
        !search ||
        row.name.toLowerCase().includes(search) ||
        row.email.toLowerCase().includes(search) ||
        row.referral_code.toLowerCase().includes(search);
      const matchesTier = !f.tier || row.tier === f.tier;
      return matchesSearch && matchesTier;
    });
  });

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const totalReferrals = rows.reduce((sum, row) => sum + row.referrals, 0);
    const totalConversions = rows.reduce((sum, row) => sum + row.conversions, 0);
    const totalEarned = rows.reduce((sum, row) => sum + row.commission_earned, 0);
    const conversionRate = totalReferrals ? Math.round((totalConversions / totalReferrals) * 1000) / 10 : 0;

    return {
      totalAffiliates: rows.length,
      totalReferrals,
      totalEarned,
      conversionRate,
    };
  });

  protected readonly columns: TableColumn<Affiliate>[] = [
    { key: 'name', label: 'Affiliate' },
    { key: 'referral_code', label: 'Code' },
    { key: 'tier', label: 'Tier' },
    { key: 'referrals', label: 'Referrals' },
    { key: 'conversions', label: 'Conversions' },
    { key: 'earned', label: 'Commission' },
    { key: 'status', label: 'Status' },
  ];

  protected export(): void {
    exportToCsv(
      'affiliate-commission',
      this.filteredRows().map((row) => ({
        affiliate: row.name,
        email: row.email,
        referral_code: row.referral_code,
        tier: row.tier,
        referrals: row.referrals,
        conversions: row.conversions,
        commission_rate_pct: row.commission_rate,
        commission_earned: row.commission_earned,
        commission_paid: row.commission_paid,
        status: row.status,
        joined_at: row.joined_at,
      })),
    );
  }
}
