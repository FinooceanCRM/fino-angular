import { Injectable, signal } from '@angular/core';

export type TaskActivityType = 'call' | 'meeting' | 'task' | 'reminder';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStoredStatus = 'pending' | 'completed' | 'cancelled';
export type TaskDisplayStatus = 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'cancelled';

export interface Task {
  id: number;
  type: TaskActivityType;
  title: string;
  description: string | null;
  relatedTo: string;
  leadId: number | null;
  priority: TaskPriority;
  dueAt: string;
  status: TaskStoredStatus;
  completedAt: string | null;
  createdAt: string;
}

export interface TaskDraft {
  type: TaskActivityType;
  title: string;
  description: string | null;
  relatedTo: string;
  leadId: number | null;
  priority: TaskPriority;
  dueAt: string;
}

export interface TaskTimelineEntry {
  icon: string;
  title: string;
  subtitle: string | null;
  time: string;
}

export interface TaskCounts {
  open: number;
  overdue: number;
  dueToday: number;
  completed: number;
}

const NOW = new Date('2026-08-15T10:00:00+05:30');

function daysFromNowIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() + days);
  return at.toISOString();
}

function daysAgoIso(days: number): string {
  return daysFromNowIso(-days);
}

const SEED_TASKS: Task[] = [
  {
    id: 1,
    type: 'task',
    title: 'Call Rohan Kulkarni re: income proof',
    description: 'Follow up before the underwriting review closes this week.',
    relatedTo: 'MG-2408001006 — Rohan Kulkarni',
    leadId: 6,
    priority: 'high',
    dueAt: daysFromNowIso(0),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(1),
  },
  {
    id: 2,
    type: 'task',
    title: 'Send welcome email to Kabir Malhotra',
    description: null,
    relatedTo: 'MG-2408001010 — Kabir Malhotra',
    leadId: 10,
    priority: 'medium',
    dueAt: daysFromNowIso(1),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(2),
  },
  {
    id: 3,
    type: 'task',
    title: 'Chase pending bank statement',
    description: 'Yusuf has not responded to the last reminder.',
    relatedTo: 'MG-2408001014 — Yusuf Sheikh',
    leadId: 14,
    priority: 'high',
    dueAt: daysAgoIso(2),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(5),
  },
  {
    id: 4,
    type: 'task',
    title: 'Update KYC checklist',
    description: null,
    relatedTo: 'MG-2408001018 — Vikram Oberoi',
    leadId: 18,
    priority: 'low',
    dueAt: daysAgoIso(4),
    status: 'completed',
    completedAt: daysAgoIso(3),
    createdAt: daysAgoIso(6),
  },
  {
    id: 5,
    type: 'task',
    title: 'Schedule branch visit',
    description: 'Discuss disbursement paperwork in person.',
    relatedTo: "MG-2408001022 — Simone D'Souza",
    leadId: 22,
    priority: 'medium',
    dueAt: daysFromNowIso(3),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(1),
  },
  {
    id: 6,
    type: 'task',
    title: 'Close out rejected application notes',
    description: null,
    relatedTo: 'MG-2408001026 — Kritika Suri',
    leadId: 26,
    priority: 'low',
    dueAt: daysAgoIso(7),
    status: 'cancelled',
    completedAt: null,
    createdAt: daysAgoIso(10),
  },
  {
    id: 7,
    type: 'call',
    title: 'Call Yusuf Sheikh re: bank statement',
    description: 'Second reminder — no response to the last email.',
    relatedTo: 'MG-2408001014 — Yusuf Sheikh',
    leadId: 14,
    priority: 'high',
    dueAt: daysFromNowIso(0),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(1),
  },
  {
    id: 8,
    type: 'call',
    title: 'Call Vikram Oberoi re: GST returns',
    description: null,
    relatedTo: 'MG-2408001018 — Vikram Oberoi',
    leadId: 18,
    priority: 'medium',
    dueAt: daysAgoIso(1),
    status: 'completed',
    completedAt: daysAgoIso(1),
    createdAt: daysAgoIso(4),
  },
  {
    id: 9,
    type: 'meeting',
    title: 'Branch meeting — Simone D’Souza disbursement',
    description: 'Walk through the disbursement paperwork in person.',
    relatedTo: "MG-2408001022 — Simone D'Souza",
    leadId: 22,
    priority: 'medium',
    dueAt: daysFromNowIso(2),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(2),
  },
  {
    id: 10,
    type: 'meeting',
    title: 'Kick-off meeting with Rohan Kulkarni',
    description: 'Introduce the loan process and required documents.',
    relatedTo: 'MG-2408001006 — Rohan Kulkarni',
    leadId: 6,
    priority: 'low',
    dueAt: daysAgoIso(3),
    status: 'completed',
    completedAt: daysAgoIso(3),
    createdAt: daysAgoIso(6),
  },
  {
    id: 11,
    type: 'reminder',
    title: 'Reminder: KYC re-verification due',
    description: 'Aadhaar re-verification window closes soon.',
    relatedTo: 'MG-2408001010 — Kabir Malhotra',
    leadId: 10,
    priority: 'medium',
    dueAt: daysFromNowIso(1),
    status: 'pending',
    completedAt: null,
    createdAt: daysAgoIso(3),
  },
  {
    id: 12,
    type: 'reminder',
    title: 'Reminder: follow up on rejected file',
    description: null,
    relatedTo: 'MG-2408001026 — Kritika Suri',
    leadId: 26,
    priority: 'low',
    dueAt: daysAgoIso(5),
    status: 'cancelled',
    completedAt: null,
    createdAt: daysAgoIso(9),
  },
];

/**
 * Centralized mock state for the Tasks module — Calls, Meetings, Tasks and
 * Reminders, following the same activity-type shape as the Relationship
 * Manager module's Activities (kept as its own provider rather than
 * importing that one directly, since RM's is scoped to RM-specific mock
 * leads and a hardcoded RM identity). A single root-provided instance backs
 * every bucket (All / Calls / Meetings / Reminders / Follow-ups) — no
 * service, no HTTP. Currently seeded for the Employee workspace demo; a real
 * integration would key tasks off the authenticated user's id instead of a
 * fixed seed.
 */
@Injectable({ providedIn: 'root' })
export class TaskDataProvider {
  private readonly _tasks = signal<Task[]>(SEED_TASKS);
  private nextId = SEED_TASKS.length + 1;

  readonly tasks = this._tasks.asReadonly();

  byType(type: TaskActivityType): Task[] {
    return this._tasks().filter((task) => task.type === type);
  }

  counts(type: TaskActivityType | null = null): TaskCounts {
    const all = type ? this.byType(type) : this._tasks();
    return {
      open: all.filter((task) => task.status === 'pending').length,
      overdue: all.filter((task) => this.displayStatus(task) === 'overdue').length,
      dueToday: all.filter((task) => this.displayStatus(task) === 'due_today').length,
      completed: all.filter((task) => task.status === 'completed').length,
    };
  }

  getById(id: number): Task | undefined {
    return this._tasks().find((task) => task.id === id);
  }

  displayStatus(task: Task): TaskDisplayStatus {
    if (task.status === 'completed') {
      return 'completed';
    }
    if (task.status === 'cancelled') {
      return 'cancelled';
    }

    const due = new Date(task.dueAt);
    if (due.toDateString() === NOW.toDateString()) {
      return 'due_today';
    }
    return due.getTime() < NOW.getTime() ? 'overdue' : 'upcoming';
  }

  /** Synthesises a small activity timeline (created → due/completed/cancelled) for the task detail dialog. */
  timelineFor(task: Task): TaskTimelineEntry[] {
    const entries: TaskTimelineEntry[] = [
      { icon: 'add_circle', title: 'Created', subtitle: task.relatedTo, time: formatTime(task.createdAt) },
    ];

    if (task.status === 'completed' && task.completedAt) {
      entries.push({ icon: 'task_alt', title: 'Marked complete', subtitle: null, time: formatTime(task.completedAt) });
    } else if (task.status === 'cancelled') {
      entries.push({ icon: 'cancel', title: 'Cancelled', subtitle: null, time: formatTime(task.createdAt) });
    } else {
      entries.push({ icon: 'event', title: `Due ${formatDate(task.dueAt)}`, subtitle: null, time: formatTime(task.dueAt) });
    }

    return entries;
  }

  create(draft: TaskDraft): Task {
    const task: Task = {
      id: this.nextId++,
      type: draft.type,
      title: draft.title,
      description: draft.description,
      relatedTo: draft.relatedTo,
      leadId: draft.leadId,
      priority: draft.priority,
      dueAt: draft.dueAt,
      status: 'pending',
      completedAt: null,
      createdAt: NOW.toISOString(),
    };

    this._tasks.update((current) => [task, ...current]);
    return task;
  }

  complete(id: number): void {
    this._tasks.update((current) =>
      current.map((task) => (task.id === id ? { ...task, status: 'completed', completedAt: NOW.toISOString() } : task)),
    );
  }

  cancel(id: number): void {
    this._tasks.update((current) =>
      current.map((task) => (task.id === id ? { ...task, status: 'cancelled' } : task)),
    );
  }

  reschedule(id: number, dueAt: string): void {
    this._tasks.update((current) => current.map((task) => (task.id === id ? { ...task, dueAt } : task)));
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
