import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SettingsDataProvider } from '../../data/providers/settings-data.provider';

/** Security settings — session policy, password policy, two-factor and login-attempt limits. */
@Component({
  selector: 'app-super-admin-security-settings',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSlideToggleModule],
  templateUrl: './super-admin-security-settings.component.html',
  styleUrl: './super-admin-security-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSecuritySettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly settingsData = inject(SettingsDataProvider);

  private readonly seed = this.settingsData.settings().security;

  protected readonly form = this.fb.nonNullable.group({
    session_timeout_minutes: this.seed.session_timeout_minutes,
    min_password_length: this.seed.min_password_length,
    require_special_character: this.seed.require_special_character,
    require_number: this.seed.require_number,
    two_factor_required: this.seed.two_factor_required,
    max_login_attempts: this.seed.max_login_attempts,
    ip_allowlist_enabled: this.seed.ip_allowlist_enabled,
    ip_allowlist: this.seed.ip_allowlist,
  });

  protected save(): void {
    this.settingsData.saveSecurity(this.form.getRawValue());
    this.snackBar.open('Security settings saved.', 'Dismiss', { duration: 4000 });
  }
}
