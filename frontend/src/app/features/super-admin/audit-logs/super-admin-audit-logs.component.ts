import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { AUDIT_EVENT_CATEGORY_LABEL, AuditLogEntry } from '@core/models/audit-log.model';
import { AuditLogService } from '@core/services/audit-log.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/** Audit log table — real backend data, filters and pagination sent to the server (Phase 0). */
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
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-audit-logs.component.html',
  styleUrl: './super-admin-audit-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAuditLogsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auditLogs = inject(AuditLogService);

  protected readonly categoryLabel = AUDIT_EVENT_CATEGORY_LABEL;
  protected readonly categories = Object.entries(AUDIT_EVENT_CATEGORY_LABEL);

  protected readonly rows = signal<AuditLogEntry[]>([]);
  protected readonly entityTypes = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(15);

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    entityType: '',
    category: '',
    from: '',
    to: '',
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

  ngOnInit(): void {
    this.load(0);
  }

  protected load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    const f = this.filters.getRawValue();

    this.auditLogs
      .list({
        search: f.search || undefined,
        entity_type: f.entityType || undefined,
        category: f.category || undefined,
        from: f.from || undefined,
        to: f.to || undefined,
        page: pageIndex + 1,
        per_page: this.pageSize(),
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.entityTypes.set(result.meta.entity_types ?? []);
          this.total.set(result.meta.total ?? result.items.length);
          this.pageIndex.set((result.meta.current_page ?? 1) - 1);
          this.pageSize.set(result.meta.per_page ?? this.pageSize());
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Audit logs could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.load(event.pageIndex);
  }

  protected categoryLabelFor(entry: AuditLogEntry): string {
    return this.categoryLabel[entry.category] ?? entry.category;
  }
}
