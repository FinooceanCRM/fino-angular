import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SettingsService } from '@core/services/settings.service';

/** General settings — Company information, Branding, Email settings, Time zone. */
@Component({
  selector: 'app-super-admin-general-settings',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-general-settings.component.html',
  styleUrl: './super-admin-general-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminGeneralSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);

  protected readonly loading = signal(true);
  protected readonly form = this.fb.nonNullable.group({
    company: this.fb.nonNullable.group({
      company_name: '',
      support_email: '',
      support_phone: '',
      address: '',
      currency: '',
    }),
    branding: this.fb.nonNullable.group({
      primary_color: '',
      logo_url: '',
      favicon_url: '',
      tagline: '',
    }),
    email: this.fb.nonNullable.group({
      from_name: '',
      from_email: '',
      reply_to_email: '',
      footer_text: '',
    }),
    regional: this.fb.nonNullable.group({
      timezone: '',
      date_format: '',
      business_hours: '',
    }),
    platform: this.fb.nonNullable.group({
      default_page_size: 15,
      maintenance_mode: false,
    }),
  });

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings) => {
      this.form.patchValue(settings.general);
      this.loading.set(false);
    });
  }

  protected save(): void {
    this.settingsService.updateGeneral(this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('General settings saved.', 'Dismiss', { duration: 4000 });
    });
  }
}
