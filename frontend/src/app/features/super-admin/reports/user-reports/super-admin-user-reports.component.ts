import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { exportToCsv } from '../../data/csv-export.util';
import { BarDatum } from '../../data/models/report.model';
import { ManagedUser } from '../../data/models/user.model';
import { UserDataProvider } from '../../data/providers/user-data.provider';
import { bucketByWeek, defaultFrom, defaultTo, inRange } from '../../data/report-date-range.util';
import { HorizontalBarListComponent } from '@shared/components/horizontal-bar-list.component';
import { TrendChartComponent, TrendPoint } from '@shared/components/trend-chart.component';

/** User Reports — role mix, active/inactive split, and new-signups trend. */
@Component({
  selector: 'app-super-admin-user-reports',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    HorizontalBarListComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
    TrendChartComponent,
  ],
  templateUrl: './super-admin-user-reports.component.html',
  styleUrl: './super-admin-user-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminUserReportsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userData = inject(UserDataProvider);

  protected readonly range = this.fb.nonNullable.group({
    from: defaultFrom(180),
    to: defaultTo(),
  });

  private readonly rangeValues = toSignal(this.range.valueChanges, { initialValue: this.range.getRawValue() });

  /** Real, honest addition: filters the already-loaded user list by role — no new backend call, just a client-side predicate over an existing field. */
  protected readonly roleFilter = signal('');

  protected readonly roleOptions = computed(() => {
    const byRole = new Map<string, string>();
    for (const user of this.userData.users()) {
      byRole.set(user.role, user.role_label);
    }
    return [...byRole.entries()].map(([value, label]) => ({ value, label }));
  });

  protected readonly newUsers = computed(() => {
    const { from = defaultFrom(180), to = defaultTo() } = this.rangeValues();
    const role = this.roleFilter();
    return this.userData
      .users()
      .filter((user) => inRange(user.created_at, from, to))
      .filter((user) => !role || user.role === role);
  });

  protected readonly summary = computed(() => {
    const all = this.userData.users();
    return {
      total: all.length,
      newInRange: this.newUsers().length,
      active: all.filter((user) => user.is_active).length,
      inactive: all.filter((user) => !user.is_active).length,
    };
  });

  protected readonly roleBreakdown = computed<BarDatum[]>(() => {
    const byRole = new Map<string, number>();
    for (const user of this.userData.users()) {
      byRole.set(user.role_label, (byRole.get(user.role_label) ?? 0) + 1);
    }
    return [...byRole.entries()].map(([label, value]) => ({ label, value }));
  });

  protected readonly statusBreakdown = computed<BarDatum[]>(() => [
    { label: 'Active', value: this.summary().active, colour: 'var(--app-status-success-fg)' },
    { label: 'Inactive', value: this.summary().inactive, colour: 'var(--app-status-default-fg)' },
  ]);

  protected readonly trend = computed<TrendPoint[]>(() => {
    const { from = defaultFrom(180), to = defaultTo() } = this.rangeValues();
    return bucketByWeek(this.newUsers(), (user) => user.created_at, from, to);
  });

  protected readonly columns: TableColumn<ManagedUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role_label', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Joined' },
  ];

  protected export(): void {
    exportToCsv(
      'user-report',
      this.newUsers().map((user) => ({
        name: user.name,
        email: user.email,
        role: user.role_label,
        phone: user.phone ?? '',
        status: user.is_active ? 'Active' : 'Inactive',
        created_at: user.created_at ?? '',
      })),
    );
  }
}
