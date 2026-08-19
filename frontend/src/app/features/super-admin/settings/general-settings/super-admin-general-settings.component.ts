import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SettingsDataProvider } from '../../data/providers/settings-data.provider';

/** General settings — Company information, Branding, Email settings, Time zone. */
@Component({
  selector: 'app-super-admin-general-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-general-settings.component.html',
  styleUrl: './super-admin-general-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminGeneralSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsData = inject(SettingsDataProvider);

  private readonly seed = this.settingsData.settings().general;

  protected readonly form = this.fb.nonNullable.group({
    company: this.fb.nonNullable.group({
      company_name: this.seed.company.company_name,
      support_email: this.seed.company.support_email,
      support_phone: this.seed.company.support_phone,
      address: this.seed.company.address,
      currency: this.seed.company.currency,
    }),
    branding: this.fb.nonNullable.group({
      primary_color: this.seed.branding.primary_color,
      logo_url: this.seed.branding.logo_url,
      favicon_url: this.seed.branding.favicon_url,
      tagline: this.seed.branding.tagline,
    }),
    email: this.fb.nonNullable.group({
      from_name: this.seed.email.from_name,
      from_email: this.seed.email.from_email,
      reply_to_email: this.seed.email.reply_to_email,
      footer_text: this.seed.email.footer_text,
    }),
    regional: this.fb.nonNullable.group({
      timezone: this.seed.regional.timezone,
      date_format: this.seed.regional.date_format,
      business_hours: this.seed.regional.business_hours,
    }),
    platform: this.fb.nonNullable.group({
      default_page_size: this.seed.platform.default_page_size,
      maintenance_mode: this.seed.platform.maintenance_mode,
    }),
  });

  protected save(): void {
    this.settingsData.saveGeneral(this.form.getRawValue());
    this.snackBar.open('General settings saved.', 'Dismiss', { duration: 4000 });
  }
}
