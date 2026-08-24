import { Injectable, signal } from '@angular/core';

import {
  AssignableStaff,
  AssignmentHistoryEntry,
  Lead,
  LeadStatusHistoryEntry,
  UserSummary,
  leadStatusMeta,
} from '../models/lead.model';

const NOW = new Date('2026-08-15T10:00:00+05:30');

/** Mirrors App\Enums\Department::fromLoanType on the backend. */
const DEPARTMENT_BY_LOAN_TYPE: Record<string, { value: string; label: string }> = {
  home: { value: 'home_loan', label: 'Home Loan (HL)' },
  loan_against_property: { value: 'mortgage_loan', label: 'Mortgage Loan (ML)' },
};
const DEFAULT_DEPARTMENT = { value: 'personal_loan', label: 'Personal Loan (PL)' };
function deriveDepartment(loanType: string): { value: string; label: string } {
  return DEPARTMENT_BY_LOAN_TYPE[loanType] ?? DEFAULT_DEPARTMENT;
}

const STAFF = {
  manager: { id: 101, name: 'Rahul Mehta', email: 'rahul.mehta@finoocean.com', role: 'manager' } satisfies UserSummary,
  rm1: { id: 111, name: 'Priya Nair', email: 'priya.nair@finoocean.com', role: 'relationship_manager' } satisfies UserSummary,
  rm2: { id: 112, name: 'Sameer Khan', email: 'sameer.khan@finoocean.com', role: 'relationship_manager' } satisfies UserSummary,
  emp1: { id: 121, name: 'Amit Sharma', email: 'amit.sharma@finoocean.com', role: 'employee' } satisfies UserSummary,
  emp2: { id: 122, name: 'Farhan Ali', email: 'farhan.ali@finoocean.com', role: 'employee' } satisfies UserSummary,
  emp3: { id: 123, name: 'Sneha Bhatt', email: 'sneha.bhatt@finoocean.com', role: 'employee' } satisfies UserSummary,
  emp4: { id: 124, name: 'Karan Verma', email: 'karan.verma@finoocean.com', role: 'employee' } satisfies UserSummary,
  // ids 25/26 match the platform's canonical banker directory (Super Admin's UserDataProvider) so Banker Management's numbers agree across pages.
  banker1: { id: 25, name: 'Vivek Joshi', email: 'vivek.joshi@hdfcbank.com', role: 'banker' } satisfies UserSummary,
  banker2: { id: 26, name: 'Swati Menon', email: 'swati.menon@icicibank.com', role: 'banker' } satisfies UserSummary,
  connector1: { id: 141, name: 'Suresh Patil', email: 'suresh.patil@partner.com', role: 'connector' } satisfies UserSummary,
  connector2: { id: 142, name: 'Zoya Ahmed', email: 'zoya.ahmed@partner.com', role: 'connector' } satisfies UserSummary,
};

/** Which RM each employee reports to — used to keep the RM column consistent on reassignment. */
const RM_OF: Record<number, UserSummary> = {
  [STAFF.emp1.id]: STAFF.rm1,
  [STAFF.emp2.id]: STAFF.rm1,
  [STAFF.emp3.id]: STAFF.rm2,
  [STAFF.emp4.id]: STAFF.rm2,
};

function daysAgoIso(days: number): string {
  const at = new Date(NOW);
  at.setDate(at.getDate() - days);
  return at.toISOString();
}

interface LeadSeed {
  id: number;
  name: string;
  phone: string;
  loanType: string;
  amount: number;
  city: string;
  state: string;
  status: string;
  daysAgo: number;
  connector?: UserSummary;
  employee?: UserSummary;
  rm?: UserSummary;
  banker?: UserSummary;
}

const SEEDS: LeadSeed[] = [
  { id: 1, name: 'Devika Menon', phone: '+91 90101 20001', loanType: 'home', amount: 3800000, city: 'Mumbai', state: 'Maharashtra', status: 'new', daysAgo: 1, connector: STAFF.connector1 },
  { id: 2, name: 'Arjun Kapoor', phone: '+91 90101 20002', loanType: 'personal', amount: 450000, city: 'Bengaluru', state: 'Karnataka', status: 'new', daysAgo: 1 },
  { id: 3, name: 'Lavanya Reddy', phone: '+91 90101 20003', loanType: 'business', amount: 2900000, city: 'Hyderabad', state: 'Telangana', status: 'new', daysAgo: 2, connector: STAFF.connector2 },
  { id: 4, name: 'Nikhil Joshi', phone: '+91 90101 20004', loanType: 'auto', amount: 820000, city: 'Pune', state: 'Maharashtra', status: 'new', daysAgo: 2 },
  { id: 5, name: 'Sanya Bhatia', phone: '+91 90101 20005', loanType: 'education', amount: 1100000, city: 'Delhi', state: 'Delhi', status: 'new', daysAgo: 3 },

  { id: 6, name: 'Rohan Kulkarni', phone: '+91 90101 20006', loanType: 'loan_against_property', amount: 6100000, city: 'Pune', state: 'Maharashtra', status: 'assigned', daysAgo: 5, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 7, name: 'Ishita Verma', phone: '+91 90101 20007', loanType: 'home', amount: 4900000, city: 'Mumbai', state: 'Maharashtra', status: 'assigned', daysAgo: 6, employee: STAFF.emp2, rm: STAFF.rm1 },
  { id: 8, name: 'Varun Choudhary', phone: '+91 90101 20008', loanType: 'personal', amount: 380000, city: 'Jaipur', state: 'Rajasthan', status: 'assigned', daysAgo: 6, employee: STAFF.emp3, rm: STAFF.rm2 },
  { id: 9, name: 'Ananya Sinha', phone: '+91 90101 20009', loanType: 'business', amount: 2600000, city: 'Kolkata', state: 'West Bengal', status: 'assigned', daysAgo: 8, employee: STAFF.emp4, rm: STAFF.rm2, connector: STAFF.connector1 },
  { id: 10, name: 'Kabir Malhotra', phone: '+91 90101 20010', loanType: 'auto', amount: 690000, city: 'Bengaluru', state: 'Karnataka', status: 'assigned', daysAgo: 9, employee: STAFF.emp1, rm: STAFF.rm1 },

  { id: 11, name: 'Riya Chatterjee', phone: '+91 90101 20011', loanType: 'home', amount: 4500000, city: 'Kolkata', state: 'West Bengal', status: 'in_progress', daysAgo: 10, employee: STAFF.emp2, rm: STAFF.rm1 },
  { id: 12, name: 'Aryan Deshmukh', phone: '+91 90101 20012', loanType: 'business', amount: 3400000, city: 'Pune', state: 'Maharashtra', status: 'in_progress', daysAgo: 12, employee: STAFF.emp3, rm: STAFF.rm2, connector: STAFF.connector2 },
  { id: 13, name: 'Meher Kaur', phone: '+91 90101 20013', loanType: 'education', amount: 850000, city: 'Lucknow', state: 'Uttar Pradesh', status: 'in_progress', daysAgo: 13, employee: STAFF.emp4, rm: STAFF.rm2 },
  { id: 14, name: 'Yusuf Sheikh', phone: '+91 90101 20014', loanType: 'personal', amount: 560000, city: 'Hyderabad', state: 'Telangana', status: 'in_progress', daysAgo: 15, employee: STAFF.emp1, rm: STAFF.rm1 },

  { id: 15, name: 'Diya Pillai', phone: '+91 90101 20015', loanType: 'loan_against_property', amount: 6900000, city: 'Ahmedabad', state: 'Gujarat', status: 'documents_pending', daysAgo: 16, employee: STAFF.emp2, rm: STAFF.rm1 },
  { id: 16, name: 'Aditya Rathore', phone: '+91 90101 20016', loanType: 'home', amount: 3700000, city: 'Jaipur', state: 'Rajasthan', status: 'documents_pending', daysAgo: 17, employee: STAFF.emp3, rm: STAFF.rm2 },
  { id: 17, name: 'Neha Iyer', phone: '+91 90101 20017', loanType: 'auto', amount: 610000, city: 'Chennai', state: 'Tamil Nadu', status: 'documents_pending', daysAgo: 18, employee: STAFF.emp4, rm: STAFF.rm2, connector: STAFF.connector1 },

  { id: 18, name: 'Vikram Oberoi', phone: '+91 90101 20018', loanType: 'business', amount: 3900000, city: 'Mumbai', state: 'Maharashtra', status: 'under_review', daysAgo: 20, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 19, name: 'Pooja Nambiar', phone: '+91 90101 20019', loanType: 'home', amount: 5300000, city: 'Chennai', state: 'Tamil Nadu', status: 'under_review', daysAgo: 22, employee: STAFF.emp2, rm: STAFF.rm1 },

  { id: 20, name: 'Tanya Bajaj', phone: '+91 90101 20020', loanType: 'personal', amount: 520000, city: 'Delhi', state: 'Delhi', status: 'approved', daysAgo: 24, employee: STAFF.emp3, rm: STAFF.rm2, banker: STAFF.banker1 },
  { id: 21, name: 'Rahul Saxena', phone: '+91 90101 20021', loanType: 'home', amount: 4400000, city: 'Lucknow', state: 'Uttar Pradesh', status: 'approved', daysAgo: 26, employee: STAFF.emp4, rm: STAFF.rm2, banker: STAFF.banker2 },
  { id: 22, name: "Simone D'Souza", phone: '+91 90101 20022', loanType: 'auto', amount: 790000, city: 'Mumbai', state: 'Maharashtra', status: 'approved', daysAgo: 28, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker1 },
  { id: 23, name: 'Harsh Vardhan', phone: '+91 90101 20023', loanType: 'business', amount: 3100000, city: 'Bengaluru', state: 'Karnataka', status: 'approved', daysAgo: 30, employee: STAFF.emp2, rm: STAFF.rm1, banker: STAFF.banker2, connector: STAFF.connector2 },

  { id: 24, name: 'Aisha Khan', phone: '+91 90101 20024', loanType: 'education', amount: 1050000, city: 'Hyderabad', state: 'Telangana', status: 'rejected', daysAgo: 18, employee: STAFF.emp3, rm: STAFF.rm2, banker: STAFF.banker1 },
  { id: 25, name: 'Manish Tiwari', phone: '+91 90101 20025', loanType: 'personal', amount: 670000, city: 'Pune', state: 'Maharashtra', status: 'rejected', daysAgo: 21, employee: STAFF.emp4, rm: STAFF.rm2, banker: STAFF.banker2 },
  { id: 26, name: 'Kritika Suri', phone: '+91 90101 20026', loanType: 'loan_against_property', amount: 5600000, city: 'Ahmedabad', state: 'Gujarat', status: 'rejected', daysAgo: 25, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker1 },

  { id: 27, name: 'Om Bansal', phone: '+91 90101 20027', loanType: 'home', amount: 4100000, city: 'Delhi', state: 'Delhi', status: 'disbursed', daysAgo: 40, employee: STAFF.emp2, rm: STAFF.rm1, banker: STAFF.banker2 },
  { id: 28, name: 'Preeti Chawla', phone: '+91 90101 20028', loanType: 'business', amount: 3500000, city: 'Pune', state: 'Maharashtra', status: 'disbursed', daysAgo: 45, employee: STAFF.emp3, rm: STAFF.rm2, banker: STAFF.banker1 },

  { id: 29, name: 'Naveen Kohli', phone: '+91 90101 20029', loanType: 'personal', amount: 410000, city: 'Mumbai', state: 'Maharashtra', status: 'closed', daysAgo: 50, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker1 },
  { id: 30, name: 'Ritika Anand', phone: '+91 90101 20030', loanType: 'education', amount: 950000, city: 'Bengaluru', state: 'Karnataka', status: 'closed', daysAgo: 35, employee: STAFF.emp2, rm: STAFF.rm1, banker: STAFF.banker2 },
];

function buildLead(seed: LeadSeed): Lead {
  const meta = leadStatusMeta(seed.status);
  const createdAt = daysAgoIso(seed.daysAgo);
  const department = deriveDepartment(seed.loanType);

  return {
    id: seed.id,
    reference: `MG-2408${String(1000 + seed.id).padStart(6, '0')}`,
    applicant_name: seed.name,
    applicant_email: seed.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.') + '@example.com',
    applicant_phone: seed.phone,
    loan_type: seed.loanType,
    department: department.value,
    department_label: department.label,
    loan_amount: seed.amount,
    tenure_months: seed.loanType === 'personal' ? 36 : seed.loanType === 'auto' ? 60 : 180,
    monthly_income: Math.round(seed.amount / 55),
    credit_score: 660 + ((seed.id * 11) % 140),
    employment_type: seed.id % 3 === 0 ? 'self_employed' : 'salaried',
    city: seed.city,
    state: seed.state,
    pincode: '400001',
    status: seed.status,
    status_label: meta.label,
    status_colour: meta.colour ?? 'default',
    notes: null,
    details: null,
    connector: seed.connector ?? null,
    assigned_employee: seed.employee ?? null,
    assigned_relationship_manager: seed.rm ?? null,
    assigned_manager: seed.employee ? STAFF.manager : null,
    assigned_banker: seed.banker ?? null,
    assigned_telecaller: null,
    created_by: seed.connector ?? seed.employee ?? null,
    updated_by: seed.employee ?? null,
    pd_completed_at: null,
    pd_completed_by: null,
    pd_details: null,
    created_at: createdAt,
    updated_at: createdAt,
    full_access: true,
    match_score: null,
    can_change_status: true,
    can_assign: true,
    can_submit_pd: false,
  };
}

const SEED_LEADS: Lead[] = SEEDS.map(buildLead);

/** Linear status progressions used to synthesise a plausible timeline for the Lead Timeline page. */
const PROGRESSION: Record<string, string[]> = {
  new: ['new'],
  assigned: ['new', 'assigned'],
  in_progress: ['new', 'assigned', 'in_progress'],
  documents_pending: ['new', 'assigned', 'in_progress', 'documents_pending'],
  under_review: ['new', 'assigned', 'in_progress', 'documents_pending', 'under_review'],
  approved: ['new', 'assigned', 'in_progress', 'under_review', 'approved'],
  rejected: ['new', 'assigned', 'in_progress', 'under_review', 'rejected'],
  disbursed: ['new', 'assigned', 'in_progress', 'under_review', 'approved', 'disbursed'],
  closed: ['new', 'assigned', 'in_progress', 'under_review', 'approved', 'disbursed', 'closed'],
};

const REMARKS: Record<string, string> = {
  new: 'Lead captured from the enquiry form.',
  assigned: 'Assigned for follow-up.',
  in_progress: 'Applicant contacted, collecting details.',
  documents_pending: 'Awaiting KYC and income documents.',
  under_review: 'Documents received, under credit review.',
  approved: 'Approved by the credit team.',
  rejected: 'Did not meet minimum eligibility criteria.',
  disbursed: 'Loan amount disbursed to the applicant.',
  closed: 'Loan file closed — no further action required.',
};

/** Every RM and Employee the manager is allowed to hand a lead to. */
const ASSIGNABLE_STAFF: AssignableStaff[] = [
  { ...STAFF.rm1, role_label: 'Relationship Manager' },
  { ...STAFF.rm2, role_label: 'Relationship Manager' },
  { ...STAFF.emp1, role_label: 'Employee · reports to Priya Nair' },
  { ...STAFF.emp2, role_label: 'Employee · reports to Priya Nair' },
  { ...STAFF.emp3, role_label: 'Employee · reports to Sameer Khan' },
  { ...STAFF.emp4, role_label: 'Employee · reports to Sameer Khan' },
];

function seedAssignmentHistory(lead: Lead): AssignmentHistoryEntry[] {
  if (!lead.assigned_employee) {
    return [];
  }

  const assignedAt = new Date(lead.created_at ?? NOW);
  assignedAt.setDate(assignedAt.getDate() + 1);

  return [
    {
      id: lead.id * 10 + 1,
      assignee: lead.assigned_employee,
      assigned_by: lead.assigned_relationship_manager ?? STAFF.manager,
      remarks: 'Initial assignment.',
      created_at: assignedAt.toISOString(),
    },
  ];
}

/**
 * Centralized mock state for the Manager module's Lead Management pages.
 * A single root-provided instance backs every leads bucket (All / New /
 * Assigned / Processing / Approved / Disbursed / Rejected), Lead Details,
 * Lead Timeline and Lead Assignment — no service, no HTTP.
 */
@Injectable({ providedIn: 'root' })
export class ManagerLeadDataProvider {
  private readonly _leads = signal<Lead[]>(SEED_LEADS);
  private readonly _assignmentHistory = signal<Record<number, AssignmentHistoryEntry[]>>(
    Object.fromEntries(SEED_LEADS.map((lead) => [lead.id, seedAssignmentHistory(lead)])),
  );

  readonly leads = this._leads.asReadonly();
  readonly assignableStaff = ASSIGNABLE_STAFF;
  readonly manager = STAFF.manager;

  getById(id: number): Lead | undefined {
    return this._leads().find((lead) => lead.id === id);
  }

  /** Employees reporting to a given RM — the reassignment pool for an RM-scoped lead view. */
  employeesOfRm(rmId: number): AssignableStaff[] {
    return ASSIGNABLE_STAFF.filter((person) => person.role === 'employee' && RM_OF[person.id]?.id === rmId);
  }

  /** Synthesises a plausible status-change timeline for a lead from its current status. */
  historyFor(lead: Lead): LeadStatusHistoryEntry[] {
    const steps = PROGRESSION[lead.status] ?? [lead.status];
    const created = new Date(lead.created_at ?? NOW).getTime();
    const span = Math.max(NOW.getTime() - created, steps.length * 60 * 60 * 1000);

    return steps.map((step, index) => {
      const changedBy =
        step === 'new'
          ? (lead.connector?.name ?? lead.created_by?.name ?? 'System')
          : (lead.assigned_employee?.name ?? lead.assigned_relationship_manager?.name ?? 'System');

      const at = new Date(created + (span * index) / Math.max(steps.length - 1, 1));

      return {
        id: index + 1,
        from_status: index === 0 ? null : steps[index - 1],
        to_status: step,
        remarks: REMARKS[step] ?? null,
        changed_by: changedBy,
        created_at: at.toISOString(),
      };
    });
  }

  assignmentHistoryFor(leadId: number): AssignmentHistoryEntry[] {
    return this._assignmentHistory()[leadId] ?? [];
  }

  /** Reassigns one lead to a new RM or Employee, recording it in the assignment history. */
  reassign(leadId: number, assignee: AssignableStaff, remarks: string | null): void {
    const isEmployee = assignee.role === 'employee';

    this._leads.update((current) =>
      current.map((lead) => {
        if (lead.id !== leadId) {
          return lead;
        }

        const meta = lead.status === 'new' ? leadStatusMeta('assigned') : leadStatusMeta(lead.status);

        return {
          ...lead,
          assigned_employee: isEmployee ? assignee : null,
          assigned_relationship_manager: isEmployee ? (RM_OF[assignee.id] ?? assignee) : assignee,
          assigned_manager: STAFF.manager,
          status: meta.value,
          status_label: meta.label,
          status_colour: meta.colour ?? 'default',
          updated_at: NOW.toISOString(),
        };
      }),
    );

    this._assignmentHistory.update((current) => {
      const entries = current[leadId] ?? [];
      const entry: AssignmentHistoryEntry = {
        id: (entries.at(-1)?.id ?? leadId * 10) + 1,
        assignee,
        assigned_by: STAFF.manager,
        remarks: remarks?.trim() || 'Reassigned.',
        created_at: NOW.toISOString(),
      };
      return { ...current, [leadId]: [...entries, entry] };
    });
  }

  /** Reassigns every lead in `leadIds` to the same RM or Employee — backs the bulk-action bar. */
  bulkReassign(leadIds: number[], assignee: AssignableStaff, remarks: string | null): void {
    for (const id of leadIds) {
      this.reassign(id, assignee, remarks);
    }
  }

  /** Assigns (or clears, when `banker` is null) the banker responsible for a lead — backs Lead Requests. */
  assignBanker(leadId: number, banker: UserSummary | null): void {
    this._leads.update((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, assigned_banker: banker, updated_at: NOW.toISOString() } : lead)),
    );
  }
}
