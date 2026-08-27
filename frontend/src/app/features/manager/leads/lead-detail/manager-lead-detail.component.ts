import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  BALANCE_TRANSFER_TYPE_OPTIONS,
  CAR_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  INSURANCE_TYPE_OPTIONS,
  LAP_PROPERTY_TYPE_OPTIONS,
  Lead,
  LeadAssignmentHistoryEntry,
  LeadStatusHistoryEntry,
  MARITAL_STATUS_OPTIONS,
  MUDRA_LOAN_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OF_LOAN_OPTIONS,
  RESIDENTIAL_TYPE_OPTIONS,
  SALARY_ACCOUNT_TYPE_OPTIONS,
  labelFromOptions,
} from '@core/models/lead.model';
import { PdAddress, PdExistingLoan, PdFamilyMember, PdPartnerDirector } from '@core/models/pd.model';
import { PD_SUMMARY_SECTIONS } from '@core/models/pd-summary.util';
import { LeadService } from '@core/services/lead.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { TimelineComponent, TimelineEntry } from '@shared/components/timeline.component';

import { STATUS_STEP_ICON, loanTypeLabel } from '../../data/models/lead-catalogue.model';

/** Lead Details — read-only overview backed by the real `leads/:id` endpoint. */
@Component({
  selector: 'app-manager-lead-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    TimelineComponent,
  ],
  templateUrl: './manager-lead-detail.component.html',
  styleUrl: './manager-lead-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerLeadDetailComponent {
  /** Lets the same component serve both the Manager and RM route trees for its internal links. */
  readonly basePath = input('/manager/leads');
  /** RM-scoped views have no dedicated assignment page — they reassign from the list instead. */
  readonly showReassign = input(true);

  private readonly route = inject(ActivatedRoute);
  private readonly leads = inject(LeadService);

  private readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = signal<Lead | undefined>(undefined);
  protected readonly statusHistory = signal<LeadStatusHistoryEntry[]>([]);
  protected readonly assignmentHistory = signal<LeadAssignmentHistoryEntry[]>([]);
  protected readonly loading = signal(false);

  protected readonly loanTypeLabel = loanTypeLabel;
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

  protected readonly showPropertyType = computed(() => this.lead()?.loan_type === 'home');
  protected readonly showLapDetails = computed(() => this.lead()?.loan_type === 'loan_against_property');

  /** Full PD summary — only the sections/fields the telecaller/manager actually filled in, grouped to match the PD form's own sections. */
  protected readonly pdSummarySections = computed(() => {
    const details = this.lead()?.pd_details;
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
    const details = this.lead()?.pd_details;
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

  protected readonly pdExistingLoans = computed<PdExistingLoan[]>(() => this.lead()?.pd_details?.existing_loans ?? []);
  protected readonly pdFamilyMembers = computed<PdFamilyMember[]>(() => this.lead()?.pd_details?.family_members ?? []);
  protected readonly pdPartnerDirectors = computed<PdPartnerDirector[]>(() => this.lead()?.pd_details?.partner_directors ?? []);

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

  protected readonly recentActivity = computed<TimelineEntry[]>(() =>
    this.statusHistory()
      .slice(-3)
      .reverse()
      .map((entry) => ({
        icon: STATUS_STEP_ICON[entry.to_status] ?? 'track_changes',
        title: entry.to_status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        subtitle: [entry.remarks, entry.changed_by ? `by ${entry.changed_by}` : null].filter(Boolean).join(' — '),
        time: entry.created_at
          ? new Date(entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : null,
      })),
  );

  protected readonly latestAssignment = computed(() => this.assignmentHistory().at(-1) ?? null);

  /**
   * A lead isn't always routed through the Employee/RM chain — a manager can
   * assign it straight to a Banker, in which case that's the only assignee
   * there is. Falls through in rough "who's actually working this lead"
   * order rather than only checking the internal-hierarchy fields.
   */
  protected readonly currentAssignee = computed(() => {
    const current = this.lead();
    return (
      current?.assigned_employee ??
      current?.assigned_relationship_manager ??
      current?.assigned_banker ??
      current?.assigned_telecaller ??
      current?.assigned_manager ??
      null
    );
  });

  constructor() {
    this.loading.set(true);
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => {
        this.lead.set(detail.lead);
        this.statusHistory.set(detail.status_history);
        this.assignmentHistory.set(detail.assignment_history);
        this.loading.set(false);
      },
      error: () => {
        this.lead.set(undefined);
        this.loading.set(false);
      },
    });
  }
}
