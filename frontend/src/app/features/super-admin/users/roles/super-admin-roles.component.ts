import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { PermissionMatrix } from '@core/models/permission.model';
import { ROLE_LABELS, UserRole } from '@core/models/user.model';
import { PermissionService } from '@core/services/permission.service';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { PERMISSION_MODULES } from '../../data/models/role.model';
import { UserDataProvider } from '../../data/providers/user-data.provider';
import { UserRoleTabsComponent } from '../user-role-tabs/user-role-tabs.component';

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  super_admin: 'Full platform access — every module, every action.',
  manager: 'Oversees Relationship Managers and Employees within their branch.',
  relationship_manager: 'Manages Employees and Connectors assigned to them; owns lead assignment within their team.',
  employee: 'Works assigned leads day to day; read-only elsewhere.',
  connector: 'Independent referral partner; submits and tracks their own leads and commission.',
  banker: 'Publishes bank criteria, reviews matched leads, manages documents for assigned cases.',
  telecaller: 'Runs the pre-disbursement (PD) verification call queue for their department.',
  affiliate: 'Self-service referral partner; tracks referral leads and commission payouts.',
  accounts: 'Finance/reconciliation staff; reviews disbursements, commission liability and the payout queue across every connector and affiliate.',
};

interface RoleRow {
  value: UserRole;
  label: string;
  description: string;
  userCount: number;
  moduleCount: number;
  totalModules: number;
}

/**
 * Role Management — the real 8-role system (`permission:` middleware,
 * RolePermissionSeeder, Phase 0). Module-access counts come from the live
 * permissions matrix; user counts still read the (not yet migrated in this
 * phase) Users mock provider.
 *
 * Table only — there is no "create role" capability anywhere in the app
 * (roles are seeded, not authored through the UI), so the mockup's
 * "+ Add role" affordance is rendered disabled rather than wired to a
 * destination that doesn't exist. Both row actions (view/edit) route to the
 * same real permissions-matrix page: `SuperAdminPermissionsComponent` has no
 * read-only mode, so a distinct "view" destination would have to be
 * invented — duplicating the one real affordance is the honest choice.
 */
@Component({
  selector: 'app-super-admin-roles',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, TableComponent, UserRoleTabsComponent],
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

  protected readonly columns: TableColumn<RoleRow>[] = [
    { key: 'label', label: 'Role' },
    { key: 'description', label: 'Description' },
    {
      key: 'users',
      label: 'Users',
      formatter: (row) => `${row.userCount} user${row.userCount === 1 ? '' : 's'}`,
    },
  ];

  protected readonly roles = computed<RoleRow[]>(() => {
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
