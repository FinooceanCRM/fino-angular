import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { ManagedUser } from '@features/super-admin/data/models/user.model';

import { ManagerBankerDataProvider } from '../data/manager-banker.provider';

/** Banker List — read-only platform banker directory (account management stays with Super Admin). */
@Component({
  selector: 'app-manager-banker-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-banker-list.component.html',
  styleUrl: './manager-banker-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerBankerListComponent {
  protected readonly bankers = inject(ManagerBankerDataProvider);

  private readonly fb = inject(FormBuilder);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.bankers.bankers().filter((row) => {
      const matchesSearch =
        !search || row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search);
      const matchesStatus = !f.status || (f.status === 'active' ? row.is_active : !row.is_active);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected readonly columns: TableColumn<ManagedUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'bank', label: 'Bank' },
    { key: 'phone', label: 'Phone', formatter: (row) => row.phone ?? '—' },
    { key: 'status', label: 'Status' },
  ];

  protected applyFilters(): void {
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
