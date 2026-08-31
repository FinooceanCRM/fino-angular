import { DatePipe } from '@angular/common';
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

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import { RelationshipManagerProfile } from '@core/models/relationship-manager.model';
import { AuthService } from '@core/services/auth.service';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { ProfileHeaderComponent } from '@shared/components/profile-header.component';

/** Profile — User profile (real `relationship-managers/profile`), Settings (real `auth/preferences`) and Password management (real `auth/password`). */
@Component({
  selector: 'app-relationship-manager-profile',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTabsModule,
    PageHeaderComponent,
    ProfileHeaderComponent,
  ],
  templateUrl: './relationship-manager-profile.component.html',
  styleUrl: './relationship-manager-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerProfileComponent {
  private readonly rmApi = inject(RelationshipManagerService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly profile = signal<RelationshipManagerProfile | null>(null);

  protected readonly email = signal('');
  protected readonly rmCode = signal('');
  protected readonly dateOfJoining = signal<string | null>(null);
  protected readonly displayName = signal('');
  protected readonly displaySubtitle = signal('');

  // ---------- User profile ----------
  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    designation: [''],
    branch: [''],
    region: [''],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
  });

  // ---------- Settings ----------
  protected readonly settingsForm = this.fb.nonNullable.group({
    emailNotifications: [true],
    smsNotifications: [false],
    notifyOnLeadAssignment: [true],
    notifyOnLeadApproval: [true],
  });

  // ---------- Password management ----------
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  protected readonly passwordError = signal<string | null>(null);

  constructor() {
    this.rmApi.profile().subscribe({
      next: (profile) => this.applyProfile(profile),
      error: () => this.snackBar.open('Could not load your profile.', 'Dismiss', { duration: 4000 }),
    });

    const user = this.auth.user();
    if (user) {
      this.settingsForm.reset({
        emailNotifications: user.email_notifications,
        smsNotifications: user.sms_notifications,
        notifyOnLeadAssignment: user.notify_on_assignment,
        notifyOnLeadApproval: user.notify_on_approval,
      });
    }
  }

  private applyProfile(profile: RelationshipManagerProfile): void {
    this.profile.set(profile);
    this.email.set(profile.user.email);
    this.rmCode.set(profile.rm_code ?? '—');
    this.dateOfJoining.set(profile.date_of_joining);
    this.displayName.set(profile.user.name ?? '');
    const roleLabel = profile.user.role_label ?? 'Relationship Manager';
    const meta = profile.branch ? `${profile.branch} Branch` : profile.region || '';
    this.displaySubtitle.set(meta ? `${roleLabel} · ${meta}` : roleLabel);
    this.resetProfile();
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const raw = this.profileForm.getRawValue();

    this.rmApi
      .updateProfile({
        name: raw.name,
        phone: raw.phone || null,
        designation: raw.designation || null,
        branch: raw.branch || null,
        region: raw.region || null,
        address_line1: raw.addressLine1 || null,
        address_line2: raw.addressLine2 || null,
        city: raw.city || null,
        state: raw.state || null,
        pincode: raw.pincode || null,
      })
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.snackBar.open('Profile updated.', 'Dismiss', { duration: 4000 });
        },
        error: (err: NormalizedApiError) =>
          this.snackBar.open(err.message ?? 'Could not update your profile.', 'Dismiss', { duration: 4000 }),
      });
  }

  protected resetProfile(): void {
    const profile = this.profile();
    if (!profile) {
      return;
    }

    this.profileForm.reset({
      name: profile.user.name,
      phone: profile.user.phone ?? '',
      designation: profile.designation ?? '',
      branch: profile.branch ?? '',
      region: profile.region ?? '',
      addressLine1: profile.address_line1 ?? '',
      addressLine2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      pincode: profile.pincode ?? '',
    });
  }

  protected saveSettings(): void {
    const raw = this.settingsForm.getRawValue();

    this.auth
      .updatePreferences({
        email_notifications: raw.emailNotifications,
        sms_notifications: raw.smsNotifications,
        notify_on_assignment: raw.notifyOnLeadAssignment,
        notify_on_approval: raw.notifyOnLeadApproval,
      })
      .subscribe({
        next: () => this.snackBar.open('Settings saved.', 'Dismiss', { duration: 4000 }),
        error: () => this.snackBar.open('Could not save your settings.', 'Dismiss', { duration: 4000 }),
      });
  }

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

    this.auth
      .changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      .subscribe({
        next: () => {
          this.passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
          this.snackBar.open('Password changed.', 'Dismiss', { duration: 4000 });
        },
        error: (err: NormalizedApiError) =>
          this.passwordError.set(err.message ?? 'The current password is incorrect.'),
      });
  }
}
