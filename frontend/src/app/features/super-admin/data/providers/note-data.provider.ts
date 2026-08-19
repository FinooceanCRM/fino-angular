import { Injectable, signal } from '@angular/core';

import { LeadNote } from '../models/note.model';

function daysAgoIso(days: number): string {
  const reference = new Date('2026-08-16T10:00:00+05:30');
  reference.setDate(reference.getDate() - days);
  return reference.toISOString();
}

const SEED_NOTES: LeadNote[] = [
  { id: 1, lead_id: 1, author_name: 'Amit Sharma', author_role: 'Employee', body: 'Spoke with the applicant — documents will follow by end of week.', created_at: daysAgoIso(1) },
  { id: 2, lead_id: 3, author_name: 'Farhan Ali', author_role: 'Employee', body: 'Applicant requested a callback after 6 PM — business loan, GST returns pending.', created_at: daysAgoIso(1) },
  { id: 3, lead_id: 3, author_name: 'Priya Nair', author_role: 'Relationship Manager', body: 'Reviewed with the team — proceed once GST returns are in.', created_at: daysAgoIso(0) },
  { id: 4, lead_id: 17, author_name: 'Farhan Ali', author_role: 'Employee', body: 'Auto loan — dealer quote attached separately, awaiting income proof.', created_at: daysAgoIso(4) },
  { id: 5, lead_id: 28, author_name: 'Arjun Mehta', author_role: 'Super Admin', body: 'Disbursed on schedule. Connector commission accrued and queued for payout.', created_at: daysAgoIso(40) },
];

/** Centralized, mutable notes per lead — the one record type here that genuinely supports add/delete. */
@Injectable({ providedIn: 'root' })
export class NoteDataProvider {
  private readonly _notes = signal<LeadNote[]>(SEED_NOTES);
  private nextId = 1000;

  readonly notes = this._notes.asReadonly();

  notesFor(leadId: number): LeadNote[] {
    return this._notes()
      .filter((note) => note.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addNote(leadId: number, authorName: string, authorRole: string, body: string): void {
    const note: LeadNote = {
      id: this.nextId++,
      lead_id: leadId,
      author_name: authorName,
      author_role: authorRole,
      body,
      created_at: new Date().toISOString(),
    };
    this._notes.update((current) => [note, ...current]);
  }

  deleteNote(id: number): void {
    this._notes.update((current) => current.filter((note) => note.id !== id));
  }
}
