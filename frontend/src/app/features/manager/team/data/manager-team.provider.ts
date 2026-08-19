import { Injectable, computed, inject } from '@angular/core';

import { AuditLogEntry } from '@features/super-admin/data/models/audit-log.model';
import { ManagedUser, UserRole } from '@features/super-admin/data/models/user.model';
import { AuditLogDataProvider } from '@features/super-admin/data/providers/audit-log-data.provider';
import {
  CreateUserHierarchy,
  UserDataProvider,
  UserUpsertPayload,
} from '@features/super-admin/data/providers/user-data.provider';

/** The signed-in manager for this mock module — the same "Rahul Mehta" (id 1) already seeded across the app's mock data. */
export const CURRENT_MANAGER_ID = 1;

export interface TeamPerformance {
  leadsHandled: number;
  approved: number;
  disbursed: number;
  conversionRatePct: number;
  avgTurnaroundDays: number;
}

/** Small deterministic hash so each person's performance numbers are stable across renders without any stored state. */
function performanceFor(userId: number): TeamPerformance {
  const leadsHandled = 10 + ((userId * 37) % 23) + (userId % 5);
  const approvedRatio = 0.45 + ((userId * 13) % 30) / 100;
  const approved = Math.round(leadsHandled * approvedRatio);
  const disbursedRatio = 0.55 + ((userId * 7) % 25) / 100;
  const disbursed = Math.min(approved, Math.round(approved * disbursedRatio));
  const conversionRatePct = leadsHandled === 0 ? 0 : Math.round((approved / leadsHandled) * 100);
  const avgTurnaroundDays = 3 + (userId % 6);

  return { leadsHandled, approved, disbursed, conversionRatePct, avgTurnaroundDays };
}

/**
 * Manager-scoped view over the platform's shared `UserDataProvider` and
 * `AuditLogDataProvider` (the same mock stores Super Admin's Users and Audit
 * Logs pages read and write). No separate mock dataset — the Manager module
 * just filters the existing "Rahul Mehta" team by `manager_id` /
 * `relationship_manager_id`, so a create/edit/reassign here is immediately
 * visible on the Super Admin side too, and vice versa.
 */
@Injectable({ providedIn: 'root' })
export class ManagerTeamDataProvider {
  private readonly userData = inject(UserDataProvider);
  private readonly auditLog = inject(AuditLogDataProvider);

  readonly managerId = CURRENT_MANAGER_ID;
  readonly manager = computed(() => this.userData.getById(CURRENT_MANAGER_ID));

  readonly relationshipManagers = computed(() =>
    this.userData.users().filter((user) => user.role === 'relationship_manager' && user.manager_id === CURRENT_MANAGER_ID),
  );

  readonly employees = computed(() => {
    const rmIds = new Set(this.relationshipManagers().map((rm) => rm.id));
    return this.userData
      .users()
      .filter((user) => user.role === 'employee' && user.relationship_manager_id !== null && rmIds.has(user.relationship_manager_id));
  });

  getById(id: number): ManagedUser | undefined {
    return this.userData.getById(id);
  }

  employeesFor(relationshipManagerId: number): ManagedUser[] {
    return this.employees().filter((employee) => employee.relationship_manager_id === relationshipManagerId);
  }

  performanceFor(userId: number): TeamPerformance {
    return performanceFor(userId);
  }

  activityFor(names: string[]): AuditLogEntry[] {
    const set = new Set(names);
    return this.auditLog
      .entries()
      .filter((entry) => set.has(entry.actor_name))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createRelationshipManager(payload: UserUpsertPayload): ManagedUser {
    return this.userData.create('relationship_manager', payload, { manager_id: CURRENT_MANAGER_ID });
  }

  createEmployee(payload: UserUpsertPayload, relationshipManagerId: number): ManagedUser {
    const hierarchy: CreateUserHierarchy = {
      manager_id: CURRENT_MANAGER_ID,
      relationship_manager_id: relationshipManagerId,
    };
    return this.userData.create('employee', payload, hierarchy);
  }

  updateUser(id: number, payload: UserUpsertPayload): void {
    this.userData.update(id, payload);
  }

  setActive(id: number, isActive: boolean): void {
    this.userData.setActive(id, isActive);
  }

  /** Moves an Employee to a different Relationship Manager under this manager — the Team Assignment workflow. */
  reassignEmployee(employeeId: number, relationshipManagerId: number, remarks?: string): void {
    this.userData.assignRelationshipManager(employeeId, relationshipManagerId, remarks);
  }

  roleLabel(role: UserRole): string {
    return role === 'relationship_manager' ? 'Relationship Manager' : 'Employee';
  }
}
