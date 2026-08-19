import { CurrencyPipe, DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AccessRequest } from '@core/models/access-request.model';
import { LeadDocument, DocumentTypeOption } from '@core/models/document.model';
import { FollowUpType, LeadFollowUp } from '@core/models/follow-up.model';
import {
  BALANCE_TRANSFER_TYPE_OPTIONS,
  CAR_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  CatalogueOption,
  GENDER_OPTIONS,
  INSURANCE_TYPE_OPTIONS,
  LAP_PROPERTY_TYPE_OPTIONS,
  LeadDetail,
  MARITAL_STATUS_OPTIONS,
  MUDRA_LOAN_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OF_LOAN_OPTIONS,
  RESIDENTIAL_TYPE_OPTIONS,
  SALARY_ACCOUNT_TYPE_OPTIONS,
  UserSummary,
  labelFromOptions,
} from '@core/models/lead.model';
import { AccessRequestService } from '@core/services/access-request.service';
import { AuthService } from '@core/services/auth.service';
import { DocumentService } from '@core/services/document.service';
import { FollowUpService } from '@core/services/follow-up.service';
import { LeadService } from '@core/services/lead.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent } from '@shared/components/timeline.component';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    EntityHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
    TimelineComponent,
  ],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly accessRequestsApi = inject(AccessRequestService);
  private readonly followUpsApi = inject(FollowUpService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locale = inject(LOCALE_ID);

  protected readonly auth = inject(AuthService);

  readonly detail = signal<LeadDetail | null>(null);
  readonly statuses = signal<CatalogueOption[]>([]);
  readonly assignees = signal<UserSummary[]>([]);
  readonly documents = signal<LeadDocument[]>([]);
  readonly documentTypes = signal<DocumentTypeOption[]>([]);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly followUps = signal<LeadFollowUp[]>([]);
  readonly loading = signal(false);
  readonly matching = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedTab = signal(0);

  protected readonly optionLabel = labelFromOptions;

  /** Catalogues for the `LeadApplicantDetails` fields captured by the lead creation wizard. */
  protected readonly genderOptions = GENDER_OPTIONS;
  protected readonly maritalStatusOptions = MARITAL_STATUS_OPTIONS;
  protected readonly casteCategoryOptions = CASTE_CATEGORY_OPTIONS;
  protected readonly salaryAccountTypeOptions = SALARY_ACCOUNT_TYPE_OPTIONS;
  protected readonly purposeOfLoanOptions = PURPOSE_OF_LOAN_OPTIONS;
  protected readonly residentialTypeOptions = RESIDENTIAL_TYPE_OPTIONS;
  protected readonly propertyTypeOptions = PROPERTY_TYPE_OPTIONS;
  protected readonly lapPropertyTypeOptions = LAP_PROPERTY_TYPE_OPTIONS;
  protected readonly balanceTransferTypeOptions = BALANCE_TRANSFER_TYPE_OPTIONS;
  protected readonly insuranceTypeOptions = INSURANCE_TYPE_OPTIONS;
  protected readonly carTypeOptions = CAR_TYPE_OPTIONS;
  protected readonly mudraLoanTypeOptions = MUDRA_LOAN_TYPE_OPTIONS;

  protected readonly showPropertyType = computed(() => this.detail()?.lead.loan_type === 'home');
  protected readonly showLapDetails = computed(
    () => this.detail()?.lead.loan_type === 'loan_against_property',
  );

  protected readonly isBanker = computed(() => this.auth.hasRole('banker'));
  protected readonly canDecideAccessRequests = computed(() =>
    this.auth.hasRole('super_admin', 'manager', 'relationship_manager'),
  );
  protected readonly myAccessRequest = computed(() => {
    const me = this.auth.user()?.id;
    return this.accessRequests().find(
      (r) => r.banker?.id === me && (r.status === 'pending' || r.status === 'approved'),
    );
  });
  /**
   * The single flag driving the Banker access-control matrix on this page
   * (spec §12): contact details, the status/assign forms, documents and
   * follow-ups all stay hidden until an approved access request exists —
   * mirrors `full_access` on the `Lead` resource itself, but read from
   * `accessRequests()` so it updates immediately after `requestAccess()`
   * without waiting on a fresh lead fetch. Always true for every other role.
   */
  protected readonly hasFullAccess = computed(() => {
    if (!this.isBanker()) {
      return true;
    }
    const me = this.auth.user()?.id;
    return this.accessRequests().some((r) => r.banker?.id === me && r.status === 'approved');
  });
  /** Mirrors LoanLeadPolicy::assign() server-side — only Super Admin/Manager/RM may reassign a lead; an Employee never may. */
  protected readonly canAssign = computed(() => this.detail()?.lead.can_assign ?? false);
  /**
   * Mirrors LoanLeadPolicy::changeStatus() server-side. True for the usual
   * hierarchy roles and for a full-access Banker; for an Employee it's true
   * only the first time a lead is routed to an Employee — once reassigned,
   * status becomes read-only and documents (with a remark) are their only
   * remaining action.
   */
  protected readonly canChangeStatus = computed(() => this.detail()?.lead.can_change_status ?? false);
  protected readonly isEmployee = computed(() => this.auth.hasRole('employee'));

  protected readonly historyEntries = computed(() =>
    (this.detail()?.status_history ?? []).map((entry) => ({
      icon: 'swap_horiz',
      title: `${entry.from_status ?? 'created'} → ${entry.to_status}`,
      subtitle: [entry.changed_by ?? 'system', entry.remarks].filter(Boolean).join(' · '),
      time: entry.created_at ? formatDate(entry.created_at, 'medium', this.locale) : null,
    })),
  );

  selectedFile: File | null = null;

  readonly statusForm = this.fb.nonNullable.group({
    status: 'in_progress',
    remarks: '',
  });

  readonly assignForm = this.fb.nonNullable.group({
    assignee_id: [0],
    remarks: '',
  });

  readonly documentForm = this.fb.nonNullable.group({
    document_type: 'aadhaar',
    // Required for an Employee — once a lead is reassigned, a remark on
    // each upload is their only way to leave context on it (see
    // LoanLeadPolicy::changeStatus()). Optional for every other role.
    remarks: ['', this.isEmployee() ? [Validators.required] : []],
  });

  readonly followUpForm = this.fb.nonNullable.group({
    type: 'call' as FollowUpType,
    notes: '',
    next_follow_up_at: '',
  });

  private leadId = 0;
  private matchesAutoRun = false;
  /** Tab indices — kept in sync with the `mat-tab` order in the template (Overview, Workflow, Bank matches, Documents). */
  protected readonly workflowTab = 1;
  private readonly bankMatchesTab = 2;

  ngOnInit(): void {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();

    this.leads.metadata().subscribe({
      next: (metadata) => this.statuses.set(metadata.statuses),
      error: () => undefined,
    });

    this.leads.assignableUsers().subscribe({
      next: (users) => this.assignees.set(users),
      error: () => this.assignees.set([]),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.statusForm.patchValue({ status: detail.lead.status });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This lead is not available to you.');
        this.loading.set(false);
      },
    });

    // Documents and follow-ups are policy-gated to "Banker with full access"
    // server-side (a hard 403, not just an empty list) — and a 403 from
    // *any* API call triggers a global redirect to /unauthorized via
    // `authInterceptor`. So for a Banker, both calls wait for
    // `accessRequests` to resolve `hasFullAccess()` first, and only fire
    // when they're actually going to be allowed; every other role (always
    // "full access") fires them immediately, same as before.
    if (!this.isBanker()) {
      this.loadDocuments();
    }

    this.accessRequestsApi.forLead(this.leadId).subscribe({
      next: (requests) => {
        this.accessRequests.set(requests);

        if (this.isBanker() && this.hasFullAccess()) {
          this.loadDocuments();
          this.loadFollowUps();
        }
      },
      error: () => this.accessRequests.set([]),
    });
  }

  private loadDocuments(): void {
    this.documentsApi.listForLead(this.leadId).subscribe({
      next: (result) => {
        this.documents.set(result.items);
        if (result.types.length > 0) {
          this.documentTypes.set(result.types);
        }
      },
      error: () => undefined,
    });
  }

  private loadFollowUps(): void {
    this.followUpsApi.forLead(this.leadId).subscribe({
      next: (items) => this.followUps.set(items),
      error: () => this.followUps.set([]),
    });
  }

  changeStatus(): void {
    const { status, remarks } = this.statusForm.getRawValue();
    this.leads.changeStatus(this.leadId, status, remarks).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The status could not be updated.'),
    });
  }

  approveLead(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve lead',
          message: 'This marks the lead as approved and notifies everyone assigned to it.',
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.leads.changeStatus(this.leadId, 'approved').subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('Lead approved.', 'Dismiss', { duration: 4000 });
          },
          error: () => this.error.set('The lead could not be approved.'),
        });
      });
  }

  rejectLead(): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject lead',
          message: 'This marks the lead as rejected. The reason is recorded in its status history.',
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject lead',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.leads.changeStatus(this.leadId, 'rejected', reason).subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('Lead rejected.', 'Dismiss', { duration: 4000 });
          },
          error: () => this.error.set('The lead could not be rejected.'),
        });
      });
  }

  assign(): void {
    const { assignee_id, remarks } = this.assignForm.getRawValue();
    if (!assignee_id) {
      return;
    }

    this.leads.assign(this.leadId, assignee_id, remarks).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The lead could not be assigned.'),
    });
  }

  protected scoreColour(score: number): string {
    if (score >= 80) {
      return 'success';
    }
    if (score >= 50) {
      return 'accent';
    }
    return 'warn';
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);

    if (index === this.bankMatchesTab && !this.matchesAutoRun) {
      this.matchesAutoRun = true;
      this.runMatching();
    }
  }

  runMatching(): void {
    this.matching.set(true);
    this.leads.runMatching(this.leadId).subscribe({
      next: (result) => {
        this.matching.set(false);
        this.reload();
        this.snackBar.open(
          `Matching complete: ${result.matched} of ${result.evaluated} banks matched.`,
          'Dismiss',
          { duration: 4000 },
        );
      },
      error: () => {
        this.matching.set(false);
        this.error.set('The matching engine could not run.');
      },
    });
  }

  requestAccess(): void {
    this.accessRequestsApi.request(this.leadId).subscribe({
      next: () => {
        this.reload();
        this.snackBar.open('Access requested.', 'Dismiss', { duration: 4000 });
      },
      error: () => this.error.set('The access request could not be submitted.'),
    });
  }

  approveAccessRequest(request: AccessRequest): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve access request',
          message: `Assign this lead to ${request.banker?.name ?? 'this banker'}?`,
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.accessRequestsApi.approve(request.id).subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('Access request approved.', 'Dismiss', { duration: 4000 });
          },
          error: () => this.error.set('The access request could not be approved.'),
        });
      });
  }

  rejectAccessRequest(request: AccessRequest): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject access request',
          message: `${request.banker?.name ?? 'This banker'} will be notified with your reason.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject request',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.accessRequestsApi.reject(request.id, reason).subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('Access request rejected.', 'Dismiss', { duration: 4000 });
          },
          error: () => this.error.set('The access request could not be rejected.'),
        });
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.selectedFile || this.documentForm.invalid) {
      return;
    }

    const { document_type, remarks } = this.documentForm.getRawValue();

    this.documentsApi.upload(this.leadId, this.selectedFile, document_type, remarks).subscribe({
      next: () => {
        this.selectedFile = null;
        this.documentForm.patchValue({ remarks: '' });
        this.reload();
      },
      error: () => this.error.set('The document could not be uploaded.'),
    });
  }

  download(item: LeadDocument): void {
    this.documentsApi.download(item).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.original_name;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('The document could not be downloaded.'),
    });
  }

  removeDocument(item: LeadDocument): void {
    this.documentsApi.remove(item.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The document could not be deleted.'),
    });
  }

  logFollowUp(): void {
    const { type, notes, next_follow_up_at } = this.followUpForm.getRawValue();

    this.followUpsApi
      .create(this.leadId, {
        type,
        notes: notes.trim() || null,
        next_follow_up_at: next_follow_up_at || null,
      })
      .subscribe({
        next: () => {
          this.followUpForm.reset({ type: 'call', notes: '', next_follow_up_at: '' });
          this.reload();
          this.snackBar.open('Follow-up logged.', 'Dismiss', { duration: 4000 });
        },
        error: () => this.error.set('The follow-up could not be logged.'),
      });
  }

  completeFollowUp(item: LeadFollowUp): void {
    this.followUpsApi.complete(item.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('The follow-up could not be marked complete.'),
    });
  }
}
