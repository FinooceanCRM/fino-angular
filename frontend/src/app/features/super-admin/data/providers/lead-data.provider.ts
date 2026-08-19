import { Injectable, inject, signal } from '@angular/core';

import { Lead, LeadStatusHistoryEntry, UserSummary, leadStatusMeta } from '../models/lead.model';
import { AuditLogDataProvider } from './audit-log-data.provider';

const STAFF = {
  manager: { id: 1, name: 'Rahul Mehta', email: 'rahul.mehta@finoocean.com', role: 'manager' } satisfies UserSummary,
  rm1: { id: 7, name: 'Priya Nair', email: 'priya.nair@finoocean.com', role: 'relationship_manager' } satisfies UserSummary,
  rm2: { id: 8, name: 'Sameer Khan', email: 'sameer.khan@finoocean.com', role: 'relationship_manager' } satisfies UserSummary,
  emp1: { id: 13, name: 'Amit Sharma', email: 'amit.sharma@finoocean.com', role: 'employee' } satisfies UserSummary,
  emp2: { id: 14, name: 'Farhan Ali', email: 'farhan.ali@finoocean.com', role: 'employee' } satisfies UserSummary,
  connector1: { id: 19, name: 'Suresh Patil', email: 'suresh.patil@partner.com', role: 'connector' } satisfies UserSummary,
  connector2: { id: 20, name: 'Zoya Ahmed', email: 'zoya.ahmed@partner.com', role: 'connector' } satisfies UserSummary,
  banker: { id: 25, name: 'Vivek Joshi', email: 'vivek.joshi@hdfcbank.com', role: 'banker' } satisfies UserSummary,
};

/** Mirrors App\Enums\Department::fromLoanType on the backend. */
const DEPARTMENT_BY_LOAN_TYPE: Record<string, { value: string; label: string }> = {
  home: { value: 'home_loan', label: 'Home Loan (HL)' },
  loan_against_property: { value: 'mortgage_loan', label: 'Mortgage Loan (ML)' },
};
const DEFAULT_DEPARTMENT = { value: 'personal_loan', label: 'Personal Loan (PL)' };
function deriveDepartment(loanType: string): { value: string; label: string } {
  return DEPARTMENT_BY_LOAN_TYPE[loanType] ?? DEFAULT_DEPARTMENT;
}

function daysAgoIso(days: number): string {
  const reference = new Date('2026-08-15T10:00:00+05:30');
  reference.setDate(reference.getDate() - days);
  return reference.toISOString();
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
  { id: 1, name: 'Aditya Rao', phone: '+91 90001 10001', loanType: 'home', amount: 4200000, city: 'Mumbai', state: 'Maharashtra', status: 'new', daysAgo: 1, connector: STAFF.connector1 },
  { id: 2, name: 'Meera Nair', phone: '+91 90001 10002', loanType: 'personal', amount: 500000, city: 'Bengaluru', state: 'Karnataka', status: 'new', daysAgo: 1 },
  { id: 3, name: 'Karthik Iyer', phone: '+91 90001 10003', loanType: 'business', amount: 3200000, city: 'Delhi', state: 'Delhi', status: 'new', daysAgo: 2, connector: STAFF.connector2 },
  { id: 4, name: 'Sneha Kulkarni', phone: '+91 90001 10004', loanType: 'auto', amount: 900000, city: 'Pune', state: 'Maharashtra', status: 'new', daysAgo: 2 },
  { id: 5, name: 'Rohit Malhotra', phone: '+91 90001 10005', loanType: 'education', amount: 1200000, city: 'Chennai', state: 'Tamil Nadu', status: 'new', daysAgo: 3 },

  { id: 6, name: 'Fatima Sheikh', phone: '+91 90001 10006', loanType: 'loan_against_property', amount: 6500000, city: 'Hyderabad', state: 'Telangana', status: 'assigned', daysAgo: 5, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 7, name: 'Aarav Shah', phone: '+91 90001 10007', loanType: 'home', amount: 5100000, city: 'Ahmedabad', state: 'Gujarat', status: 'assigned', daysAgo: 6, employee: STAFF.emp2, rm: STAFF.rm2 },
  { id: 8, name: 'Isha Bhatt', phone: '+91 90001 10008', loanType: 'personal', amount: 400000, city: 'Jaipur', state: 'Rajasthan', status: 'assigned', daysAgo: 6, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 9, name: 'Naveen Reddy', phone: '+91 90001 10009', loanType: 'business', amount: 2800000, city: 'Mumbai', state: 'Maharashtra', status: 'assigned', daysAgo: 8, employee: STAFF.emp2, rm: STAFF.rm2, connector: STAFF.connector1 },
  { id: 10, name: 'Pooja Desai', phone: '+91 90001 10010', loanType: 'auto', amount: 750000, city: 'Bengaluru', state: 'Karnataka', status: 'assigned', daysAgo: 9, employee: STAFF.emp1, rm: STAFF.rm1 },

  { id: 11, name: 'Siddharth Jain', phone: '+91 90001 10011', loanType: 'home', amount: 4800000, city: 'Delhi', state: 'Delhi', status: 'in_progress', daysAgo: 10, employee: STAFF.emp2, rm: STAFF.rm2 },
  { id: 12, name: 'Ritika Chawla', phone: '+91 90001 10012', loanType: 'business', amount: 3600000, city: 'Pune', state: 'Maharashtra', status: 'in_progress', daysAgo: 12, employee: STAFF.emp1, rm: STAFF.rm1, connector: STAFF.connector2 },
  { id: 13, name: 'Manoj Pillai', phone: '+91 90001 10013', loanType: 'education', amount: 900000, city: 'Chennai', state: 'Tamil Nadu', status: 'in_progress', daysAgo: 13, employee: STAFF.emp2, rm: STAFF.rm2 },
  { id: 14, name: 'Ayesha Khan', phone: '+91 90001 10014', loanType: 'personal', amount: 600000, city: 'Hyderabad', state: 'Telangana', status: 'in_progress', daysAgo: 15, employee: STAFF.emp1, rm: STAFF.rm1 },

  { id: 15, name: 'Vikas Agarwal', phone: '+91 90001 10015', loanType: 'loan_against_property', amount: 7200000, city: 'Ahmedabad', state: 'Gujarat', status: 'documents_pending', daysAgo: 16, employee: STAFF.emp2, rm: STAFF.rm2 },
  { id: 16, name: 'Tanvi Rao', phone: '+91 90001 10016', loanType: 'home', amount: 3900000, city: 'Jaipur', state: 'Rajasthan', status: 'documents_pending', daysAgo: 17, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 17, name: 'Harshad Patel', phone: '+91 90001 10017', loanType: 'auto', amount: 650000, city: 'Mumbai', state: 'Maharashtra', status: 'documents_pending', daysAgo: 18, employee: STAFF.emp2, rm: STAFF.rm2, connector: STAFF.connector1 },

  { id: 18, name: 'Nandini Menon', phone: '+91 90001 10018', loanType: 'business', amount: 4100000, city: 'Bengaluru', state: 'Karnataka', status: 'under_review', daysAgo: 20, employee: STAFF.emp1, rm: STAFF.rm1 },
  { id: 19, name: 'Ravi Verma', phone: '+91 90001 10019', loanType: 'home', amount: 5600000, city: 'Delhi', state: 'Delhi', status: 'under_review', daysAgo: 22, employee: STAFF.emp2, rm: STAFF.rm2 },

  { id: 20, name: 'Simran Kaur', phone: '+91 90001 10020', loanType: 'personal', amount: 550000, city: 'Pune', state: 'Maharashtra', status: 'approved', daysAgo: 24, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker },
  { id: 21, name: 'Ashwin Kumar', phone: '+91 90001 10021', loanType: 'home', amount: 4700000, city: 'Chennai', state: 'Tamil Nadu', status: 'approved', daysAgo: 26, employee: STAFF.emp2, rm: STAFF.rm2, banker: STAFF.banker },
  { id: 22, name: 'Bhavna Shetty', phone: '+91 90001 10022', loanType: 'auto', amount: 820000, city: 'Hyderabad', state: 'Telangana', status: 'approved', daysAgo: 28, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker },
  { id: 23, name: 'Gaurav Malhotra', phone: '+91 90001 10023', loanType: 'business', amount: 3300000, city: 'Ahmedabad', state: 'Gujarat', status: 'approved', daysAgo: 30, employee: STAFF.emp2, rm: STAFF.rm2, banker: STAFF.banker, connector: STAFF.connector2 },

  { id: 24, name: 'Priyanka Singh', phone: '+91 90001 10024', loanType: 'education', amount: 1100000, city: 'Jaipur', state: 'Rajasthan', status: 'rejected', daysAgo: 18, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker },
  { id: 25, name: 'Yash Trivedi', phone: '+91 90001 10025', loanType: 'personal', amount: 700000, city: 'Mumbai', state: 'Maharashtra', status: 'rejected', daysAgo: 21, employee: STAFF.emp2, rm: STAFF.rm2, banker: STAFF.banker },
  { id: 26, name: 'Alisha Fernandes', phone: '+91 90001 10026', loanType: 'loan_against_property', amount: 5900000, city: 'Bengaluru', state: 'Karnataka', status: 'rejected', daysAgo: 25, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker },

  { id: 27, name: 'Om Prakash', phone: '+91 90001 10027', loanType: 'home', amount: 4400000, city: 'Delhi', state: 'Delhi', status: 'disbursed', daysAgo: 40, employee: STAFF.emp2, rm: STAFF.rm2, banker: STAFF.banker },
  { id: 28, name: 'Radhika Iyer', phone: '+91 90001 10028', loanType: 'business', amount: 3700000, city: 'Pune', state: 'Maharashtra', status: 'disbursed', daysAgo: 45, employee: STAFF.emp1, rm: STAFF.rm1, banker: STAFF.banker, connector: STAFF.connector1 },
];

function buildLead(seed: LeadSeed): Lead {
  const meta = leadStatusMeta(seed.status);
  const createdAt = daysAgoIso(seed.daysAgo);
  const department = deriveDepartment(seed.loanType);

  return {
    id: seed.id,
    reference: `LD-2408${String(1000 + seed.id).padStart(6, '0')}`,
    applicant_name: seed.name,
    applicant_email: seed.name.toLowerCase().replace(/\s+/g, '.') + '@example.com',
    applicant_phone: seed.phone,
    loan_type: seed.loanType,
    department: department.value,
    department_label: department.label,
    loan_amount: seed.amount,
    tenure_months: seed.loanType === 'personal' ? 36 : seed.loanType === 'auto' ? 60 : 180,
    monthly_income: Math.round(seed.amount / 60),
    credit_score: 680 + ((seed.id * 7) % 120),
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
    created_by: seed.connector ?? seed.employee ?? null,
    updated_by: seed.employee ?? null,
    pd_completed_at: null,
    pd_completed_by: null,
    created_at: createdAt,
    updated_at: createdAt,
    full_access: true,
    match_score: null,
    can_change_status: true,
    can_assign: true,
  };
}

const SEED_LEADS: Lead[] = SEEDS.map(buildLead);

/** Linear status progressions used to synthesise a plausible timeline for the lead-detail page. */
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
  closed: 'Case closed.',
};

/**
 * Centralized state for every mock lead. A single root-provided instance
 * backs every Leads page, Banking's Assigned Leads/Matching Engine, every
 * report, and the Dashboard.
 */
@Injectable({ providedIn: 'root' })
export class LeadDataProvider {
  private readonly auditLog = inject(AuditLogDataProvider);

  private readonly _leads = signal<Lead[]>(SEED_LEADS);

  readonly leads = this._leads.asReadonly();

  getById(id: number): Lead | undefined {
    return this._leads().find((lead) => lead.id === id);
  }

  /** Synthesises a plausible status-change timeline for a lead from its current status. */
  historyFor(lead: Lead): LeadStatusHistoryEntry[] {
    const steps = PROGRESSION[lead.status] ?? [lead.status];
    const created = new Date(lead.created_at ?? Date.now()).getTime();
    const now = new Date('2026-08-15T10:00:00+05:30').getTime();
    const span = Math.max(now - created, steps.length * 60 * 60 * 1000);

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

  assignBanker(leadId: number, banker: UserSummary | null): void {
    const reference = this.getById(leadId)?.reference ?? `Lead #${leadId}`;

    this._leads.update((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, assigned_banker: banker } : lead)),
    );

    this.auditLog.record({
      action: banker ? 'assigned' : 'unassigned',
      entity_type: 'Banker Assignment',
      entity_label: reference,
      description: banker ? `Assigned banker ${banker.name} to ${reference}.` : `Removed banker assignment from ${reference}.`,
      category: 'lead_assignment',
    });
  }
}
