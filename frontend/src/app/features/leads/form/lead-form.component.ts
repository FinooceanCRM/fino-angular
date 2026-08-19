import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import {
  BALANCE_TRANSFER_TYPE_OPTIONS,
  CAR_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  CatalogueOption,
  GENDER_OPTIONS,
  INSURANCE_TYPE_OPTIONS,
  LAP_PROPERTY_TYPE_OPTIONS,
  LeadApplicantDetails,
  LeadPayload,
  MARITAL_STATUS_OPTIONS,
  MUDRA_LOAN_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  PURPOSE_OF_LOAN_OPTIONS,
  RESIDENTIAL_TYPE_OPTIONS,
  SALARY_ACCOUNT_TYPE_OPTIONS,
  labelFromOptions,
} from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Loan types (see `App\Enums\LoanType` on the backend) that unlock a step-4 fieldset. */
const HOME_LOAN = 'home';
const MORTGAGE_LOAN = 'loan_against_property';

function calculateAge(dob: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** `Date` -> `YYYY-MM-DD`, using local calendar fields so the day never shifts across time zones. */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value: Date | null = control.value;
  return value && value.getTime() > Date.now() ? { futureDate: true } : null;
}

function minimumAgeValidator(minAge: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const dob: Date | null = control.value;
    if (!dob) return null;
    const age = calculateAge(dob);
    return age < minAge ? { minAge: { required: minAge, actual: age } } : null;
  };
}

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly leadId = signal<number | null>(null);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly employmentTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  /** Static option catalogues for the fields that don't come from the backend metadata endpoint. */
  readonly genderOptions = GENDER_OPTIONS;
  readonly maritalStatusOptions = MARITAL_STATUS_OPTIONS;
  readonly casteCategoryOptions = CASTE_CATEGORY_OPTIONS;
  readonly salaryAccountTypeOptions = SALARY_ACCOUNT_TYPE_OPTIONS;
  readonly purposeOfLoanOptions = PURPOSE_OF_LOAN_OPTIONS;
  readonly residentialTypeOptions = RESIDENTIAL_TYPE_OPTIONS;
  readonly propertyTypeOptions = PROPERTY_TYPE_OPTIONS;
  readonly lapPropertyTypeOptions = LAP_PROPERTY_TYPE_OPTIONS;
  readonly balanceTransferTypeOptions = BALANCE_TRANSFER_TYPE_OPTIONS;
  readonly insuranceTypeOptions = INSURANCE_TYPE_OPTIONS;
  readonly carTypeOptions = CAR_TYPE_OPTIONS;
  readonly mudraLoanTypeOptions = MUDRA_LOAN_TYPE_OPTIONS;

  readonly maxDob = new Date();

  readonly form = this.fb.nonNullable.group({
    applicant: this.fb.nonNullable.group({
      applicant_name: ['', [Validators.required, Validators.maxLength(191)]],
      gender: ['', Validators.required],
      dob: this.fb.control<Date | null>(null, [
        Validators.required,
        pastDateValidator,
        minimumAgeValidator(18),
      ]),
      applicant_email: ['', [Validators.email]],
      applicant_phone: ['', [Validators.required, Validators.pattern(MOBILE_PATTERN)]],
      alternative_phone: ['', [Validators.pattern(MOBILE_PATTERN)]],
      age: this.fb.control<number | null>(null, [Validators.required, Validators.min(18), Validators.max(75)]),
      marital_status: ['', Validators.required],
      caste_category: ['', Validators.required],
    }),
    loan: this.fb.nonNullable.group({
      loan_type: [HOME_LOAN, Validators.required],
      employment_type: ['salaried', Validators.required],
      loan_amount: [500000, [Validators.required, Validators.min(1)]],
      company_name: ['', [Validators.required, Validators.maxLength(191)]],
      monthly_income: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      net_salary: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      salary_account_type: ['', Validators.required],
      credit_score: this.fb.control<number | null>(700, [Validators.min(300), Validators.max(900)]),
      tenure_months: [60, [Validators.required, Validators.min(1), Validators.max(360)]],
      purpose_of_loan: ['', Validators.required],
      gst_number: ['', [Validators.maxLength(15)]],
      insurance_type: [''],
      car_type: [''],
      mudra_loan_type: [''],
    }),
    address: this.fb.nonNullable.group({
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.pattern(PINCODE_PATTERN)]],
      landmark: [''],
      current_address: ['', [Validators.required, Validators.maxLength(500)]],
      residential_type: ['', Validators.required],
      since_resident: ['', [Validators.required, Validators.maxLength(50)]],
    }),
    loanTypeDetails: this.fb.nonNullable.group({
      property_type: [''],
      lap_property_type: [''],
      balance_transfer_type: ['none'],
      balance_transfer_loan_amount: this.fb.control<number | null>(null),
      topup_loan_amount: this.fb.control<number | null>(null),
    }),
    notes: [''],
  });

  /**
   * Live snapshots used to drive conditional rendering, kept as signals so the template stays declarative.
   * Derived via `getRawValue()` (not the emitted `valueChanges` payload) because a typed FormGroup's `.value`
   * type marks every key optional — any control could in principle be disabled — while `getRawValue()` is
   * guaranteed complete.
   */
  private readonly loanSnapshot = toSignal(
    this.form.controls.loan.valueChanges.pipe(map(() => this.form.controls.loan.getRawValue())),
    { initialValue: this.form.controls.loan.getRawValue() },
  );
  private readonly loanTypeDetailsSnapshot = toSignal(
    this.form.controls.loanTypeDetails.valueChanges.pipe(
      map(() => this.form.controls.loanTypeDetails.getRawValue()),
    ),
    { initialValue: this.form.controls.loanTypeDetails.getRawValue() },
  );

  readonly showPropertyTypeSection = computed(() => this.loanSnapshot().loan_type === HOME_LOAN);
  readonly showLapSection = computed(() => this.loanSnapshot().loan_type === MORTGAGE_LOAN);
  readonly showNoLoanTypeExtrasHint = computed(
    () => !this.showPropertyTypeSection() && !this.showLapSection(),
  );
  readonly showGstField = computed(() =>
    ['self_employed', 'business'].includes(this.loanSnapshot().employment_type),
  );
  readonly showInsuranceField = computed(() => this.showPropertyTypeSection() || this.showLapSection());
  readonly showCarTypeField = computed(() => this.loanSnapshot().purpose_of_loan === 'vehicle_purchase');
  readonly showMudraTypeField = computed(() => this.loanSnapshot().purpose_of_loan === 'business_mudra');
  readonly showBalanceTransferAmount = computed(() => {
    const type = this.loanTypeDetailsSnapshot().balance_transfer_type;
    return !!type && type !== 'none';
  });

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
      error: () => undefined,
    });

    this.setupConditionalBehaviour();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.leadId.set(id);
      this.loading.set(true);
      this.leads.detail(id).subscribe({
        next: (detail) => {
          const lead = detail.lead;
          const details: LeadApplicantDetails = lead.details ?? {};

          this.form.patchValue({
            applicant: {
              applicant_name: lead.applicant_name,
              gender: details.gender ?? '',
              dob: details.dob ? new Date(details.dob) : null,
              applicant_email: lead.applicant_email ?? '',
              applicant_phone: lead.applicant_phone ?? '',
              alternative_phone: details.alternative_phone ?? '',
              age: details.age ?? null,
              marital_status: details.marital_status ?? '',
              caste_category: details.caste_category ?? '',
            },
            loan: {
              loan_type: lead.loan_type,
              employment_type: lead.employment_type ?? 'salaried',
              loan_amount: lead.loan_amount,
              company_name: details.company_name ?? '',
              monthly_income: lead.monthly_income ?? null,
              net_salary: details.net_salary ?? null,
              salary_account_type: details.salary_account_type ?? '',
              credit_score: lead.credit_score ?? 700,
              tenure_months: lead.tenure_months ?? 60,
              purpose_of_loan: details.purpose_of_loan ?? '',
              gst_number: details.gst_number ?? '',
              insurance_type: details.insurance_type ?? '',
              car_type: details.car_type ?? '',
              mudra_loan_type: details.mudra_loan_type ?? '',
            },
            address: {
              city: lead.city ?? '',
              state: lead.state ?? '',
              pincode: lead.pincode ?? '',
              landmark: details.landmark ?? '',
              current_address: details.current_address ?? '',
              residential_type: details.residential_type ?? '',
              since_resident: details.since_resident ?? '',
            },
            loanTypeDetails: {
              property_type: details.property_type ?? '',
              lap_property_type: details.lap_property_type ?? '',
              balance_transfer_type: details.balance_transfer_type ?? 'none',
              balance_transfer_loan_amount: details.balance_transfer_loan_amount ?? null,
              topup_loan_amount: details.topup_loan_amount ?? null,
            },
            notes: lead.notes ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('This lead could not be loaded.');
          this.loading.set(false);
        },
      });
    }
  }

  /**
   * Wires the cross-field behaviour the static form config above can't express:
   * required-ness of the loan-type-specific fieldset depends on `loan_type`,
   * the balance-transfer amount depends on `balance_transfer_type`, and DOB
   * keeps `age` in sync. Hidden fields are cleared so stale values never
   * reach the payload for a loan type they don't apply to.
   */
  private setupConditionalBehaviour(): void {
    const applicant = this.form.controls.applicant;
    const loan = this.form.controls.loan;
    const details = this.form.controls.loanTypeDetails;

    applicant.controls.dob.valueChanges.subscribe((dob) => {
      if (!dob) return;
      applicant.controls.age.setValue(calculateAge(dob), { emitEvent: false });
    });

    const applyLoanTypeValidators = (loanType: string): void => {
      details.controls.property_type.clearValidators();
      details.controls.lap_property_type.clearValidators();
      details.controls.balance_transfer_type.clearValidators();

      if (loanType === HOME_LOAN) {
        details.controls.property_type.setValidators([Validators.required]);
        details.patchValue(
          {
            lap_property_type: '',
            balance_transfer_type: 'none',
            balance_transfer_loan_amount: null,
            topup_loan_amount: null,
          },
          { emitEvent: false },
        );
      } else if (loanType === MORTGAGE_LOAN) {
        details.controls.lap_property_type.setValidators([Validators.required]);
        details.controls.balance_transfer_type.setValidators([Validators.required]);
        details.patchValue({ property_type: '' }, { emitEvent: false });
      } else {
        details.patchValue(
          {
            property_type: '',
            lap_property_type: '',
            balance_transfer_type: 'none',
            balance_transfer_loan_amount: null,
            topup_loan_amount: null,
          },
          { emitEvent: false },
        );
      }

      details.controls.property_type.updateValueAndValidity({ emitEvent: false });
      details.controls.lap_property_type.updateValueAndValidity({ emitEvent: false });
      details.controls.balance_transfer_type.updateValueAndValidity({ emitEvent: false });
      applyBalanceTransferValidators(details.controls.balance_transfer_type.value);
    };

    const applyBalanceTransferValidators = (type: string): void => {
      const amount = details.controls.balance_transfer_loan_amount;
      if (type && type !== 'none') {
        amount.setValidators([Validators.required, Validators.min(1)]);
      } else {
        amount.clearValidators();
        amount.setValue(null, { emitEvent: false });
      }
      amount.updateValueAndValidity({ emitEvent: false });
    };

    loan.controls.loan_type.valueChanges.subscribe(applyLoanTypeValidators);
    details.controls.balance_transfer_type.valueChanges.subscribe(applyBalanceTransferValidators);
    applyLoanTypeValidators(loan.controls.loan_type.value);

    // Additional conditional fields are always optional — only their
    // visibility is gated — but hidden values are still cleared so a value
    // entered while visible doesn't linger silently once hidden again.
    loan.controls.employment_type.valueChanges.subscribe((employmentType) => {
      if (!['self_employed', 'business'].includes(employmentType)) {
        loan.controls.gst_number.setValue('', { emitEvent: false });
      }
    });
    loan.controls.purpose_of_loan.valueChanges.subscribe((purpose) => {
      if (purpose !== 'vehicle_purchase') {
        loan.controls.car_type.setValue('', { emitEvent: false });
      }
      if (purpose !== 'business_mudra') {
        loan.controls.mudra_loan_type.setValue('', { emitEvent: false });
      }
    });
  }

  /** True when the given step's form group (or every listed control) is currently valid. */
  stepValid(group: AbstractControl): boolean {
    return group.valid;
  }

  optionLabel(options: readonly CatalogueOption[], value: string): string {
    return labelFromOptions(options, value);
  }

  loanTypeLabel(value: string): string {
    return this.loanTypes().find((option) => option.value === value)?.label ?? value;
  }

  employmentTypeLabel(value: string): string {
    return this.employmentTypes().find((option) => option.value === value)?.label ?? value;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();

    const details: LeadApplicantDetails = {
      gender: raw.applicant.gender,
      dob: raw.applicant.dob ? toIsoDate(raw.applicant.dob) : null,
      alternative_phone: raw.applicant.alternative_phone || null,
      age: raw.applicant.age,
      marital_status: raw.applicant.marital_status,
      caste_category: raw.applicant.caste_category,
      company_name: raw.loan.company_name,
      net_salary: raw.loan.net_salary,
      salary_account_type: raw.loan.salary_account_type,
      purpose_of_loan: raw.loan.purpose_of_loan,
      gst_number: this.showGstField() ? raw.loan.gst_number || null : null,
      insurance_type: this.showInsuranceField() ? raw.loan.insurance_type || null : null,
      car_type: this.showCarTypeField() ? raw.loan.car_type || null : null,
      mudra_loan_type: this.showMudraTypeField() ? raw.loan.mudra_loan_type || null : null,
      landmark: raw.address.landmark || null,
      current_address: raw.address.current_address,
      residential_type: raw.address.residential_type,
      since_resident: raw.address.since_resident,
      property_type: this.showPropertyTypeSection() ? raw.loanTypeDetails.property_type || null : null,
      lap_property_type: this.showLapSection() ? raw.loanTypeDetails.lap_property_type || null : null,
      balance_transfer_type: this.showLapSection() ? raw.loanTypeDetails.balance_transfer_type : null,
      balance_transfer_loan_amount: this.showLapSection()
        ? raw.loanTypeDetails.balance_transfer_loan_amount
        : null,
      topup_loan_amount: this.showLapSection() ? raw.loanTypeDetails.topup_loan_amount : null,
    };

    const payload: LeadPayload = {
      applicant_name: raw.applicant.applicant_name,
      applicant_email: raw.applicant.applicant_email || null,
      applicant_phone: raw.applicant.applicant_phone,
      loan_type: raw.loan.loan_type,
      loan_amount: raw.loan.loan_amount,
      tenure_months: raw.loan.tenure_months,
      monthly_income: raw.loan.monthly_income,
      credit_score: raw.loan.credit_score,
      employment_type: raw.loan.employment_type,
      city: raw.address.city,
      state: raw.address.state,
      pincode: raw.address.pincode || null,
      notes: raw.notes || null,
      details,
    };

    const id = this.leadId();
    const request = id ? this.leads.update(id, payload) : this.leads.create(payload);

    request.subscribe({
      next: (lead) => {
        this.saving.set(false);
        void this.router.navigate(['/leads', lead.id]);
      },
      error: () => {
        this.error.set('The lead could not be saved. Check the fields and retry.');
        this.saving.set(false);
      },
    });
  }
}
