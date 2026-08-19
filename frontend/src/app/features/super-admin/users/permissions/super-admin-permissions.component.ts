import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import {
  EXTENDED_ROLE_LABELS,
  EXTENDED_ROLES,
  ExtendedRole,
  PERMISSION_ACTION_LABELS,
  PermissionAction,
} from '../../data/models/role.model';
import { PermissionDataProvider } from '../../data/providers/permission-data.provider';

/**
 * Permission Assignment — the eight-role × nine-module matrix. Toggling a
 * checkbox mutates `PermissionDataProvider` immediately (same pattern as
 * every other mock toggle in this module — Bank Criteria's
 * activate/deactivate, Payouts' mark-as-paid), not a separate save step.
 * Menu visibility and the route-protection reference below are both
 * *derived* from the same matrix, not configured independently.
 */
@Component({
  selector: 'app-super-admin-permissions',
  standalone: true,
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatSelectModule, PageHeaderComponent],
  templateUrl: './super-admin-permissions.component.html',
  styleUrl: './super-admin-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminPermissionsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly permissionData = inject(PermissionDataProvider);

  protected readonly roles = EXTENDED_ROLES;
  protected readonly roleLabel = EXTENDED_ROLE_LABELS;
  protected readonly actionLabel = PERMISSION_ACTION_LABELS;
  protected readonly allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete'];
  protected readonly modules = this.permissionData.modules;

  protected readonly selectedRole = signal<ExtendedRole>(this.initialRole());

  protected readonly visibleModules = computed(() => this.permissionData.visibleModulesFor(this.selectedRole()));
  protected readonly visibleModuleKeys = computed(() => new Set(this.visibleModules().map((module) => module.key)));

  private initialRole(): ExtendedRole {
    const fromQuery = this.route.snapshot.queryParamMap.get('role') as ExtendedRole | null;
    return fromQuery && EXTENDED_ROLES.includes(fromQuery) ? fromQuery : 'super_admin';
  }

  protected isApplicable(moduleKey: string, action: PermissionAction): boolean {
    return this.modules.find((module) => module.key === moduleKey)?.actions.includes(action) ?? false;
  }

  protected isChecked(moduleKey: string, action: PermissionAction): boolean {
    return this.permissionData.hasAction(this.selectedRole(), moduleKey, action);
  }

  protected toggle(moduleKey: string, action: PermissionAction, checked: boolean): void {
    const role = this.selectedRole();
    this.permissionData.setAction(role, moduleKey, action, checked);
    this.snackBar.open(
      `${this.actionLabel[action]} on "${moduleKey}" ${checked ? 'granted to' : 'revoked from'} ${this.roleLabel[role]}.`,
      'Dismiss',
      { duration: 3000 },
    );
  }
}
