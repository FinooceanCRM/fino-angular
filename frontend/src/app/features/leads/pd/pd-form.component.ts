import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Lead } from '@core/models/lead.model';
import { PdDetails, PdExistingLoan, PdFamilyMember, PdPartnerDirector } from '@core/models/pd.model';
import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { buildExistingLoanRow, buildFamilyMemberRow, buildPartnerDirectorRow } from './pd-repeater-factories';
import { PdApplicantBasicsComponent } from './sections/applicant-basics/applicant-basics.component';
import { PdApplicantItrComponent } from './sections/applicant-itr/applicant-itr.component';
import { PdBusinessPartnerComponent } from './sections/business-partner/business-partner.component';
import { PdEmploymentBusinessComponent } from './sections/employment-business/employment-business.component';
import { PdExistingLoansComponent } from './sections/existing-loans/existing-loans.component';
import { PdFamilyMembersComponent } from './sections/family-members/family-members.component';
import { PdFirmItrComponent } from './sections/firm-itr/firm-itr.component';
import { PdPartnerDirectorsComponent } from './sections/partner-directors/partner-directors.component';
import { PdProfessionalComponent } from './sections/professional/professional.component';
import { PdPropertyComponent } from './sections/property/property.component';
import { PdSalariedIncomeBankingComponent } from './sections/salaried-income-banking/salaried-income-banking.component';

/**
 * Full PD (pre-disbursement verification) data-entry form — recreates the
 * ~275-field dataset the legacy WordPress Fluent Form #39 ('PD Form')
 * collected, natively. Restricted to Super Admin, Manager and Telecaller by
 * the `leads/:id/pd` route guard (client-side) and `LoanLeadPolicy::submitPd`
 * (server-side, authoritative).
 *
 * Broken into 11 section sub-components (see `./sections`) grouped into 8
 * stepper steps, all bound to ONE shared master FormGroup so submission is a
 * single `getRawValue()` — no per-section transform/merge step needed.
 */
@Component({
  selector: 'app-pd-form',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatStepperModule,
    PageHeaderComponent,
    PdApplicantBasicsComponent,
    PdEmploymentBusinessComponent,
    PdSalariedIncomeBankingComponent,
    PdProfessionalComponent,
    PdBusinessPartnerComponent,
    PdApplicantItrComponent,
    PdFirmItrComponent,
    PdExistingLoansComponent,
    PdFamilyMembersComponent,
    PdPartnerDirectorsComponent,
    PdPropertyComponent,
  ],
  templateUrl: './pd-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly leadId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly lead = signal<Lead | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly canSubmitPd = signal(false);
  protected readonly alreadyCompletedAt = signal<string | null>(null);

  protected readonly form: FormGroup = this.buildForm();

  ngOnInit(): void {
    this.leads.detail(this.leadId).subscribe({
      next: (detail) => this.lead.set(detail.lead),
      error: () => undefined,
    });

    this.leads.getPd(this.leadId).subscribe({
      next: (response) => {
        this.canSubmitPd.set(response.can_submit_pd);
        this.alreadyCompletedAt.set(response.pd_completed_at);
        if (response.pd_details) {
          this.patchExisting(response.pd_details);
        }
        this.loading.set(false);
      },
      error: (err: NormalizedApiError) => {
        this.error.set(err.message ?? 'This lead is not available to you.');
        this.loading.set(false);
      },
    });
  }

  private patchExisting(details: PdDetails): void {
    const { existing_loans, family_members, partner_directors, ...flat } = details;

    this.form.patchValue(flat);

    const existingLoans = this.form.get('existing_loans') as FormArray;
    for (const row of existing_loans ?? []) {
      existingLoans.push(buildExistingLoanRow(this.fb, row as Partial<PdExistingLoan>));
    }

    const familyMembers = this.form.get('family_members') as FormArray;
    for (const row of family_members ?? []) {
      familyMembers.push(buildFamilyMemberRow(this.fb, row as Partial<PdFamilyMember>));
    }

    const partnerDirectors = this.form.get('partner_directors') as FormArray;
    for (const row of partner_directors ?? []) {
      partnerDirectors.push(buildPartnerDirectorRow(this.fb, row as Partial<PdPartnerDirector>));
    }
  }

  protected submit(): void {
    if (this.saving() || !this.canSubmitPd()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload = this.form.getRawValue() as PdDetails;

    this.leads.submitPd(this.leadId, payload).subscribe({
      next: () => {
        this.snackBar.open('Full PD completed.', 'Dismiss', { duration: 4000 });
        this.router.navigate(['/leads', this.leadId]);
      },
      error: (err: NormalizedApiError) => {
        this.saving.set(false);
        this.error.set(err.message ?? 'The Full PD form could not be submitted.');
      },
    });
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      LOAN_TYPE: [null],
      If__HL_: [null],
      If__LAP: [null],
      If_Commercial_Property: [null],
      If_Mudra_Loan: [null],
      If_Loan_BT_: [null],
      BT_Loan_Amount: [null],
      Top_up_Loan_Amount: [null],
      If_Insurance: [null],
      If_Car_Loan: [null],
      PURPOSE_OF_LOAN: [null],
      Mother_s_maiden_Name: [null],
      Age: [null],
      Marital_Status: [null],
      RESSIDENCIAL_TYPE: [null],
      ANY_OTHER_SPECIFY: [null],
      Caste_Category: [null],
      General_Caste: [null],
      SC_Caste: [null],
      ST_Caste: [null],
      OBC_Caste: [null],
      Specific_Caste: [null],
      Type_of_Current_Resident: [null],
      SINCE_RESSIBENT: [null],
      Landmark: [null],
      Type_of_Customer: [null],
      EMPLOYER_TYPE: [null],
      Type_of_Work_Contract: [null],
      Date_of_Joining: [null],
      Type_Salary: [null],
      Bank_Salary: [null],
      Bank_Name: [null],
      Bank_Account_Number: [null],
      SALARY_DEDUCTION: [null],
      PF_Deduction_Amount: [null],
      PT_Deduction_Amount: [null],
      SOCIETY_LOAN_Deduction_Amount: [null],
      PF_LOAN_Deduction_Amount: [null],
      LIC_Deduction_Amount: [null],
      OTHER_DEDUCTION_Amount: [null],
      CURRENT_MONTH_SAL: [null],
      PREVIOUS_MONTH: [null],
      '2ND_PREVIOUS_MONTH': [null],
      Total_Income_from_other_source_salaried: [null],
      Source_name_salaried: [null],
      other_Specify__Name: [null],
      Type_of_Business: [null],
      Partnership_Business: [null],
      Rental_Income_Amount: [null],
      Agriculture_Income_Amount: [null],
      Pension_Amount: [null],
      Part_time_Income_Amount: [null],
      other_Specify__Amount: [null],
      Current_Employer_Company_Name: [null],
      Employer_Name: [null],
      Date_of_Joining_1: [null],
      Designation: [null],
      Department: [null],
      TOTAL_EXPIRIANCE_IN_CURRENT_COMPANY: [null],
      Full_name_References_1: [null],
      Designation_1: [null],
      Department_1: [null],
      Mobile_Number: [null],
      Full_name_References_2: [null],
      Designation_2: [null],
      Department_2: [null],
      Mobile_No_2: [null],
      Profession_Type: [null],
      PROFESSIONAL_CERTIFICATE: [null],
      Professional_Name: [null],
      Date_of_Incorporation_DD_MM_YY: [null],
      Type_of_Professional_License: [null],
      OTHER_SPECIFY_PROFESSIONAL_LICENSE: [null],
      Income_Amount_from_Profession: [null],
      Source_name: [null],
      Rental_Income_Amount_Professional: [null],
      Agriculture_Income_Amount_Professional: [null],
      Pension_Amount_Professional: [null],
      BROKRAGE_Amount_Professional: [null],
      other_Specify__Amount_Professional: [null],
      Total_Income_from_other_source_Professional: [null],
      OFFICE_Premises_Type: [null],
      OTHER_SPECIFY_2: [null],
      itr_current_date: [null],
      itr_current_turnover: [null],
      itr_current_income: [null],
      itr_current_depreciation: [null],
      itr_current_remark: [null],
      itr_previous_date: [null],
      itr_previous_turnover: [null],
      itr_previous_income: [null],
      itr_previous_depreciation: [null],
      itr_previous_remark: [null],
      itr_third_date: [null],
      itr_third_turnover: [null],
      itr_third_income: [null],
      itr_third_depreciation: [null],
      itr_third_remark: [null],
      Date_of_Filing: [null],
      itr_current_turnover_1: [null],
      itr_current_income_1: [null],
      itr_current_depreciation_1: [null],
      itr_current_remark_1: [null],
      Date_of_Filing_2: [null],
      itr_current_turnover_2: [null],
      itr_current_income_2: [null],
      itr_current_depreciation_2: [null],
      itr_current_remark_2: [null],
      Date_of_Filing_3: [null],
      itr_current_turnover_3: [null],
      itr_current_income_3: [null],
      itr_current_depreciation_3: [null],
      itr_current_remark_3: [null],
      Annual_Turnover_without_ITR_1: [null],
      Net_Income_without_ITR_1: [null],
      Nature_of_Business: [null],
      BUSINESS_CATEGORY: [null],
      PARTNERSHIP: [null],
      Type_of_Firm: [null],
      PROPRITORSHIP_FIRM: [null],
      Pvt__Ltd__LLP_FIRM: [null],
      OPC_FIRM: [null],
      Business__Employement_Name: [null],
      Date_of_Incorporation: [null],
      Income_from_Business__Employement: [null],
      Total_Income_from_other_source_Business: [null],
      Other_Income_Source: [null],
      Other_Specify_Source: [null],
      Rental_Income_Amount_Business: [null],
      Agriculture_Income_Amount_Business: [null],
      Pension_Amount_Business: [null],
      other_Specify__Amount_Business: [null],
      BUSINESS_Premises_Type: [null],
      Name_of_Property_Owner: [null],
      Relation_with_applicant: [null],
      Available_Property_Document: [null],
      Gaothan: [null],
      REGISTERAD_AGREEMENT_TO_SALE___REGISTERED_POWER_OF_ATORNY: [null],
      BHADEPATTA_PROPERTY: [null],
      Mauza_1: [null],
      khasara_No_1: [null],
      P_H__No_1: [null],
      Survey_No_1: [null],
      Society_No__1: [null],
      Other: [null],
      Other2: [null],
      Other3: [null],
      City: [null],
      Tahsil: [null],
      District: [null],
      State: [null],
      Property_Loan_Type: [null],
      Property_Selected_: [null],
      Total_Agreement_Value: [null],
      OCR_Paid: [null],
      Source: [null],
      OCR_Balance: [null],
      Source2: [null],
      Completion_State_Of_Property: [null],
      Land_Areaa: [null],
      Built_up_Area1: [null],
      Estimated_Cost: [null],
      Land_Area: [null],
      Existing_Construction_Area: [null],
      Existing_Construction_Stage: [null],
      Proposed_Construction: [null],
      Estimated_Market_Value: [null],
      Land_Land_Sharing_Area_in_Sqft: [null],
      Built_up_Area_in_Sqft: [null],

      Current_Residential_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Permanent_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Current_Employer_Company_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Employer_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Office_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Business__Employement_Address: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),
      Property_Address__as_per_site_: this.fb.group({
        address_line_1: [null], address_line_2: [null], city: [null], state: [null],
        zip: [null], country: [null], latitude: [null], longitude: [null],
      }),

      existing_loans: this.fb.array<FormGroup>([]),
      family_members: this.fb.array<FormGroup>([]),
      partner_directors: this.fb.array<FormGroup>([]),
    });
  }
}
