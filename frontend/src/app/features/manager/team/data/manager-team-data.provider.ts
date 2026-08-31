import { Injectable, computed, inject, signal } from '@angular/core';

import { AuditLogEntry } from '@core/models/audit-log.model';
import { ManagedEmployee, ManagedRelationshipManager } from '@core/models/manager.model';
import { Department, UserRole } from '@core/models/user.model';
import { AuditLogService } from '@core/services/audit-log.service';
import { AuthService } from '@core/services/auth.service';
import { ManagerService } from '@core/services/manager.service';
import { UserService } from '@core/services/user.service';

import { ManagerLeadsDataProvider } from '../../data/providers/manager-leads.provider';

/** Normalized row shape both `ManagedRelationshipManager` and `ManagedEmployee` are mapped down to — all the Team pages actually need. */
export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
  /** Set for employees (their reporting RM); always null for a Relationship Manager row. */
  relationship_manager_id: number | null;
}

export interface TeamMemberCreatePayload {
  name: string;
  email: string;
  password: string;
  phone: string | null;
  is_active: boolean;
}

export interface TeamMemberEditPayload {
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

export interface TeamPerformance {
  leadsHandled: number;
  approved: number;
  disbursed: number;
  conversionRatePct: number;
  avgTurnaroundDays: number;
}

function toTeamMember(row: ManagedRelationshipManager | ManagedEmployee): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    is_active: row.is_active,
    created_at: row.created_at,
    relationship_manager_id: 'relationship_manager' in row ? (row.relationship_manager?.id ?? null) : null,
  };
}

/**
 * Manager-scoped view over the platform's real Relationship Managers and
 * Employees (`ManagerService` / `UserService`) and their real activity
 * (`AuditLogService`), plus per-person performance computed client-side from
 * the manager's own real leads (`ManagerLeadsDataProvider`) — Leads have
 * been real the whole time, so this is a real aggregate, not a fabricated
 * one. Root-provided so a create/edit/reassign here is immediately visible
 * on both the Employee Management and Relationship Manager Management pages.
 */
@Injectable({ providedIn: 'root' })
export class ManagerTeamDataProvider {
  private readonly managerApi = inject(ManagerService);
  private readonly userApi = inject(UserService);
  private readonly auditLogApi = inject(AuditLogService);
  private readonly auth = inject(AuthService);
  private readonly leadData = inject(ManagerLeadsDataProvider);

  private readonly _relationshipManagers = signal<TeamMember[]>([]);
  private readonly _employees = signal<TeamMember[]>([]);
  private readonly _auditEntries = signal<AuditLogEntry[]>([]);

  readonly relationshipManagers = this._relationshipManagers.asReadonly();
  readonly employees = this._employees.asReadonly();

  readonly manager = computed(() => {
    const user = this.auth.user();
    return user ? { name: user.name, role_label: user.role_label } : null;
  });

  constructor() {
    this.loadRelationshipManagers();
    this.loadEmployees();
    this.loadActivity();
  }

  getById(id: number): TeamMember | undefined {
    return this._relationshipManagers().find((row) => row.id === id) ?? this._employees().find((row) => row.id === id);
  }

  employeesFor(relationshipManagerId: number): TeamMember[] {
    return this._employees().filter((employee) => employee.relationship_manager_id === relationshipManagerId);
  }

  /** Leads handled / approved / disbursed / conversion / avg. turnaround, computed from this person's own real leads. */
  performanceFor(userId: number): TeamPerformance {
    const isRm = this._relationshipManagers().some((rm) => rm.id === userId);
    const rows = this.leadData
      .leads()
      .filter((lead) =>
        isRm ? lead.assigned_relationship_manager?.id === userId : lead.assigned_employee?.id === userId,
      );

    const approved = rows.filter((row) => row.status === 'approved' || row.status === 'disbursed').length;
    const disbursed = rows.filter((row) => row.status === 'disbursed').length;
    const conversionRatePct = rows.length === 0 ? 0 : Math.round((approved / rows.length) * 100);

    // Same real-timestamp approximation as the Performance Reports page.
    const daySpans = rows
      .filter((row) => ['approved', 'disbursed', 'rejected'].includes(row.status))
      .map((row) => (row.created_at && row.updated_at ? (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) / 86400000 : null))
      .filter((value): value is number => value !== null && value >= 0);
    const avgTurnaroundDays = daySpans.length ? Math.round((daySpans.reduce((sum, value) => sum + value, 0) / daySpans.length) * 10) / 10 : 0;

    return { leadsHandled: rows.length, approved, disbursed, conversionRatePct, avgTurnaroundDays };
  }

  activityFor(names: string[]): AuditLogEntry[] {
    const set = new Set(names);
    return this._auditEntries()
      .filter((entry) => set.has(entry.actor_name))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createRelationshipManager(payload: TeamMemberCreatePayload & { department: Department }): void {
    this.managerApi
      .createRelationshipManager({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        is_active: payload.is_active,
        department: payload.department,
      })
      .subscribe({ next: () => this.loadRelationshipManagers() });
  }

  createEmployee(payload: TeamMemberCreatePayload, relationshipManagerId: number): void {
    this.userApi
      .create({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        role: 'employee',
        relationship_manager_id: relationshipManagerId,
        is_active: payload.is_active,
      })
      .subscribe({ next: () => this.loadEmployees() });
  }

  updateUser(id: number, payload: TeamMemberEditPayload): void {
    this.dispatchUpdate(id, {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      is_active: payload.is_active,
    });
  }

  setActive(id: number, isActive: boolean): void {
    this.dispatchUpdate(id, { is_active: isActive });
  }

  /** Moves an Employee to a different Relationship Manager under this manager — the Team Assignment workflow. */
  reassignEmployee(employeeId: number, relationshipManagerId: number, remarks?: string): void {
    this.managerApi
      .reassignEmployee(employeeId, { relationship_manager_id: relationshipManagerId, remarks: remarks || null })
      .subscribe({ next: () => this.loadEmployees() });
  }

  roleLabel(role: UserRole): string {
    return role === 'relationship_manager' ? 'Relationship Manager' : 'Employee';
  }

  private dispatchUpdate(
    id: number,
    attrs: { name?: string; email?: string; phone?: string | null; is_active?: boolean },
  ): void {
    if (this._relationshipManagers().some((rm) => rm.id === id)) {
      this.managerApi.updateRelationshipManager(id, attrs).subscribe({ next: () => this.loadRelationshipManagers() });
      return;
    }

    this.userApi.update(id, attrs).subscribe({ next: () => this.loadEmployees() });
  }

  private loadRelationshipManagers(): void {
    this.managerApi.relationshipManagers().subscribe({
      next: (result) => this._relationshipManagers.set(result.relationship_managers.map((row) => toTeamMember(row))),
      error: () => this._relationshipManagers.set([]),
    });
  }

  private loadEmployees(): void {
    this.managerApi.employees().subscribe({
      next: (result) => this._employees.set(result.employees.map((row) => toTeamMember(row))),
      error: () => this._employees.set([]),
    });
  }

  private loadActivity(): void {
    this.auditLogApi.list({ per_page: 200 }).subscribe({
      next: (result) => this._auditEntries.set(result.items),
      error: () => this._auditEntries.set([]),
    });
  }
}
