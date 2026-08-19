import { DatePipe } from '@angular/common';
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
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { AUDIT_EVENT_CATEGORY_LABEL, AuditEventCategory, AuditLogEntry } from '../data/models/audit-log.model';
import { AuditLogDataProvider } from '../data/providers/audit-log-data.provider';
import { defaultFrom, defaultTo, inRange } from '../data/report-date-range.util';

/** Audit log table — every recorded platform action, mock data only, no HTTP. */
@Component({
  selector: 'app-super-admin-audit-logs',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-audit-logs.component.html',
  styleUrl: './super-admin-audit-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAuditLogsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auditLogData = inject(AuditLogDataProvider);

  protected readonly entityTypes = this.auditLogData.entityTypes;
  protected readonly categoryLabel = AUDIT_EVENT_CATEGORY_LABEL;
  protected readonly categories = Object.entries(AUDIT_EVENT_CATEGORY_LABEL) as [AuditEventCategory, string][];
  protected readonly rows = this.auditLogData.entries;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    entityType: '',
    category: '',
    from: defaultFrom(365),
    to: defaultTo(),
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, { initialValue: this.filters.getRawValue() });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(15);

  protected readonly filteredRows = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();
    const from = f.from ?? defaultFrom(365);
    const to = f.to ?? defaultTo();

    return this.rows().filter((entry) => {
      const matchesSearch =
        !search ||
        entry.actor_name.toLowerCase().includes(search) ||
        entry.entity_label.toLowerCase().includes(search) ||
        entry.description.toLowerCase().includes(search);
      const matchesType = !f.entityType || entry.entity_type === f.entityType;
      const matchesCategory = !f.category || entry.category === f.category;
      const matchesRange = inRange(entry.timestamp, from, to);
      return matchesSearch && matchesType && matchesCategory && matchesRange;
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected readonly columns: TableColumn<AuditLogEntry>[] = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'actor', label: 'Actor' },
    { key: 'category', label: 'Event type' },
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'description', label: 'Description' },
    { key: 'ip_address', label: 'IP address' },
  ];

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected categoryLabelFor(entry: AuditLogEntry): string {
    return this.categoryLabel[entry.category];
  }
}
