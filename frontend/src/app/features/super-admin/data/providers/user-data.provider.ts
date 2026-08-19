import { Injectable, computed, inject, signal } from '@angular/core';

import { ManagedUser, ROLE_LABELS, UserRole } from '../models/user.model';
import { AuditLogDataProvider } from './audit-log-data.provider';

function seedUser(
  id: number,
  name: string,
  email: string,
  phone: string,
  role: UserRole,
  isActive: boolean,
  createdAt: string,
  managerId: number | null = null,
  relationshipManagerId: number | null = null,
): ManagedUser {
  return {
    id,
    name,
    email,
    role,
    role_label: ROLE_LABELS[role],
    manager_id: managerId,
    relationship_manager_id: relationshipManagerId,
    employee_id: null,
    department: null,
    department_label: null,
    phone,
    is_active: isActive,
    email_notifications: true,
    sms_notifications: true,
    notify_on_assignment: true,
    notify_on_approval: true,
    created_at: createdAt,
  };
}

const SEED_USERS: ManagedUser[] = [
  // Managers
  seedUser(1, 'Rahul Mehta', 'rahul.mehta@finoocean.com', '+91 98765 43210', 'manager', true, '2026-02-11T09:15:00+05:30'),
  seedUser(2, 'Sunita Rao', 'sunita.rao@finoocean.com', '+91 98220 11234', 'manager', true, '2026-02-18T11:40:00+05:30'),
  seedUser(3, 'Arvind Nair', 'arvind.nair@finoocean.com', '+91 99000 22456', 'manager', true, '2026-03-02T14:05:00+05:30'),
  seedUser(4, 'Kavita Joshi', 'kavita.joshi@finoocean.com', '+91 97654 88990', 'manager', false, '2026-03-20T10:30:00+05:30'),
  seedUser(5, 'Deepak Chawla', 'deepak.chawla@finoocean.com', '+91 98111 33445', 'manager', true, '2026-04-08T16:20:00+05:30'),
  seedUser(6, 'Anjali Bhatt', 'anjali.bhatt@finoocean.com', '+91 96543 22110', 'manager', true, '2026-05-02T08:50:00+05:30'),

  // Relationship Managers — each reports to one of the managers above (manager_id).
  seedUser(7, 'Priya Nair', 'priya.nair@finoocean.com', '+91 98765 43211', 'relationship_manager', true, '2026-02-14T09:00:00+05:30', 1),
  seedUser(8, 'Sameer Khan', 'sameer.khan@finoocean.com', '+91 98220 55678', 'relationship_manager', true, '2026-02-25T13:15:00+05:30', 1),
  seedUser(9, 'Neha Kapoor', 'neha.kapoor@finoocean.com', '+91 99000 66789', 'relationship_manager', true, '2026-03-10T15:45:00+05:30', 2),
  seedUser(10, 'Ritu Desai', 'ritu.desai@finoocean.com', '+91 97654 11223', 'relationship_manager', false, '2026-03-28T10:00:00+05:30', 2),
  seedUser(11, 'Vikram Singh', 'vikram.singh@finoocean.com', '+91 98111 77889', 'relationship_manager', true, '2026-04-15T12:30:00+05:30', 3),
  seedUser(12, 'Pooja Iyer', 'pooja.iyer@finoocean.com', '+91 96543 44556', 'relationship_manager', true, '2026-05-09T09:20:00+05:30', 3),

  // Employees — each reports to one of the RMs above (relationship_manager_id) and, transitively, that RM's manager (manager_id).
  seedUser(13, 'Amit Sharma', 'amit.sharma@finoocean.com', '+91 98765 12340', 'employee', true, '2026-02-20T09:30:00+05:30', 1, 7),
  seedUser(14, 'Farhan Ali', 'farhan.ali@finoocean.com', '+91 98220 98761', 'employee', true, '2026-03-01T11:10:00+05:30', 1, 7),
  seedUser(15, 'Divya Menon', 'divya.menon@finoocean.com', '+91 99000 34521', 'employee', true, '2026-03-14T14:40:00+05:30', 1, 8),
  seedUser(16, 'Rakesh Kumar', 'rakesh.kumar@finoocean.com', '+91 97654 67832', 'employee', false, '2026-04-02T10:15:00+05:30', 1, 8),
  seedUser(17, 'Shreya Pillai', 'shreya.pillai@finoocean.com', '+91 98111 90876', 'employee', true, '2026-04-21T16:00:00+05:30', 2, 9),
  seedUser(18, 'Manish Verma', 'manish.verma@finoocean.com', '+91 96543 65432', 'employee', true, '2026-05-16T08:45:00+05:30', 2, 10),

  // Connectors
  seedUser(19, 'Suresh Patil', 'suresh.patil@partner.com', '+91 98765 55667', 'connector', true, '2026-02-09T09:00:00+05:30'),
  seedUser(20, 'Zoya Ahmed', 'zoya.ahmed@partner.com', '+91 98220 44556', 'connector', true, '2026-02-27T12:20:00+05:30'),
  seedUser(21, 'Ganesh Rao', 'ganesh.rao@partner.com', '+91 99000 77889', 'connector', false, '2026-03-16T15:10:00+05:30'),
  seedUser(22, 'Lakshmi Iyer', 'lakshmi.iyer@partner.com', '+91 97654 33221', 'connector', true, '2026-04-04T10:50:00+05:30'),
  seedUser(23, 'Imran Sheikh', 'imran.sheikh@partner.com', '+91 98111 22110', 'connector', true, '2026-04-24T13:35:00+05:30'),
  seedUser(24, 'Nisha Gupta', 'nisha.gupta@partner.com', '+91 96543 99887', 'connector', true, '2026-05-19T09:05:00+05:30'),

  // Bankers
  seedUser(25, 'Vivek Joshi', 'vivek.joshi@hdfcbank.com', '+91 98765 66778', 'banker', true, '2026-02-13T09:40:00+05:30'),
  seedUser(26, 'Swati Menon', 'swati.menon@icicibank.com', '+91 98220 33445', 'banker', true, '2026-03-05T11:25:00+05:30'),
  seedUser(27, 'Deepak Gupta', 'deepak.gupta@axisbank.com', '+91 99000 88990', 'banker', false, '2026-03-22T14:55:00+05:30'),
  seedUser(28, 'Yogesh Kulkarni', 'yogesh.kulkarni@sbi.co.in', '+91 97654 55443', 'banker', true, '2026-04-10T10:05:00+05:30'),
  seedUser(29, 'Ananya Reddy', 'ananya.reddy@kotak.com', '+91 98111 44332', 'banker', true, '2026-04-29T16:45:00+05:30'),
  seedUser(30, 'Rohan Bose', 'rohan.bose@yesbank.in', '+91 96543 11009', 'banker', true, '2026-05-23T08:30:00+05:30'),
];

export interface UserUpsertPayload {
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

export interface CreateUserHierarchy {
  manager_id?: number | null;
  relationship_manager_id?: number | null;
}

/**
 * Centralized state for every mock user across the platform. A single
 * root-provided instance backs every Users page and the Dashboard, so a
 * change made on one page (create, edit, activate/deactivate) is visible
 * everywhere else without a reload.
 */
@Injectable({ providedIn: 'root' })
export class UserDataProvider {
  private readonly auditLog = inject(AuditLogDataProvider);

  private readonly _users = signal<ManagedUser[]>(SEED_USERS);
  private nextId = 1000;

  readonly users = this._users.asReadonly();

  readonly activeCount = computed(() => this._users().filter((user) => user.is_active).length);

  byRole(role: UserRole): ManagedUser[] {
    return this._users().filter((user) => user.role === role);
  }

  getById(id: number): ManagedUser | undefined {
    return this._users().find((user) => user.id === id);
  }

  create(role: UserRole, payload: UserUpsertPayload, hierarchy: CreateUserHierarchy = {}): ManagedUser {
    const created: ManagedUser = {
      id: this.nextId++,
      name: payload.name,
      email: payload.email,
      role,
      role_label: ROLE_LABELS[role],
      manager_id: hierarchy.manager_id ?? null,
      relationship_manager_id: hierarchy.relationship_manager_id ?? null,
      employee_id: null,
      department: null,
      department_label: null,
      phone: payload.phone,
      is_active: payload.is_active,
      email_notifications: true,
      sms_notifications: true,
      notify_on_assignment: true,
      notify_on_approval: true,
      created_at: new Date().toISOString(),
    };

    this._users.update((current) => [created, ...current]);

    this.auditLog.record({
      action: 'created',
      entity_type: 'User',
      entity_label: created.name,
      description: `Created ${created.role_label} account.`,
      category: 'user_creation',
    });

    return created;
  }

  update(id: number, payload: UserUpsertPayload): void {
    this._users.update((current) =>
      current.map((user) =>
        user.id === id
          ? { ...user, name: payload.name, email: payload.email, phone: payload.phone, is_active: payload.is_active }
          : user,
      ),
    );

    this.auditLog.record({
      action: 'updated',
      entity_type: 'User',
      entity_label: payload.name,
      description: `Updated account details for ${payload.name}.`,
      category: 'user_update',
    });
  }

  setActive(id: number, isActive: boolean): void {
    const user = this.getById(id);

    this._users.update((current) =>
      current.map((user) => (user.id === id ? { ...user, is_active: isActive } : user)),
    );

    this.auditLog.record({
      action: isActive ? 'activated' : 'deactivated',
      entity_type: 'User',
      entity_label: user?.name ?? `User #${id}`,
      description: `${isActive ? 'Activated' : 'Deactivated'} ${user?.role_label ?? 'user'} account.`,
      category: 'user_update',
    });
  }

  /**
   * Moves an Employee to a different Relationship Manager (and, transitively,
   * that RM's Manager) — the Team Assignment workflow. `remarks` are folded
   * into the audit description so the reason survives in Activity tracking.
   */
  assignRelationshipManager(employeeId: number, relationshipManagerId: number, remarks?: string): void {
    const employee = this.getById(employeeId);
    const rm = this.getById(relationshipManagerId);
    if (!employee || !rm) {
      return;
    }

    this._users.update((current) =>
      current.map((user) =>
        user.id === employeeId
          ? { ...user, relationship_manager_id: rm.id, manager_id: rm.manager_id }
          : user,
      ),
    );

    this.auditLog.record({
      action: 'reassigned',
      entity_type: 'User',
      entity_label: employee.name,
      description: [`Reassigned ${employee.name} to ${rm.name} (Relationship Manager).`, remarks]
        .filter(Boolean)
        .join(' — '),
      category: 'team_assignment',
    });
  }
}
