import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SettingsService } from '@core/services/settings.service';

/** Security settings — session policy, password policy, two-factor and login-attempt limits. */
@Component({
  selector: 'app-super-admin-security-settings',
  standalone: true,
  imports: [
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './super-admin-security-settings.component.html',
  styleUrl: './super-admin-security-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSecuritySettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsService = inject(SettingsService);

  protected readonly loading = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    session_timeout_minutes: 60,
    min_password_length: 8,
    require_special_character: true,
    require_number: true,
    two_factor_required: false,
    max_login_attempts: 5,
    ip_allowlist_enabled: false,
    ip_allowlist: '',
  });

  ngOnInit(): void {
    this.settingsService.get().subscribe((settings) => {
      this.form.patchValue(settings.security);
      this.loading.set(false);
    });
  }

  protected save(): void {
    this.settingsService.updateSecurity(this.form.getRawValue()).subscribe(() => {
      this.snackBar.open('Security settings saved.', 'Dismiss', { duration: 4000 });
    });
  }
}
