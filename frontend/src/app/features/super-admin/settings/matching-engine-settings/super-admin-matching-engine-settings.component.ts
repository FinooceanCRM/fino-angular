import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CityMapping, CityTier, LoanAmountLimit, MatchingEngineSettings } from '@core/models/settings.model';
import { SettingsService } from '@core/services/settings.service';

import { LOAN_TYPE_CATALOGUE } from '../../data/models/lead.model';

const EMPTY_CITY: CityMapping = { city: '', state: '', tier: 'Tier 2', serviceable: true };

function buildCityGroup(fb: FormBuilder, city: CityMapping) {
  return fb.nonNullable.group({
    city: city.city,
    state: city.state,
    tier: city.tier,
    serviceable: city.serviceable,
  });
}

function buildLimitGroup(fb: FormBuilder, limit: LoanAmountLimit) {
  return fb.nonNullable.group({
    loan_type: limit.loan_type,
    min_amount: limit.min_amount,
    max_amount: limit.max_amount,
  });
}

/** Matching Engine settings — minimum CIBIL score, loan amount limits, loan types, city mapping. */
@Component({
  selector: 'app-super-admin-matching-engine-settings',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-matching-engine-settings.component.html',
  styleUrl: './super-admin-matching-engine-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminMatchingEngineSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);

  protected readonly loading = signal(true);
  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly tiers: CityTier[] = ['Tier 1', 'Tier 2', 'Tier 3'];

  protected readonly form = this.fb.nonNullable.group({
    min_cibil_score: 650,
    min_match_score: 60,
    auto_run_on_create: true,
    enabled_loan_types: this.fb.nonNullable.group(
      Object.fromEntries(LOAN_TYPE_CATALOGUE.map((type) => [type.value, false])),
    ),
    loan_amount_limits: this.fb.array([buildLimitGroup(this.fb, { loan_type: '', min_amount: 0, max_amount: 0 })]),
    city_mapping: this.fb.array([buildCityGroup(this.fb, EMPTY_CITY)]),
  });

  protected readonly cityRows = this.form.controls.city_mapping;

  ngOnInit(): void {
    this.form.controls.loan_amount_limits.clear();
    this.cityRows.clear();

    this.settingsService.get().subscribe((settings) => {
      this.applySeed(settings.matching_engine);
      this.loading.set(false);
    });
  }

  private applySeed(seed: MatchingEngineSettings): void {
    this.form.patchValue({
      min_cibil_score: seed.min_cibil_score,
      min_match_score: seed.min_match_score,
      auto_run_on_create: seed.auto_run_on_create,
      enabled_loan_types: Object.fromEntries(
        LOAN_TYPE_CATALOGUE.map((type) => [type.value, seed.enabled_loan_types.includes(type.value)]),
      ),
    });

    const limits = this.form.controls.loan_amount_limits;
    limits.clear();
    seed.loan_amount_limits.forEach((limit) => limits.push(buildLimitGroup(this.fb, limit)));

    this.cityRows.clear();
    seed.city_mapping.forEach((city) => this.cityRows.push(buildCityGroup(this.fb, city)));
  }

  protected loanTypeLabel(value: string): string {
    return this.loanTypes.find((t) => t.value === value)?.label ?? value;
  }

  protected addCity(): void {
    this.cityRows.push(buildCityGroup(this.fb, EMPTY_CITY));
  }

  protected removeCity(index: number): void {
    this.cityRows.removeAt(index);
  }

  protected save(): void {
    const raw = this.form.getRawValue();
    const enabledLoanTypes = Object.entries(raw.enabled_loan_types)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    this.settingsService
      .updateMatchingEngine({
        min_cibil_score: raw.min_cibil_score,
        min_match_score: raw.min_match_score,
        auto_run_on_create: raw.auto_run_on_create,
        enabled_loan_types: enabledLoanTypes,
        loan_amount_limits: raw.loan_amount_limits,
        city_mapping: raw.city_mapping,
      })
      .subscribe(() => {
        this.snackBar.open('Matching engine settings saved.', 'Dismiss', { duration: 4000 });
      });
  }
}
