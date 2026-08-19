import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import {
  EXTENDED_ROLE_DESCRIPTIONS,
  EXTENDED_ROLE_LABELS,
  EXTENDED_ROLES,
  ExtendedRole,
  ROLE_HAS_LIVE_USERS,
} from '../../data/models/role.model';
import { UserRole } from '../../data/models/user.model';
import { PermissionDataProvider } from '../../data/providers/permission-data.provider';
import { UserDataProvider } from '../../data/providers/user-data.provider';

const ROLE_ICON: Record<ExtendedRole, string> = {
  super_admin: 'admin_panel_settings',
  manager: 'supervisor_account',
  relationship_manager: 'support_agent',
  employee: 'badge',
  connector: 'hub',
  banker: 'account_balance',
  accounts: 'account_balance_wallet',
  support: 'headset_mic',
};

/** Role Management — the eight-role system (mock), read + navigate to permission assignment. No HTTP. */
@Component({
  selector: 'app-super-admin-roles',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, PageHeaderComponent, StatusPillComponent],
  templateUrl: './super-admin-roles.component.html',
  styleUrl: './super-admin-roles.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminRolesComponent {
  private readonly userData = inject(UserDataProvider);
  private readonly permissionData = inject(PermissionDataProvider);

  protected readonly roles = computed(() =>
    EXTENDED_ROLES.map((role) => ({
      value: role,
      label: EXTENDED_ROLE_LABELS[role],
      description: EXTENDED_ROLE_DESCRIPTIONS[role],
      icon: ROLE_ICON[role],
      hasLiveUsers: ROLE_HAS_LIVE_USERS[role],
      userCount: ROLE_HAS_LIVE_USERS[role] ? this.userData.byRole(role as UserRole).length : null,
      moduleCount: this.permissionData.visibleModulesFor(role).length,
      totalModules: this.permissionData.modules.length,
    })),
  );
}
