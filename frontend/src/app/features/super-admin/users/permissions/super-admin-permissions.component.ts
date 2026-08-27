import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { PERMISSION_ACTION_LABELS, PermissionAction, PermissionMatrix } from '@core/models/permission.model';
import { ROLE_LABELS, UserRole } from '@core/models/user.model';
import { PermissionService } from '@core/services/permission.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { PERMISSION_MODULES, PermissionModuleConfig } from '../../data/models/role.model';

/**
 * Permission Assignment — real roles × real permissions, served by
 * `GET /permissions/matrix` (Phase 0). Toggling a checkbox calls
 * `PUT /permissions/{role}/{module}/{action}` immediately (same pattern as
 * every other mutating toggle in this module), not a separate save step.
 * `PERMISSION_MODULES` (icon/route) stays a static frontend config — its
 * keys/actions are defined to match the backend's module catalogue exactly.
 */
@Component({
  selector: 'app-super-admin-permissions',
  standalone: true,
  imports: [FormsModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatProgressBarModule, MatSelectModule, PageHeaderComponent],
  templateUrl: './super-admin-permissions.component.html',
  styleUrl: './super-admin-permissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminPermissionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly permissionService = inject(PermissionService);

  protected readonly roleLabel = ROLE_LABELS;
  protected readonly actionLabel = PERMISSION_ACTION_LABELS;
  protected readonly allActions: PermissionAction[] = ['view', 'create', 'edit', 'delete'];
  protected readonly modules: PermissionModuleConfig[] = PERMISSION_MODULES;

  protected readonly loading = signal(true);
  protected readonly matrix = signal<PermissionMatrix | null>(null);
  protected readonly selectedRole = signal<UserRole | null>(null);

  protected readonly roleSlugs = computed(() => (this.matrix()?.roles ?? []).map((role) => role.slug as UserRole));

  protected readonly visibleModules = computed(() => {
    const role = this.selectedRole();
    const grants = role ? this.matrix()?.grants[role] : undefined;
    if (!grants) {
      return [] as PermissionModuleConfig[];
    }
    return this.modules.filter((module) => (grants[module.key] ?? []).length > 0);
  });

  protected readonly visibleModuleKeys = computed(() => new Set(this.visibleModules().map((module) => module.key)));

  ngOnInit(): void {
    this.load();
  }

  protected isApplicable(moduleKey: string, action: PermissionAction): boolean {
    return this.modules.find((module) => module.key === moduleKey)?.actions.includes(action) ?? false;
  }

  protected isChecked(moduleKey: string, action: PermissionAction): boolean {
    const role = this.selectedRole();
    if (!role) {
      return false;
    }
    return (this.matrix()?.grants[role]?.[moduleKey] ?? []).includes(action);
  }

  protected toggle(moduleKey: string, action: PermissionAction, checked: boolean): void {
    const role = this.selectedRole();
    if (!role) {
      return;
    }

    this.permissionService.update(role, moduleKey, action, checked).subscribe({
      next: (matrix) => {
        this.matrix.set(matrix);
        const moduleLabel = this.modules.find((module) => module.key === moduleKey)?.label ?? moduleKey;
        this.snackBar.open(
          `${this.actionLabel[action]} on "${moduleLabel}" ${checked ? 'granted to' : 'revoked from'} ${this.roleLabel[role]}.`,
          'Dismiss',
          { duration: 3000 },
        );
      },
      error: () => this.snackBar.open('The permission could not be updated.', 'Dismiss', { duration: 3000 }),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.permissionService.matrix().subscribe({
      next: (matrix) => {
        this.matrix.set(matrix);

        if (!this.selectedRole()) {
          const fromQuery = this.route.snapshot.queryParamMap.get('role');
          const slugs = matrix.roles.map((role) => role.slug);
          const initial = fromQuery && slugs.includes(fromQuery) ? fromQuery : slugs[0];
          this.selectedRole.set((initial as UserRole) ?? null);
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
