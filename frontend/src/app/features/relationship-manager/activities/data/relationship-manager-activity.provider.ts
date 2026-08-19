import { Injectable, signal } from '@angular/core';

export type ActivityType = 'call' | 'meeting' | 'task' | 'reminder';
export type ActivityStoredStatus = 'pending' | 'completed' | 'cancelled';
/** Derived, never stored — 'pending' resolves to one of the first three depending on `dueAt`. */
export type ActivityDisplayStatus = 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'cancelled';

export interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  relatedTo: string;
  leadId: number | null;
  dueAt: string;
  status: ActivityStoredStatus;
  assignedTo: string;
  notes: string | null;
  completedAt: string | null;
}

export interface ActivityDraft {
  title: string;
  relatedTo: string;
  leadId: number | null;
  dueAt: string;
  assignedTo: string;
  notes: string | null;
}

const NOW = new Date('2026-08-15T10:00:00+05:30');
const RM_NAME = 'Priya Nair';

function daysFromNowIso(days: number, hour = 10): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() + days);
  at.setHours(hour, 0, 0, 0);
  return at.toISOString();
}

let nextId = 1;
function seed(
  type: ActivityType,
  title: string,
  relatedTo: string,
  leadId: number | null,
  daysFromNow: number,
  status: ActivityStoredStatus,
  assignedTo: string,
  notes: string | null,
): Activity {
  const dueAt = daysFromNowIso(daysFromNow);
  return {
    id: nextId++,
    type,
    title,
    relatedTo,
    leadId,
    dueAt,
    status,
    assignedTo,
    notes,
    completedAt: status === 'completed' ? dueAt : null,
  };
}

const SEED_ACTIVITIES: Activity[] = [
  // Calls
  seed('call', 'Follow-up call — loan document status', 'MG-2408001007 — Ishita Verma', 7, -1, 'pending', RM_NAME, 'Confirm income proof has been couriered.'),
  seed('call', 'Callback requested by applicant', 'MG-2408001011 — Riya Chatterjee', 11, 0, 'pending', 'Amit Sharma', null),
  seed('call', 'Introductory call — new referral', 'MG-2408001006 — Rohan Kulkarni', 6, 3, 'pending', 'Farhan Ali', 'Referred by Suresh Patil.'),
  seed('call', 'Post-disbursement check-in', 'MG-2408001027 — Om Bansal', 27, -6, 'completed', RM_NAME, 'Applicant confirmed funds received.'),

  // Meetings
  seed('meeting', 'Quarterly Business Review', 'Manager: Rahul Mehta', null, 2, 'pending', RM_NAME, 'Prepare team performance summary.'),
  seed('meeting', 'Site visit — property valuation', 'MG-2408001015 — Diya Pillai', 15, -2, 'pending', 'Amit Sharma', null),
  seed('meeting', 'Monthly review with Amit Sharma', 'Employee: Amit Sharma', null, 5, 'pending', RM_NAME, null),
  seed('meeting', 'Connector partnership review', 'Connector: Suresh Patil', null, -10, 'completed', RM_NAME, 'Discussed Q3 referral targets.'),

  // Tasks
  seed('task', 'Collect updated bank statement', 'MG-2408001018 — Vikram Oberoi', 18, -1, 'pending', 'Amit Sharma', 'Last statement is over 90 days old.'),
  seed('task', 'Prepare credit note for review committee', 'MG-2408001019 — Pooja Nambiar', 19, 1, 'pending', RM_NAME, null),
  seed('task', 'Update CRM with KYC status', 'MG-2408001022 — Simone D\'Souza', 22, -4, 'completed', 'Farhan Ali', null),

  // Reminders
  seed('reminder', 'Loan agreement expiring soon', 'MG-2408001023 — Harsh Vardhan', 23, 0, 'pending', RM_NAME, 'Sanction letter valid until end of week.'),
  seed('reminder', 'Employee probation review due', 'Employee: Farhan Ali', null, 4, 'pending', RM_NAME, null),
  seed('reminder', 'Renew connector agreement', 'Connector: Zoya Ahmed', null, -3, 'pending', RM_NAME, 'Agreement lapsed — needs re-signing.'),
];

/**
 * Consolidates the legacy "follow-up date" field on a lead and the mockup's
 * Meetings/Activities concepts into one worklist, shared by the Calls,
 * Meetings, Tasks and Reminders tabs. Mock state only — no HTTP.
 */
@Injectable({ providedIn: 'root' })
export class RelationshipManagerActivityDataProvider {
  private readonly _activities = signal<Activity[]>(SEED_ACTIVITIES);
  private nextActivityId = SEED_ACTIVITIES.length + 1;

  readonly activities = this._activities.asReadonly();

  byType(type: ActivityType): Activity[] {
    return this._activities()
      .filter((a) => a.type === type)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  getById(id: number): Activity | undefined {
    return this._activities().find((a) => a.id === id);
  }

  displayStatus(activity: Activity): ActivityDisplayStatus {
    if (activity.status === 'completed') return 'completed';
    if (activity.status === 'cancelled') return 'cancelled';

    const due = new Date(activity.dueAt);
    const todayStart = new Date(NOW);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(NOW);
    todayEnd.setHours(23, 59, 59, 999);

    if (due < todayStart) return 'overdue';
    if (due <= todayEnd) return 'due_today';
    return 'upcoming';
  }

  counts(type: ActivityType) {
    const rows = this.byType(type);
    return {
      overdue: rows.filter((a) => this.displayStatus(a) === 'overdue').length,
      dueToday: rows.filter((a) => this.displayStatus(a) === 'due_today').length,
      upcoming: rows.filter((a) => this.displayStatus(a) === 'upcoming').length,
      completed: rows.filter((a) => a.status === 'completed').length,
    };
  }

  complete(id: number): void {
    this._activities.update((current) =>
      current.map((a) => (a.id === id ? { ...a, status: 'completed', completedAt: new Date().toISOString() } : a)),
    );
  }

  cancel(id: number): void {
    this._activities.update((current) => current.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)));
  }

  reschedule(id: number, dueAt: string, notes?: string): void {
    this._activities.update((current) =>
      current.map((a) =>
        a.id === id
          ? { ...a, dueAt, status: 'pending', notes: notes?.trim() || a.notes }
          : a,
      ),
    );
  }

  create(type: ActivityType, draft: ActivityDraft): Activity {
    const activity: Activity = {
      id: this.nextActivityId++,
      type,
      title: draft.title,
      relatedTo: draft.relatedTo,
      leadId: draft.leadId,
      dueAt: draft.dueAt,
      status: 'pending',
      assignedTo: draft.assignedTo,
      notes: draft.notes,
      completedAt: null,
    };

    this._activities.update((current) => [activity, ...current]);
    return activity;
  }
}
