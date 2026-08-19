import { Injectable, inject, signal } from '@angular/core';

import {
  ExtendedRole,
  EXTENDED_ROLE_LABELS,
  EXTENDED_ROLES,
  PERMISSION_ACTION_LABELS,
  PERMISSION_MODULES,
  PermissionAction,
  PermissionModuleConfig,
} from '../models/role.model';
import { AuditLogDataProvider } from './audit-log-data.provider';

type AccessLevel = 'none' | 'view' | 'manage';

/** Default access level per role per module — the seed the permission matrix starts from. */
const ROLE_MODULE_ACCESS: Record<ExtendedRole, Record<string, AccessLevel>> = {
  super_admin: { dashboard: 'view', users: 'manage', leads: 'manage', banking: 'manage', commissions: 'manage', reports: 'view', notifications: 'manage', audit_logs: 'view', settings: 'manage' },
  manager: { dashboard: 'view', users: 'manage', leads: 'manage', banking: 'view', commissions: 'view', reports: 'view', notifications: 'view', audit_logs: 'none', settings: 'none' },
  relationship_manager: { dashboard: 'view', users: 'manage', leads: 'manage', banking: 'none', commissions: 'none', reports: 'view', notifications: 'view', audit_logs: 'none', settings: 'none' },
  employee: { dashboard: 'view', users: 'none', leads: 'view', banking: 'none', commissions: 'none', reports: 'none', notifications: 'view', audit_logs: 'none', settings: 'none' },
  connector: { dashboard: 'none', users: 'none', leads: 'view', banking: 'none', commissions: 'view', reports: 'none', notifications: 'view', audit_logs: 'none', settings: 'none' },
  banker: { dashboard: 'none', users: 'none', leads: 'view', banking: 'manage', commissions: 'none', reports: 'none', notifications: 'view', audit_logs: 'none', settings: 'none' },
  accounts: { dashboard: 'view', users: 'none', leads: 'view', banking: 'view', commissions: 'manage', reports: 'view', notifications: 'view', audit_logs: 'view', settings: 'none' },
  support: { dashboard: 'view', users: 'view', leads: 'view', banking: 'none', commissions: 'none', reports: 'none', notifications: 'manage', audit_logs: 'view', settings: 'none' },
};

function expandAccess(level: AccessLevel, applicable: PermissionAction[]): PermissionAction[] {
  if (level === 'none') return [];
  if (level === 'view') return applicable.includes('view') ? ['view'] : [];
  return [...applicable];
}

function buildSeedMatrix(): Record<ExtendedRole, Record<string, PermissionAction[]>> {
  const matrix = {} as Record<ExtendedRole, Record<string, PermissionAction[]>>;

  for (const role of EXTENDED_ROLES) {
    const perModule: Record<string, PermissionAction[]> = {};
    for (const module of PERMISSION_MODULES) {
      perModule[module.key] = expandAccess(ROLE_MODULE_ACCESS[role][module.key], module.actions);
    }
    matrix[role] = perModule;
  }

  return matrix;
}

/**
 * Centralized state for the mock permission matrix — eight roles × nine
 * modules × applicable actions. Menu visibility and the route-protection
 * reference table are both *derived* from this same matrix rather than
 * configured separately, so there's one source of truth, not two that can
 * drift apart.
 */
@Injectable({ providedIn: 'root' })
export class PermissionDataProvider {
  private readonly auditLog = inject(AuditLogDataProvider);

  private readonly _matrix = signal(buildSeedMatrix());

  readonly matrix = this._matrix.asReadonly();

  readonly modules: PermissionModuleConfig[] = PERMISSION_MODULES;

  actionsFor(role: ExtendedRole, moduleKey: string): PermissionAction[] {
    return this._matrix()[role][moduleKey] ?? [];
  }

  hasAction(role: ExtendedRole, moduleKey: string, action: PermissionAction): boolean {
    return this.actionsFor(role, moduleKey).includes(action);
  }

  setAction(role: ExtendedRole, moduleKey: string, action: PermissionAction, granted: boolean): void {
    this._matrix.update((current) => {
      const roleMatrix = current[role];
      const existing = roleMatrix[moduleKey] ?? [];
      const updated = granted ? [...new Set([...existing, action])] : existing.filter((a) => a !== action);

      return {
        ...current,
        [role]: { ...roleMatrix, [moduleKey]: updated },
      };
    });

    const moduleLabel = this.modules.find((module) => module.key === moduleKey)?.label ?? moduleKey;
    const roleLabel = EXTENDED_ROLE_LABELS[role];
    const actionLabel = PERMISSION_ACTION_LABELS[action];

    this.auditLog.record({
      action: granted ? 'granted' : 'revoked',
      entity_type: 'Permission',
      entity_label: `${roleLabel} · ${moduleLabel}`,
      description: `${granted ? 'Granted' : 'Revoked'} "${actionLabel}" on ${moduleLabel} for ${roleLabel}.`,
      category: 'permission_change',
    });
  }

  /**
   * Modules this role has any access to at all — the menu-visibility rule.
   * Reads the `matrix` signal, so call this from inside a caller's own
   * `computed()` to stay reactive to edits made on the Permission
   * Assignment page.
   */
  visibleModulesFor(role: ExtendedRole): PermissionModuleConfig[] {
    const roleMatrix = this._matrix()[role];
    return this.modules.filter((module) => (roleMatrix[module.key] ?? []).length > 0);
  }
}
