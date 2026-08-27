import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { PermissionMatrix } from '@core/models/permission.model';
import { ROLE_LABELS, UserRole } from '@core/models/user.model';
import { PermissionService } from '@core/services/permission.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { PERMISSION_MODULES } from '../../data/models/role.model';
import { UserDataProvider } from '../../data/providers/user-data.provider';

const ROLE_ICON: Record<UserRole, string> = {
  super_admin: 'admin_panel_settings',
  manager: 'supervisor_account',
  relationship_manager: 'support_agent',
  employee: 'badge',
  connector: 'hub',
  banker: 'account_balance',
  telecaller: 'call',
  affiliate: 'storefront',
};

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  super_admin: 'Full platform access — every module, every action.',
  manager: 'Oversees Relationship Managers and Employees within their branch.',
  relationship_manager: 'Manages Employees and Connectors assigned to them; owns lead assignment within their team.',
  employee: 'Works assigned leads day to day; read-only elsewhere.',
  connector: 'Independent referral partner; submits and tracks their own leads and commission.',
  banker: 'Publishes bank criteria, reviews matched leads, manages documents for assigned cases.',
  telecaller: 'Runs the pre-disbursement (PD) verification call queue for their department.',
  affiliate: 'Self-service referral partner; tracks referral leads and commission payouts.',
};

/**
 * Role Management — the real 8-role system (`permission:` middleware,
 * RolePermissionSeeder, Phase 0). Module-access counts come from the live
 * permissions matrix; user counts still read the (not yet migrated in this
 * phase) Users mock provider.
 */
@Component({
  selector: 'app-super-admin-roles',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, PageHeaderComponent, StatusPillComponent],
  templateUrl: './super-admin-roles.component.html',
  styleUrl: './super-admin-roles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminRolesComponent implements OnInit {
  private readonly userData = inject(UserDataProvider);
  private readonly permissionService = inject(PermissionService);

  protected readonly roleLabel = ROLE_LABELS;
  protected readonly loading = signal(true);
  protected readonly matrix = signal<PermissionMatrix | null>(null);
  protected readonly totalModules = PERMISSION_MODULES.length;

  protected readonly roles = computed(() => {
    const matrix = this.matrix();
    if (!matrix) {
      return [];
    }

    return matrix.roles.map((role) => {
      const slug = role.slug as UserRole;
      const grants = matrix.grants[role.slug] ?? {};
      const moduleCount = Object.values(grants).filter((actions) => actions.length > 0).length;

      return {
        value: slug,
        label: role.name,
        description: ROLE_DESCRIPTION[slug] ?? '',
        icon: ROLE_ICON[slug] ?? 'badge',
        userCount: this.userData.byRole(slug).length,
        moduleCount,
        totalModules: this.totalModules,
      };
    });
  });

  ngOnInit(): void {
    this.permissionService.matrix().subscribe({
      next: (matrix) => {
        this.matrix.set(matrix);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
