import { Injectable, signal } from '@angular/core';

export type CustomerStatus = 'active' | 'prospect' | 'inactive';
export type CustomerSegment = 'Retail' | 'SME' | 'Corporate';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  notes: string | null;
  /** Lead ids (from `ManagerLeadDataProvider`) this customer is linked to. */
  linked_lead_ids: number[];
  created_at: string;
}

export interface CustomerDraft {
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  notes: string | null;
}

export interface CustomerInteraction {
  id: number;
  icon: string;
  title: string;
  subtitle: string | null;
  at: string;
}

export interface CustomerNote {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

const NOW = new Date('2026-08-15T10:00:00+05:30');

function daysAgoIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - days);
  return at.toISOString();
}

const SEED_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Rohan Kulkarni', email: 'rohan.kulkarni@example.com', phone: '+91 90101 20006', segment: 'SME', status: 'prospect', notes: null, linked_lead_ids: [6], created_at: daysAgoIso(7) },
  { id: 2, name: 'Kabir Malhotra', email: 'kabir.malhotra@example.com', phone: '+91 90101 20010', segment: 'Retail', status: 'prospect', notes: null, linked_lead_ids: [10], created_at: daysAgoIso(11) },
  { id: 3, name: 'Yusuf Sheikh', email: 'yusuf.sheikh@example.com', phone: '+91 90101 20014', segment: 'Retail', status: 'prospect', notes: 'Prefers to be contacted by email.', linked_lead_ids: [14], created_at: daysAgoIso(17) },
  { id: 4, name: 'Vikram Oberoi', email: 'vikram.oberoi@example.com', phone: '+91 90101 20018', segment: 'SME', status: 'prospect', notes: null, linked_lead_ids: [18], created_at: daysAgoIso(22) },
  { id: 5, name: "Simone D'Souza", email: 'simone.dsouza@example.com', phone: '+91 90101 20022', segment: 'Retail', status: 'active', notes: 'Existing customer, disbursed auto loan.', linked_lead_ids: [22], created_at: daysAgoIso(30) },
  { id: 6, name: 'Kritika Suri', email: 'kritika.suri@example.com', phone: '+91 90101 20026', segment: 'SME', status: 'inactive', notes: 'Application rejected — did not meet eligibility.', linked_lead_ids: [26], created_at: daysAgoIso(27) },
];

const SEED_INTERACTIONS: Record<number, CustomerInteraction[]> = {
  1: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(7) },
    { id: 2, icon: 'call', title: 'Called re: loan status', subtitle: 'Discussed document requirements', at: daysAgoIso(5) },
    { id: 3, icon: 'mail', title: 'Email sent', subtitle: 'Reminder to upload bank statement', at: daysAgoIso(1) },
  ],
  2: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(11) },
    { id: 2, icon: 'mail', title: 'Welcome email sent', subtitle: null, at: daysAgoIso(10) },
  ],
  3: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(17) },
    { id: 2, icon: 'mail', title: 'Email sent', subtitle: 'Requested updated bank statement', at: daysAgoIso(4) },
    { id: 3, icon: 'mail', title: 'Email sent', subtitle: 'Second reminder — no response yet', at: daysAgoIso(2) },
  ],
  4: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(22) },
    { id: 2, icon: 'call', title: 'Called re: business documents', subtitle: 'GST returns pending', at: daysAgoIso(6) },
  ],
  5: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(30) },
    { id: 2, icon: 'call', title: 'Called to confirm approval', subtitle: null, at: daysAgoIso(10) },
    { id: 3, icon: 'paid', title: 'Loan disbursed', subtitle: '₹7,90,000', at: daysAgoIso(3) },
  ],
  6: [
    { id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: daysAgoIso(27) },
    { id: 2, icon: 'cancel', title: 'Application rejected', subtitle: 'Did not meet minimum eligibility criteria', at: daysAgoIso(18) },
  ],
};

const SEED_NOTES: Record<number, CustomerNote[]> = {
  1: [{ id: 1, author: 'Amit Sharma', text: 'Prefers WhatsApp updates over phone calls.', created_at: daysAgoIso(5) }],
  5: [{ id: 1, author: 'Amit Sharma', text: 'Long-standing customer — fast-track any future applications.', created_at: daysAgoIso(20) }],
};

/**
 * Centralized mock state for the Customer Management module. A single
 * root-provided instance backs the Customer list and Customer Profile page —
 * no service, no HTTP. Customers are their own entities (not derived from
 * Lead on every read) so newly added customers persist independently of any
 * lead. `logInteraction` is also called by `CustomerDocumentDataProvider`
 * after an upload, so Activity History stays the one place that shows
 * everything that happened for a customer.
 */
@Injectable({ providedIn: 'root' })
export class CustomerDataProvider {
  private readonly _customers = signal<Customer[]>(SEED_CUSTOMERS);
  private readonly _interactions = signal<Record<number, CustomerInteraction[]>>(SEED_INTERACTIONS);
  private readonly _notes = signal<Record<number, CustomerNote[]>>(SEED_NOTES);
  private nextId = SEED_CUSTOMERS.length + 1;

  readonly customers = this._customers.asReadonly();

  getById(id: number): Customer | undefined {
    return this._customers().find((customer) => customer.id === id);
  }

  interactionsFor(id: number): CustomerInteraction[] {
    return this._interactions()[id] ?? [];
  }

  notesFor(id: number): CustomerNote[] {
    return this._notes()[id] ?? [];
  }

  addNote(customerId: number, text: string, author = 'You'): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const note: CustomerNote = { id: (this.notesFor(customerId).at(-1)?.id ?? 0) + 1, author, text: trimmed, created_at: NOW.toISOString() };
    this._notes.update((current) => ({ ...current, [customerId]: [note, ...(current[customerId] ?? [])] }));
    this.logInteraction(customerId, { icon: 'edit_note', title: 'Note added', subtitle: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed });
  }

  /** Appends one entry to a customer's Activity History timeline. */
  logInteraction(customerId: number, entry: Omit<CustomerInteraction, 'id' | 'at'>): void {
    const entries = this.interactionsFor(customerId);
    const interaction: CustomerInteraction = { id: (entries.at(-1)?.id ?? 0) + 1, at: NOW.toISOString(), ...entry };
    this._interactions.update((current) => ({ ...current, [customerId]: [...(current[customerId] ?? []), interaction] }));
  }

  create(draft: CustomerDraft): Customer {
    const customer: Customer = {
      id: this.nextId++,
      ...draft,
      status: 'prospect',
      linked_lead_ids: [],
      created_at: NOW.toISOString(),
    };

    this._customers.update((current) => [customer, ...current]);
    this._interactions.update((current) => ({
      ...current,
      [customer.id]: [{ id: 1, icon: 'person_add', title: 'Customer record created', subtitle: null, at: NOW.toISOString() }],
    }));

    return customer;
  }

  update(id: number, draft: CustomerDraft): void {
    this._customers.update((current) => current.map((customer) => (customer.id === id ? { ...customer, ...draft } : customer)));
  }
}
