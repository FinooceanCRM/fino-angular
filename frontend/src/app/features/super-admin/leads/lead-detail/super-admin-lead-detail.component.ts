import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { StatusPillColour, StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { AssignBankerModalComponent, AssignBankerModalData } from '../../banking/assign-banker-modal/assign-banker-modal.component';
import { LeadDocument } from '../../data/models/document.model';
import { MatchingResult, UserSummary } from '../../data/models/lead.model';
import { LeadNote } from '../../data/models/note.model';
import { AuditLogDataProvider } from '../../data/providers/audit-log-data.provider';
import { BankingDataProvider } from '../../data/providers/banking-data.provider';
import { CommissionDataProvider } from '../../data/providers/commission-data.provider';
import { DocumentDataProvider } from '../../data/providers/document-data.provider';
import { LeadDataProvider } from '../../data/providers/lead-data.provider';
import { NoteDataProvider } from '../../data/providers/note-data.provider';
import { UserDataProvider } from '../../data/providers/user-data.provider';
import { DocumentPreviewModalComponent } from './document-preview-modal/document-preview-modal.component';

const STEP_ICON: Record<string, string> = {
  new: 'add_circle',
  assigned: 'person_add',
  in_progress: 'sync',
  documents_pending: 'description',
  under_review: 'search',
  approved: 'task_alt',
  rejected: 'cancel',
  disbursed: 'paid',
  closed: 'lock',
};

const STAGE_ORDER: { value: string; label: string; icon: string }[] = [
  { value: 'new', label: 'New', icon: 'add_circle' },
  { value: 'assigned', label: 'Assigned', icon: 'person_add' },
  { value: 'in_progress', label: 'In Progress', icon: 'sync' },
  { value: 'documents_pending', label: 'Documents', icon: 'description' },
  { value: 'under_review', label: 'Review', icon: 'search' },
  { value: 'approved', label: 'Approved', icon: 'task_alt' },
  { value: 'disbursed', label: 'Disbursed', icon: 'paid' },
];

const CURRENT_ACTOR = { name: 'Arjun Mehta', role: 'Super Admin' };

/**
 * Lead Details — nine tabs over the same lead, all mock, no HTTP. `lead` is
 * a `computed()` over the centralized `LeadDataProvider`, not a one-time
 * snapshot, so a banker assignment made from the "Assigned banker" tab is
 * reflected immediately without a manual refetch.
 */
@Component({
  selector: 'app-super-admin-lead-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    StatusPillComponent,
    TimelineComponent,
  ],
  templateUrl: './super-admin-lead-detail.component.html',
  styleUrl: './super-admin-lead-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminLeadDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  private readonly leadData = inject(LeadDataProvider);
  private readonly userData = inject(UserDataProvider);
  private readonly bankingData = inject(BankingDataProvider);
  private readonly commissionData = inject(CommissionDataProvider);
  private readonly auditLogData = inject(AuditLogDataProvider);
  private readonly documentData = inject(DocumentDataProvider);
  private readonly noteData = inject(NoteDataProvider);

  private readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = computed(() => this.leadData.leads().find((row) => row.id === this.leadId));

  // ---------- Timeline ----------
  protected readonly historyEntries = computed<TimelineEntry[]>(() => {
    const current = this.lead();
    if (!current) return [];

    return this.leadData.historyFor(current).map((entry) => ({
      icon: STEP_ICON[entry.to_status] ?? 'track_changes',
      title: entry.to_status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      subtitle: [entry.remarks, entry.changed_by ? `by ${entry.changed_by}` : null].filter(Boolean).join(' — '),
      time: entry.created_at ? this.formatTime(entry.created_at) : null,
    }));
  });

  // ---------- Status tracking (stepper) ----------
  protected readonly stages = STAGE_ORDER;

  protected readonly reachedStages = computed<Set<string>>(() => {
    const current = this.lead();
    if (!current) return new Set();
    return new Set(this.leadData.historyFor(current).map((entry) => entry.to_status));
  });

  protected readonly isRejected = computed(() => this.lead()?.status === 'rejected');

  // ---------- Customer information (uses lead fields directly in the template) ----------

  // ---------- Documents ----------
  protected readonly documents = computed<LeadDocument[]>(() => {
    const current = this.lead();
    return current ? this.documentData.documentsFor(current.id) : [];
  });

  protected previewDocument(document: LeadDocument): void {
    this.dialog.open(DocumentPreviewModalComponent, { data: { document } });
  }

  // ---------- Notes ----------
  protected readonly notes = computed<LeadNote[]>(() => {
    const current = this.lead();
    return current ? this.noteData.notesFor(current.id) : [];
  });

  protected readonly noteForm = this.fb.nonNullable.group({
    body: ['', Validators.required],
  });

  protected addNote(): void {
    const current = this.lead();
    if (!current || this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    this.noteData.addNote(current.id, CURRENT_ACTOR.name, CURRENT_ACTOR.role, this.noteForm.controls.body.value.trim());
    this.noteForm.reset({ body: '' });
  }

  protected deleteNote(note: LeadNote): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete note',
          message: 'Delete this note? This cannot be undone.',
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.noteData.deleteNote(note.id);
        }
      });
  }

  // ---------- Matching history ----------
  protected readonly matchingRuns = computed(() => {
    const current = this.lead();
    if (!current) return [];
    return this.auditLogData
      .entries()
      .filter((entry) => entry.entity_type === 'Matching Engine' && entry.entity_label === current.reference)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  protected readonly matchResult = signal<MatchingResult | null>(null);

  protected runMatching(): void {
    const current = this.lead();
    if (!current) return;
    this.matchResult.set(this.bankingData.runMatching(current));
  }

  protected scoreColour(score: number): StatusPillColour {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'default';
  }

  // ---------- Assigned banker ----------
  protected readonly activeBankers = computed(() =>
    this.userData
      .users()
      .filter((user) => user.role === 'banker' && user.is_active)
      .map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })),
  );

  protected readonly bankerProfile = computed(() => {
    const bankerId = this.lead()?.assigned_banker?.id;
    return bankerId ? this.userData.getById(bankerId) : undefined;
  });

  protected assignBanker(): void {
    const current = this.lead();
    if (!current) return;

    this.dialog
      .open<AssignBankerModalComponent, AssignBankerModalData, UserSummary | null>(AssignBankerModalComponent, {
        data: { lead: current, bankers: this.activeBankers() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === undefined) return;

        this.leadData.assignBanker(current.id, result);
        this.snackBar.open(
          result ? `Assigned to ${result.name}.` : 'Banker unassigned.',
          'Dismiss',
          { duration: 4000 },
        );
      });
  }

  // ---------- Commission history ----------
  protected readonly commissionHistory = computed(() => {
    const current = this.lead();
    if (!current) return [];
    return this.commissionData.connectorCommissions().filter((row) => row.lead_reference === current.reference);
  });

  // ---------- Activity log ----------
  protected readonly activityLog = computed(() => {
    const current = this.lead();
    if (!current) return [];
    return [...this.auditLogData.entries()]
      .filter((entry) => entry.entity_label === current.reference)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  private formatTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
