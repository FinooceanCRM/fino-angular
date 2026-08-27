import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AUDIT_EVENT_CATEGORY_ICON, AUDIT_EVENT_CATEGORY_LABEL, AuditLogEntry } from '@core/models/audit-log.model';
import { AuditLogService } from '@core/services/audit-log.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

interface RelatedLink {
  label: string;
  route: string[];
}

/**
 * `/super-admin/audit-logs/:id` — full detail for one audit trail entry.
 *
 * The "view related record" link now routes by `entity_type` + the real
 * `entity_id` the backend carries on every row, rather than matching
 * `entity_label` text against the (separate, not-yet-migrated) Lead/User
 * mock providers — a real id beats a fragile label match, and it drops the
 * cross-provider dependency this page had for Phase 0's own scope.
 */
@Component({
  selector: 'app-super-admin-audit-log-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './super-admin-audit-log-detail.component.html',
  styleUrl: './super-admin-audit-log-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAuditLogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auditLogs = inject(AuditLogService);

  protected readonly categoryLabel = AUDIT_EVENT_CATEGORY_LABEL;
  protected readonly categoryIcon = AUDIT_EVENT_CATEGORY_ICON;

  protected readonly loading = signal(false);
  protected readonly entry = signal<AuditLogEntry | null>(null);
  protected readonly notFound = signal(false);

  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  protected readonly relatedLink = computed<RelatedLink | null>(() => {
    const entry = this.entry();
    if (!entry || entry.entity_id === null) {
      return null;
    }

    if (entry.entity_type === 'Lead') {
      return { label: `View lead ${entry.entity_label}`, route: ['/super-admin/leads', String(entry.entity_id)] };
    }

    return null;
  });

  ngOnInit(): void {
    const id = Number(this.params().get('id'));
    this.load(id);
  }

  private load(id: number): void {
    this.loading.set(true);
    this.notFound.set(false);

    this.auditLogs.detail(id).subscribe({
      next: (entry) => {
        this.entry.set(entry);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }
}
