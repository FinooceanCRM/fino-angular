import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { PageHeaderComponent } from '@shared/components/page-header.component';

import { ManagerProfileDataProvider } from './data/manager-profile.provider';

/** Profile — User profile, Settings and Password management, all backed by mock state (no HTTP). */
@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTabsModule,
    PageHeaderComponent,
  ],
  templateUrl: './manager-profile.component.html',
  styleUrl: './manager-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerProfileComponent {
  private readonly data = inject(ManagerProfileDataProvider);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly email = this.data.profile().email;
  protected readonly managerCode = this.data.profile().managerCode;

  // ---------- User profile ----------
  protected readonly profileForm = this.fb.nonNullable.group({
    name: [this.data.profile().name, [Validators.required, Validators.minLength(2)]],
    phone: [this.data.profile().phone],
    alternatePhone: [this.data.profile().alternatePhone],
    designation: [this.data.profile().designation],
    branch: [this.data.profile().branch],
    region: [this.data.profile().region],
    addressLine1: [this.data.profile().addressLine1],
    addressLine2: [this.data.profile().addressLine2],
    city: [this.data.profile().city],
    state: [this.data.profile().state],
    pincode: [this.data.profile().pincode, [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
  });

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.data.updateProfile(this.profileForm.getRawValue());
    this.snackBar.open('Profile updated.', 'Dismiss', { duration: 4000 });
  }

  protected resetProfile(): void {
    const profile = this.data.profile();
    this.profileForm.reset({
      name: profile.name,
      phone: profile.phone,
      alternatePhone: profile.alternatePhone,
      designation: profile.designation,
      branch: profile.branch,
      region: profile.region,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      pincode: profile.pincode,
    });
  }

  // ---------- Settings ----------
  protected readonly settingsForm = this.fb.nonNullable.group({
    emailNotifications: [this.data.settings().emailNotifications],
    smsNotifications: [this.data.settings().smsNotifications],
    notifyOnAssignment: [this.data.settings().notifyOnAssignment],
    notifyOnApproval: [this.data.settings().notifyOnApproval],
  });

  protected saveSettings(): void {
    this.data.updateSettings(this.settingsForm.getRawValue());
    this.snackBar.open('Settings saved.', 'Dismiss', { duration: 4000 });
  }

  // ---------- Password management ----------
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected readonly passwordError = signal<string | null>(null);

  protected changePassword(): void {
    this.passwordError.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    const success = this.data.changePassword(currentPassword, newPassword);
    if (!success) {
      this.passwordError.set('Current password is incorrect.');
      return;
    }

    this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    this.snackBar.open('Password changed.', 'Dismiss', { duration: 4000 });
  }
}
