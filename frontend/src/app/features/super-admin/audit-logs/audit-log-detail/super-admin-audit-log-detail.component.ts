import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { AUDIT_EVENT_CATEGORY_ICON, AUDIT_EVENT_CATEGORY_LABEL } from '../../data/models/audit-log.model';
import { EXTENDED_ROLE_LABELS } from '../../data/models/role.model';
import { AuditLogDataProvider } from '../../data/providers/audit-log-data.provider';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';
import { UserDataProvider } from '../../data/providers/user-data.provider';

interface RelatedLink {
  label: string;
  route: string[];
  queryParams?: Record<string, string>;
}

const USER_LIST_SEGMENT: Record<string, string> = {
  manager: 'managers',
  relationship_manager: 'relationship-managers',
  employee: 'employees',
  connector: 'connectors',
  banker: 'bankers',
};

/** `/super-admin/audit-logs/:id` — full detail for one audit trail entry, with a link back to the affected record where one exists. */
@Component({
  selector: 'app-super-admin-audit-log-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './super-admin-audit-log-detail.component.html',
  styleUrl: './super-admin-audit-log-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminAuditLogDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auditLogData = inject(AuditLogDataProvider);
  private readonly leadData = inject(LeadDataProvider);
  private readonly userData = inject(UserDataProvider);

  protected readonly categoryLabel = AUDIT_EVENT_CATEGORY_LABEL;
  protected readonly categoryIcon = AUDIT_EVENT_CATEGORY_ICON;

  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  protected readonly entry = computed(() => {
    const id = Number(this.params().get('id'));
    return this.auditLogData.getById(id);
  });

  protected readonly relatedLink = computed<RelatedLink | null>(() => {
    const entry = this.entry();
    if (!entry) {
      return null;
    }

    if (entry.entity_type === 'Lead' || entry.entity_type === 'Banker Assignment') {
      const lead = this.leadData.leads().find((l) => l.reference === entry.entity_label);
      return lead ? { label: `View lead ${lead.reference}`, route: ['/super-admin/leads', String(lead.id)] } : null;
    }

    if (entry.entity_type === 'User') {
      const user = this.userData.users().find((u) => u.name === entry.entity_label);
      const segment = user ? USER_LIST_SEGMENT[user.role] : undefined;
      if (!user || !segment) {
        return null;
      }
      const userLink: RelatedLink = {
        label: `View ${user.name} in ${user.role_label}s`,
        route: ['/super-admin/users', segment],
        queryParams: { search: user.email },
      };
      return userLink;
    }

    if (entry.entity_type === 'Permission') {
      const roleKey = Object.entries(EXTENDED_ROLE_LABELS).find(([, label]) => entry.entity_label.startsWith(label))?.[0];
      if (!roleKey) {
        return null;
      }
      const permissionLink: RelatedLink = {
        label: 'View permission matrix',
        route: ['/super-admin/users/permissions'],
        queryParams: { role: roleKey },
      };
      return permissionLink;
    }

    return null;
  });
}
