import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LOAN_TYPE_CATALOGUE } from '../../data/models/lead.model';
import { CityMapping, CityTier } from '../../data/models/settings.model';
import { SettingsDataProvider } from '../../data/providers/settings-data.provider';

const EMPTY_CITY: CityMapping = { city: '', state: '', tier: 'Tier 2', serviceable: true };

/** Matching Engine settings — minimum CIBIL score, loan amount limits, loan types, city mapping. */
@Component({
  selector: 'app-super-admin-matching-engine-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-matching-engine-settings.component.html',
  styleUrl: './super-admin-matching-engine-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminMatchingEngineSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsData = inject(SettingsDataProvider);

  protected readonly loanTypes = LOAN_TYPE_CATALOGUE;
  protected readonly tiers: CityTier[] = ['Tier 1', 'Tier 2', 'Tier 3'];

  private readonly seed = this.settingsData.settings().matching_engine;

  private buildCityGroup(city: CityMapping) {
    return this.fb.nonNullable.group({
      city: city.city,
      state: city.state,
      tier: city.tier,
      serviceable: city.serviceable,
    });
  }

  protected readonly form = this.fb.nonNullable.group({
    min_cibil_score: this.seed.min_cibil_score,
    min_match_score: this.seed.min_match_score,
    auto_run_on_create: this.seed.auto_run_on_create,
    enabled_loan_types: this.fb.nonNullable.group(
      Object.fromEntries(
        LOAN_TYPE_CATALOGUE.map((type) => [type.value, this.seed.enabled_loan_types.includes(type.value)]),
      ),
    ),
    loan_amount_limits: this.fb.array(
      this.seed.loan_amount_limits.map((limit) =>
        this.fb.nonNullable.group({
          loan_type: limit.loan_type,
          min_amount: limit.min_amount,
          max_amount: limit.max_amount,
        }),
      ),
    ),
    city_mapping: this.fb.array(this.seed.city_mapping.map((city) => this.buildCityGroup(city))),
  });

  protected readonly cityRows = this.form.controls.city_mapping;

  protected loanTypeLabel(value: string): string {
    return this.loanTypes.find((t) => t.value === value)?.label ?? value;
  }

  protected addCity(): void {
    this.cityRows.push(this.buildCityGroup(EMPTY_CITY));
  }

  protected removeCity(index: number): void {
    this.cityRows.removeAt(index);
  }

  protected save(): void {
    const raw = this.form.getRawValue();
    const enabledLoanTypes = Object.entries(raw.enabled_loan_types)
      .filter(([, enabled]) => enabled)
      .map(([type]) => type);

    this.settingsData.saveMatchingEngine({
      min_cibil_score: raw.min_cibil_score,
      min_match_score: raw.min_match_score,
      auto_run_on_create: raw.auto_run_on_create,
      enabled_loan_types: enabledLoanTypes,
      loan_amount_limits: raw.loan_amount_limits,
      city_mapping: raw.city_mapping,
    });

    this.snackBar.open('Matching engine settings saved.', 'Dismiss', { duration: 4000 });
  }
}
