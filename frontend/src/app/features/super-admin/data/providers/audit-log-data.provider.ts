import { Injectable, inject, signal } from '@angular/core';

import { AuthService } from '@core/services/auth.service';

import { AuditEventCategory, AuditLogEntry } from '../models/audit-log.model';

function minutesAgoIso(minutes: number): string {
  const reference = new Date('2026-08-15T10:00:00+05:30');
  reference.setMinutes(reference.getMinutes() - minutes);
  return reference.toISOString();
}

interface Seed {
  minutesAgo: number;
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityLabel: string;
  description: string;
  ip: string;
}

const SEEDS: Seed[] = [
  { minutesAgo: 5, actor: 'Arjun Mehta', role: 'Super Admin', action: 'updated', entityType: 'Settings', entityLabel: 'Matching Engine', description: 'Minimum match score threshold changed from 60 to 65.', ip: '203.192.14.22' },
  { minutesAgo: 15, actor: 'Arjun Mehta', role: 'Super Admin', action: 'granted', entityType: 'Permission', entityLabel: 'Support · Notifications', description: 'Granted "Edit" on Notifications to Support.', ip: '203.192.14.22' },
  { minutesAgo: 950, actor: 'Arjun Mehta', role: 'Super Admin', action: 'revoked', entityType: 'Permission', entityLabel: 'Employee · Users', description: 'Revoked "View" on Users from Employee.', ip: '203.192.14.22' },
  { minutesAgo: 5200, actor: 'Arjun Mehta', role: 'Super Admin', action: 'granted', entityType: 'Permission', entityLabel: 'Accounts · Commissions', description: 'Granted "Edit" on Commissions to Accounts.', ip: '203.192.14.22' },
  { minutesAgo: 22, actor: 'Rahul Mehta', role: 'Manager', action: 'created', entityType: 'User', entityLabel: 'Priya Nair', description: 'Created Relationship Manager account.', ip: '182.75.44.10' },
  { minutesAgo: 45, actor: 'Arjun Mehta', role: 'Super Admin', action: 'updated', entityType: 'Payout', entityLabel: 'PO-2026-1017', description: 'Marked payout as processing.', ip: '203.192.14.22' },
  { minutesAgo: 70, actor: 'Amit Sharma', role: 'Employee', action: 'uploaded', entityType: 'Document', entityLabel: 'LD-2408001432', description: 'Uploaded KYC document.', ip: '117.98.22.5' },
  { minutesAgo: 130, actor: 'Arjun Mehta', role: 'Super Admin', action: 'deactivated', entityType: 'Bank Criteria', entityLabel: 'Axis Bank — Drive Easy', description: 'Deactivated bank product.', ip: '203.192.14.22' },
  { minutesAgo: 200, actor: 'Priya Nair', role: 'Relationship Manager', action: 'assigned', entityType: 'Lead', entityLabel: 'LD-2408001017', description: 'Assigned lead to Farhan Ali.', ip: '182.75.44.11' },
  { minutesAgo: 260, actor: 'Arjun Mehta', role: 'Super Admin', action: 'logged in', entityType: 'Auth', entityLabel: 'Session', description: 'Signed in successfully.', ip: '203.192.14.22' },
  { minutesAgo: 410, actor: 'Arjun Mehta', role: 'Super Admin', action: 'assigned', entityType: 'Banker Assignment', entityLabel: 'LD-2408001415', description: 'Reassigned banker to Vivek Joshi.', ip: '203.192.14.22' },
  { minutesAgo: 560, actor: 'System', role: 'System', action: 'accrued', entityType: 'Commission', entityLabel: 'Suresh Patil', description: 'Connector commission accrued (₹42,000).', ip: '—' },
  { minutesAgo: 720, actor: 'Arjun Mehta', role: 'Super Admin', action: 'deactivated', entityType: 'User', entityLabel: 'Kavita Joshi', description: 'Deactivated Manager account.', ip: '203.192.14.22' },
  { minutesAgo: 900, actor: 'Farhan Ali', role: 'Employee', action: 'updated', entityType: 'Lead', entityLabel: 'LD-2408001389', description: 'Changed status to Rejected — did not meet eligibility.', ip: '117.98.22.9' },
  { minutesAgo: 1080, actor: 'Divya Menon', role: 'Employee', action: 'uploaded', entityType: 'Document', entityLabel: 'LD-2407009981', description: 'Uploaded income proof.', ip: '117.98.22.14' },
  { minutesAgo: 1300, actor: 'Arjun Mehta', role: 'Super Admin', action: 'logged in', entityType: 'Auth', entityLabel: 'Session', description: 'New sign-in from Mumbai, India.', ip: '203.192.14.22' },
  { minutesAgo: 1500, actor: 'Arjun Mehta', role: 'Super Admin', action: 'ran', entityType: 'Matching Engine', entityLabel: 'LD-2408001402', description: 'Ran matching engine — 4 products matched.', ip: '203.192.14.22' },
  { minutesAgo: 1800, actor: 'Arjun Mehta', role: 'Super Admin', action: 'paid', entityType: 'Payout', entityLabel: 'PO-2026-1011', description: 'Marked payout to Growth Partners Media as paid (₹1,50,000).', ip: '203.192.14.22' },
  { minutesAgo: 2200, actor: 'Rahul Mehta', role: 'Manager', action: 'created', entityType: 'User', entityLabel: 'Rohan Bose', description: 'Created Banker account.', ip: '182.75.44.10' },
  { minutesAgo: 2600, actor: 'System', role: 'System', action: 'disbursed', entityType: 'Lead', entityLabel: 'LD-2408001402', description: 'Loan disbursed — ₹35.4L.', ip: '—' },
  { minutesAgo: 3000, actor: 'Arjun Mehta', role: 'Super Admin', action: 'generated', entityType: 'Report', entityLabel: 'Performance Report', description: 'Generated monthly performance report for July 2026.', ip: '203.192.14.22' },
  { minutesAgo: 3400, actor: 'Sameer Khan', role: 'Relationship Manager', action: 'updated', entityType: 'Lead', entityLabel: 'LD-2407100540', description: 'Changed status to Under Review.', ip: '182.75.44.19' },
  { minutesAgo: 3900, actor: 'Arjun Mehta', role: 'Super Admin', action: 'created', entityType: 'Bank Criteria', entityLabel: 'Kotak Mahindra Bank — Property Power', description: 'Added new bank product.', ip: '203.192.14.22' },
  { minutesAgo: 4400, actor: 'Zoya Ahmed', role: 'Connector', action: 'created', entityType: 'Lead', entityLabel: 'LD-2408001003', description: 'Submitted new lead — Karthik Iyer.', ip: '49.15.88.3' },
  { minutesAgo: 4900, actor: 'Arjun Mehta', role: 'Super Admin', action: 'updated', entityType: 'Settings', entityLabel: 'Company', description: 'Updated support email address.', ip: '203.192.14.22' },
  { minutesAgo: 5400, actor: 'Vikram Singh', role: 'Relationship Manager', action: 'assigned', entityType: 'Lead', entityLabel: 'LD-2406100501', description: 'Assigned lead to Manish Verma.', ip: '182.75.44.27' },
  { minutesAgo: 6000, actor: 'Arjun Mehta', role: 'Super Admin', action: 'updated', entityType: 'User', entityLabel: 'Ganesh Rao', description: 'Deactivated Connector account.', ip: '203.192.14.22' },
  { minutesAgo: 6600, actor: 'System', role: 'System', action: 'paid', entityType: 'Payout', entityLabel: 'PO-2026-1009', description: 'Payout to Nisha Gupta marked as paid (₹29,000).', ip: '—' },
  { minutesAgo: 7200, actor: 'Arjun Mehta', role: 'Super Admin', action: 'updated', entityType: 'Settings', entityLabel: 'System', description: 'Enabled email notifications for all roles.', ip: '203.192.14.22' },
  { minutesAgo: 7800, actor: 'Neha Kapoor', role: 'Relationship Manager', action: 'updated', entityType: 'Lead', entityLabel: 'LD-2406100455', description: 'Changed status to Approved.', ip: '182.75.44.31' },
  { minutesAgo: 8400, actor: 'Arjun Mehta', role: 'Super Admin', action: 'created', entityType: 'User', entityLabel: 'Anjali Bhatt', description: 'Created Manager account.', ip: '203.192.14.22' },
  { minutesAgo: 9000, actor: 'Imran Sheikh', role: 'Connector', action: 'created', entityType: 'Lead', entityLabel: 'LD-2408001017', description: 'Submitted new lead — Harshad Patel.', ip: '49.15.88.9' },
  { minutesAgo: 9600, actor: 'Arjun Mehta', role: 'Super Admin', action: 'logged in', entityType: 'Auth', entityLabel: 'Session', description: 'Signed in successfully.', ip: '203.192.14.22' },
];

/** Maps the free-text entity/action pairs already in the log onto the seven tracked event categories. */
function categorize(entityType: string, action: string): AuditEventCategory {
  if (entityType === 'User') {
    return action === 'created' ? 'user_creation' : 'user_update';
  }
  if (entityType === 'Lead') {
    if (action === 'created') return 'lead_creation';
    if (action === 'assigned') return 'lead_assignment';
    return 'status_change';
  }
  if (entityType === 'Banker Assignment') return 'lead_assignment';
  if (entityType === 'Document') return 'document_upload';
  if (entityType === 'Permission') return 'permission_change';
  return 'other';
}

const SEED_AUDIT_LOGS: AuditLogEntry[] = SEEDS.map((seed, index) => ({
  id: index + 1,
  timestamp: minutesAgoIso(seed.minutesAgo),
  actor_name: seed.actor,
  actor_role: seed.role,
  action: seed.action,
  entity_type: seed.entityType,
  entity_label: seed.entityLabel,
  description: seed.description,
  category: categorize(seed.entityType, seed.action),
  ip_address: seed.ip,
}));

export interface RecordAuditEntryInput {
  action: string;
  entity_type: string;
  entity_label: string;
  description: string;
  category: AuditEventCategory;
}

/**
 * Centralized state for the platform audit trail. Root-provided so the
 * Dashboard's activity feed, the Audit Logs page and every mutating
 * provider (Users, Leads, Permissions) read and write the same log.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogDataProvider {
  private readonly auth = inject(AuthService);

  private readonly _entries = signal<AuditLogEntry[]>(SEED_AUDIT_LOGS);
  private nextId = SEED_AUDIT_LOGS.length + 1;

  readonly entries = this._entries.asReadonly();

  readonly entityTypes = [...new Set(SEED_AUDIT_LOGS.map((entry) => entry.entity_type))].sort();

  getById(id: number): AuditLogEntry | undefined {
    return this._entries().find((entry) => entry.id === id);
  }

  /** Appends a live entry, attributed to the signed-in user. Called by Users, Leads and Permissions providers after a mutation. */
  record(input: RecordAuditEntryInput): void {
    const actor = this.auth.user();

    const entry: AuditLogEntry = {
      id: this.nextId++,
      timestamp: new Date().toISOString(),
      actor_name: actor?.name ?? 'System',
      actor_role: actor?.role_label ?? 'System',
      ip_address: '—',
      ...input,
    };

    this._entries.update((current) => [entry, ...current]);
  }
}
