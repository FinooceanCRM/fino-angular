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
import { PdAddress, PdExistingLoan, PdFamilyMember, PdPartnerDirector } from '@core/models/pd.model';
import { PD_SUMMARY_SECTIONS } from '@core/models/pd-summary.util';
import {
  BALANCE_TRANSFER_TYPE_OPTIONS,
  CAR_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  CatalogueOption,
  COLLATERAL_TYPE_OPTIONS,
  CONSTRUCTION_STATUS_OPTIONS,
  GENDER_OPTIONS,
  HOME_LOAN_CHECKLIST_OPTIONS,
  HOME_LOAN_PURPOSE_OPTIONS,
  INSURANCE_TYPE_OPTIONS,
  LAP_PROPERTY_TYPE_OPTIONS,
  LeadDetail,
  MARITAL_STATUS_OPTIONS,
  MUDRA_LOAN_TYPE_OPTIONS,
  OWNERSHIP_DOCUMENT_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OF_LOAN_OPTIONS,
  RESIDENTIAL_TYPE_OPTIONS,
  SALARY_ACCOUNT_TYPE_OPTIONS,
  TYPE_OF_ACCOUNT_SALARY_OPTIONS,
  TYPE_OF_SALARY_OPTIONS,
  UserSummary,
  labelFromOptions,
} from '@core/models/lead.model';
import { AccessRequestService } from '@core/services/access-request.service';
import { AuthService } from '@core/services/auth.service';
import { DocumentService } from '@core/services/document.service';
import { DownloadService } from '@core/services/download.service';
import { FollowUpService } from '@core/services/follow-up.service';
import { LeadService } from '@core/services/lead.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TimelineComponent } from '@shared/components/timeline.component';
import { VoyageProgressComponent, VoyageStage } from '@shared/components/voyage-progress.component';

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
    VoyageProgressComponent,
  ],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly downloads = inject(DownloadService);
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
  readonly selectedAssigneeRole = signal('');
  readonly documents = signal<LeadDocument[]>([]);
  readonly documentTypes = signal<DocumentTypeOption[]>([]);
  readonly accessRequests = signal<AccessRequest[]>([]);
  readonly followUps = signal<LeadFollowUp[]>([]);
  readonly loading = signal(false);
  readonly matching = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedTab = signal(0);

  protected readonly optionLabel = labelFromOptions;
  /** Same lookup as `optionLabel`, for a multi-select value (home loan checklist / ownership documents). */
  protected optionLabels(options: readonly CatalogueOption[], values: string[] | null | undefined): string {
    if (!values || values.length === 0) return '—';
    return values.map((value) => labelFromOptions(options, value)).join(', ');
  }

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
  protected readonly typeOfSalaryOptions = TYPE_OF_SALARY_OPTIONS;
  protected readonly typeOfAccountSalaryOptions = TYPE_OF_ACCOUNT_SALARY_OPTIONS;
  protected readonly homeLoanPurposeOptions = HOME_LOAN_PURPOSE_OPTIONS;
  protected readonly constructionStatusOptions = CONSTRUCTION_STATUS_OPTIONS;
  protected readonly collateralTypeOptions = COLLATERAL_TYPE_OPTIONS;
  protected readonly homeLoanChecklistOptions = HOME_LOAN_CHECKLIST_OPTIONS;
  protected readonly ownershipDocumentOptions = OWNERSHIP_DOCUMENT_OPTIONS;

  protected readonly showPropertyType = computed(() => this.detail()?.lead.loan_type === 'home');
  protected readonly showLapDetails = computed(
    () => this.detail()?.lead.loan_type === 'loan_against_property',
  );

  /** Full PD summary — only the sections/fields actually filled in, grouped to match the PD form's own sections. */
  protected readonly pdSummarySections = computed(() => {
    const details = this.detail()?.lead.pd_details;
    if (!details) return [];
    return PD_SUMMARY_SECTIONS.map((section) => ({
      title: section.title,
      rows: section.fields
        .map((field) => ({ label: field.label, value: details[field.key] as string | number | null }))
        .filter((row): row is { label: string; value: string | number } => row.value !== null && row.value !== ''),
    })).filter((section) => section.rows.length > 0);
  });

  /** The 7 PD address groups, collapsed to one line each and skipped when entirely empty. */
  protected readonly pdAddresses = computed(() => {
    const details = this.detail()?.lead.pd_details;
    if (!details) return [];
    const groups: { title: string; address: PdAddress }[] = [
      { title: 'Current Residential Address', address: details.Current_Residential_Address },
      { title: 'Permanent Address', address: details.Permanent_Address },
      { title: 'Current Employer/Company Address', address: details.Current_Employer_Company_Address },
      { title: 'Employer Address', address: details.Employer_Address },
      { title: 'Office Address', address: details.Office_Address },
      { title: 'Business/Employment Address', address: details.Business__Employement_Address },
      { title: 'Property Address (as per site)', address: details.Property_Address__as_per_site_ },
    ];
    return groups
      .map((group) => ({ title: group.title, line: this.formatPdAddress(group.address) }))
      .filter((group): group is { title: string; line: string } => group.line !== null);
  });

  protected readonly pdExistingLoans = computed<PdExistingLoan[]>(
    () => this.detail()?.lead.pd_details?.existing_loans ?? [],
  );
  protected readonly pdFamilyMembers = computed<PdFamilyMember[]>(
    () => this.detail()?.lead.pd_details?.family_members ?? [],
  );
  protected readonly pdPartnerDirectors = computed<PdPartnerDirector[]>(
    () => this.detail()?.lead.pd_details?.partner_directors ?? [],
  );

  protected readonly hasPdDetails = computed(
    () =>
      this.pdSummarySections().length > 0 ||
      this.pdAddresses().length > 0 ||
      this.pdExistingLoans().length > 0 ||
      this.pdFamilyMembers().length > 0 ||
      this.pdPartnerDirectors().length > 0,
  );

  private formatPdAddress(address: PdAddress): string | null {
    const parts = [address.address_line_1, address.address_line_2, address.city, address.state, address.zip, address.country].filter(
      (part): part is string => !!part,
    );
    return parts.length > 0 ? parts.join(', ') : null;
  }

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
  protected readonly canViewBankMatches = this.auth.hasRole('super_admin', 'manager');
  /**
   * Mirrors LoanLeadPolicy::changeStatus() server-side. True for the usual
   * hierarchy roles and for a full-access Banker; for an Employee it's true
   * only the first time a lead is routed to an Employee — once reassigned,
   * status becomes read-only and documents (with a remark) are their only
   * remaining action.
   */
  protected readonly canChangeStatus = computed(() => this.detail()?.lead.can_change_status ?? false);
  protected readonly isEmployee = computed(() => this.auth.hasRole('employee'));
  /**
   * Once a Connector submits a lead, their view narrows to Overview + the
   * status timeline: no Assign, no status changes, no Bank matches, no
   * Documents. Mirrors LoanLeadPolicy — a Connector can never assign() or
   * changeStatus() a lead, and loses uploadDocument() the moment it moves
   * past new/assigned — but hides those tabs outright rather than leaving
   * them visible-but-broken.
   */
  protected readonly isConnector = computed(() => this.auth.hasRole('connector'));

  /**
   * A Vendor's "Request a Loan" submission is strictly read-only for them
   * once created (LoanLeadPolicy::update/assign/changeStatus all return
   * false for the vendor role), so the same Overview-only narrowing the
   * Connector gets applies — every workflow affordance is OR-gated on this.
   */
  protected readonly isVendor = computed(() => this.auth.hasRole('vendor'));

  /** True for any independent submitter whose lead view is Overview-only. */
  protected readonly isReadOnlySubmitter = computed(() => this.isConnector() || this.isVendor());

  protected readonly historyEntries = computed(() =>
    (this.detail()?.status_history ?? []).map((entry) => ({
      icon: 'swap_horiz',
      title: `${entry.from_status ?? 'created'} → ${entry.to_status}`,
      subtitle: [entry.changed_by ?? 'system', entry.remarks].filter(Boolean).join(' · '),
      time: entry.created_at ? formatDate(entry.created_at, 'medium', this.locale) : null,
    })),
  );

  /**
   * The voyage's happy-path stops, read entirely from the real, backend-driven
   * status catalogue (`statuses()`, fetched from `leads.metadata()`) — never
   * hardcoded stage strings. The catalogue mirrors the `LeadStatus` PHP enum
   * in declared order (new, assigned, in_progress, documents_pending,
   * under_review, approved, rejected, disbursed, closed); indices 6
   * (rejected) and 8 (closed) are branch/terminal outcomes rather than
   * forward-moving voyage stops, so they're left out of this happy-path strip
   * — a rejected/closed lead's true status is still shown correctly by the
   * status pill in app-entity-header above.
   */
  protected readonly voyageStages = computed<VoyageStage[]>(() => {
    const list = this.statuses();
    if (list.length <= 7) {
      return [];
    }
    return [0, 1, 2, 3, 4, 5, 7].map((index) => ({
      key: list[index].value,
      label: list[index].label,
    }));
  });

  /**
   * A rejected/closed lead's `status` isn't one of `voyageStages()`'s keys,
   * so the component's own "everything up to the current stage" fallback
   * would find no match and render the whole strip as upcoming/hollow —
   * looking as if nothing had happened yet. For that branch/terminal case,
   * derive which happy-path stops this lead actually passed through from its
   * real `status_history` instead, so the wave still reflects genuine
   * progress. For a lead still on the happy path, this stays `undefined` so
   * the component's simpler "up to current index" default (which already
   * matches the catalogue's real ordering) is used instead.
   */
  protected readonly voyageReachedKeys = computed<string[] | undefined>(() => {
    const stages = this.voyageStages();
    const status = this.detail()?.lead.status;
    if (!status || stages.some((stage) => stage.key === status)) {
      return undefined;
    }

    const visibleKeys = new Set(stages.map((stage) => stage.key));
    return (this.detail()?.status_history ?? [])
      .map((entry) => entry.to_status)
      .filter((toStatus) => visibleKeys.has(toStatus));
  });

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
    if (!this.isBanker() && !this.isConnector()) {
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

  protected readonly assignableRoles = computed(() =>
    [...new Set(this.assignees().map((user) => user.role))].map((role) => ({
      value: role,
      label: role.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    })),
  );

  protected readonly filteredAssignees = computed(() =>
    this.assignees().filter((user) => user.role === this.selectedAssigneeRole()),
  );

  protected selectAssigneeRole(role: string): void {
    this.selectedAssigneeRole.set(role);
    this.assignForm.controls.assignee_id.setValue(0);
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

    if (this.canViewBankMatches && index === this.bankMatchesTab && !this.matchesAutoRun) {
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
      next: (blob) => void this.downloads.save(blob, item.original_name),
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
