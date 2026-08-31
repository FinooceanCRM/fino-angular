import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LeadService } from '@core/services/lead.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { Lead, MatchingResult, UserSummary, loanTypeLabel } from '../../data/models/lead.model';
import { BankingDataProvider } from '../../data/providers/banking-data.provider';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';
import { UserDataProvider } from '../../data/providers/user-data.provider';
import { AssignBankerModalComponent, AssignBankerModalData } from '../assign-banker-modal/assign-banker-modal.component';

/** One row of the read-only "leads x candidate bank matches" overview table. */
interface MatchingRow {
  lead: Lead;
  reference: string;
  applicant_name: string;
  loan_type_label: string;
  /**
   * Count of *active* bank products whose `loan_type` matches this lead's
   * loan type. This is an honest, live-computed proxy for "how many banks
   * this lead could match" — it is NOT the persisted per-lead match result
   * (income/credit-score/age/location eligibility rules aren't evaluated
   * here). Getting the real number for every lead would mean calling the
   * real `POST leads/{lead}/match` endpoint once per lead, which persists a
   * `LeadMatch` row per bank product it evaluates — see the class doc below
   * for why that's deliberately not done from a dashboard render.
   */
  candidateCount: number;
  statusLabel: 'Auto-matched' | 'Matched' | 'Needs review';
  statusColour: StatusPillColour;
}

function matchBucket(candidateCount: number): { statusLabel: MatchingRow['statusLabel']; statusColour: StatusPillColour } {
  if (candidateCount === 0) return { statusLabel: 'Needs review', statusColour: 'accent' };
  if (candidateCount === 1) return { statusLabel: 'Matched', statusColour: 'primary' };
  return { statusLabel: 'Auto-matched', statusColour: 'success' };
}

/** Two-letter initials for the applicant avatar chip — display only, not stored anywhere. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Small decorative palette the applicant avatar cycles through by lead id — no meaning attached. */
const AVATAR_PALETTE = [
  'var(--tide-color-secondary)',
  'var(--tide-color-info)',
  'var(--tide-color-action)',
  'var(--tide-color-success)',
];

/**
 * Lead matching dashboard.
 *
 * Two distinct things live on this page:
 *
 * 1. A read-only overview (KPI tiles + `leads` table) built entirely from
 *    data that's already free to read — the mock `LeadDataProvider` (the
 *    same source `SuperAdminAssignedLeadsComponent` uses) and the real,
 *    already-loaded `BankingDataProvider` bank-product catalogue. Its
 *    "Matches"/"Status" columns are derived by counting active bank
 *    products whose loan type matches each lead's — see `MatchingRow` above
 *    for exactly what that number does and doesn't represent. No API calls
 *    are made to produce this section, so nothing here is spammed.
 *
 * 2. The actual matching engine tool below it: pick one lead, click "Run
 *    matching engine", and it calls the real `POST leads/{lead}/match`
 *    endpoint (Phase 2) via `LeadService.runMatching`, which scores that
 *    lead server-side against every active bank product and persists the
 *    results; this page just displays what comes back. `leads` itself is
 *    still sourced from the mock `LeadDataProvider` (a later phase's work),
 *    so the selected lead's id may not resolve to a real backend lead until
 *    Leads itself goes real — a known gap, not something this phase covers.
 *
 * Deliberately NOT done: looping `runMatching()` over every lead to produce
 * a real per-lead match count for the table above. The real endpoint
 * persists a `LeadMatch` row per bank product it evaluates, so silently
 * calling it for every lead just to populate a dashboard tile would spam
 * writes with no user intent behind them.
 */
@Component({
  selector: 'app-super-admin-matching-engine',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './super-admin-matching-engine.component.html',
  styleUrl: './super-admin-matching-engine.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminMatchingEngineComponent {
  private readonly leadData = inject(LeadDataProvider);
  private readonly bankingData = inject(BankingDataProvider);
  private readonly userData = inject(UserDataProvider);
  private readonly leadService = inject(LeadService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly leads = this.leadData.leads;
  protected readonly selectedLeadId = signal<number | null>(null);
  protected readonly result = signal<MatchingResult | null>(null);
  protected readonly running = signal(false);

  protected readonly displayedLeadId = computed(() => this.selectedLeadId() ?? this.leads()[0]?.id ?? null);

  protected readonly selectedLead = computed<Lead | undefined>(() =>
    this.leads().find((lead) => lead.id === this.displayedLeadId()),
  );

  private readonly activeCriteria = computed(() => this.bankingData.criteria().filter((product) => product.is_active));

  protected readonly matchingRows = computed<MatchingRow[]>(() => {
    const active = this.activeCriteria();
    return this.leads().map((lead) => {
      const candidateCount = active.filter((product) => product.loan_type === lead.loan_type).length;
      const bucket = matchBucket(candidateCount);
      return {
        lead,
        reference: lead.reference,
        applicant_name: lead.applicant_name,
        loan_type_label: loanTypeLabel(lead.loan_type),
        candidateCount,
        ...bucket,
      };
    });
  });

  protected readonly tableColumns: TableColumn<MatchingRow>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'applicant_name', label: 'Applicant' },
    { key: 'loan_type_label', label: 'Loan Type' },
    { key: 'matches', label: 'Matches' },
    { key: 'status', label: 'Status' },
  ];

  protected readonly kpis = computed(() => {
    const rows = this.matchingRows();
    const total = rows.length;
    const autoMatched = rows.filter((row) => row.statusLabel === 'Auto-matched').length;
    const needsReview = rows.filter((row) => row.statusLabel === 'Needs review').length;
    const activeBanks = new Set(this.activeCriteria().map((product) => product.bank_name)).size;

    return {
      leadsProcessed: total,
      autoMatched,
      autoMatchedPct: total ? Math.round((autoMatched / total) * 100) : 0,
      needsReview,
      activeBanks,
    };
  });

  private readonly bankers = computed(() =>
    this.userData
      .users()
      .filter((user) => user.role === 'banker' && user.is_active)
      .map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })),
  );

  protected initials(name: string): string {
    return initialsOf(name);
  }

  protected avatarColour(row: MatchingRow): string {
    return AVATAR_PALETTE[row.lead.id % AVATAR_PALETTE.length];
  }

  protected assignBanker(row: MatchingRow): void {
    this.dialog
      .open<AssignBankerModalComponent, AssignBankerModalData, UserSummary | null>(AssignBankerModalComponent, {
        data: { lead: row.lead, bankers: this.bankers() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === undefined) {
          return;
        }

        this.leadData.assignBanker(row.lead.id, result);

        this.snackBar.open(
          result ? `${row.reference} assigned to ${result.name}.` : `${row.reference} is now unassigned.`,
          'Dismiss',
          { duration: 4000 },
        );
      });
  }

  protected run(): void {
    const lead = this.selectedLead();
    if (!lead) {
      return;
    }

    this.running.set(true);
    this.leadService.runMatching(lead.id).subscribe({
      next: (result) => {
        this.result.set(result);
        this.running.set(false);
      },
      error: () => {
        this.snackBar.open('Could not run the matching engine for this lead.', 'Dismiss', { duration: 4000 });
        this.running.set(false);
      },
    });
  }

  protected scoreColour(score: number): StatusPillColour {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'default';
  }
}
