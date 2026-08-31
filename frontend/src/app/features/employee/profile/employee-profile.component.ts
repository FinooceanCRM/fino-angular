import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { EmployeeProfile } from '@core/models/employee.model';
import { AuthenticatedUser } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProfileHeaderComponent } from '@shared/components/profile-header.component';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('password_confirmation')?.value;
  return password && confirmation && password !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    ProfileHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      icon="person"
      title="My Profile"
      subtitle="Your account details and preferences"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <app-profile-header [name]="displayName()" [subtitle]="displaySubtitle()" />

          <h3 class="section-title">Personal Information</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Full name</mat-label>
              <input matInput formControlName="name" />
              @if (form.controls.name.hasError('required')) {
                <mat-error>Name is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput [value]="email()" disabled />
              <mat-hint>Email changes are handled by an administrator.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Employee code</mat-label>
              <input matInput [value]="employeeCode()" disabled />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Alternate phone</mat-label>
              <input matInput formControlName="alternate_phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Designation</mat-label>
              <input matInput formControlName="designation" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <input matInput formControlName="department" />
            </mat-form-field>
          </div>

          <h3 class="section-title">Address Information</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Address line 1</mat-label>
              <input matInput formControlName="address_line1" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Address line 2</mat-label>
              <input matInput formControlName="address_line2" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="city" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <input matInput formControlName="state" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Pincode</mat-label>
              <input matInput formControlName="pincode" />
              @if (form.controls.pincode.hasError('pattern')) {
                <mat-error>The pincode must contain 4 to 10 digits.</mat-error>
              }
            </mat-form-field>
          </div>

          <h3 class="section-title">Emergency Contact</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Emergency contact name</mat-label>
              <input matInput formControlName="emergency_contact_name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Emergency contact phone</mat-label>
              <input matInput formControlName="emergency_contact_phone" />
            </mat-form-field>
          </div>

          @if (message(); as text) {
            <p class="message">{{ text }}</p>
          }

          <div class="actions">
            <button
              mat-stroked-button
              type="button"
              [disabled]="saving()"
              (click)="reset()"
            >
              Cancel
            </button>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="tide-cta-pill"
              [disabled]="form.invalid || saving()"
            >
              <mat-icon>save</mat-icon>
              Save changes
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <h3 class="section-title">Change password</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Current password</mat-label>
              <input matInput type="password" formControlName="current_password" />
              @if (passwordForm.controls.current_password.hasError('required') && passwordForm.controls.current_password.touched) {
                <mat-error>Current password is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>New password</mat-label>
              <input matInput type="password" formControlName="password" />
              @if (passwordForm.controls.password.hasError('minlength')) {
                <mat-error>Must be at least 8 characters.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirm new password</mat-label>
              <input matInput type="password" formControlName="password_confirmation" />
              @if (passwordForm.hasError('mismatch') && passwordForm.controls.password_confirmation.touched) {
                <mat-error>Passwords do not match.</mat-error>
              }
            </mat-form-field>
          </div>

          @if (passwordMessage(); as text) {
            <p class="message">{{ text }}</p>
          }

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="tide-cta-pill"
              [disabled]="passwordForm.invalid || savingPassword()"
            >
              <mat-icon>lock_reset</mat-icon>
              Change password
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
          <h3 class="section-title">Preferences</h3>
          <div class="toggles">
            <mat-slide-toggle formControlName="email_notifications">Email notifications</mat-slide-toggle>
            <mat-slide-toggle formControlName="sms_notifications">SMS notifications</mat-slide-toggle>
            <mat-slide-toggle formControlName="notify_on_assignment">Notify me when a lead is assigned to me</mat-slide-toggle>
            <mat-slide-toggle formControlName="notify_on_approval">Notify me when a lead is approved</mat-slide-toggle>
          </div>

          @if (preferencesMessage(); as text) {
            <p class="message">{{ text }}</p>
          }

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="tide-cta-pill"
              [disabled]="savingPreferences()"
            >
              <mat-icon>save</mat-icon>
              Save preferences
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-top: 1rem;
        border-radius: var(--app-radius-md);
      }
      .section-title {
        margin: 0 0 var(--app-space-3);
        padding-bottom: var(--app-space-2);
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--mat-sys-primary);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      .section-title:not(:first-child) {
        margin-top: var(--app-space-5);
      }
      .grid {
        display: grid;
        gap: 0.75rem 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      @media (max-width: 640px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .toggles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .message {
        margin-top: 0.75rem;
        font-weight: 500;
      }
    `,
  ],
})
export class EmployeeProfileComponent implements OnInit {
  private readonly employees = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly employeeCode = signal('');
  protected readonly displayName = signal('');
  protected readonly displaySubtitle = signal('');

  protected readonly savingPassword = signal(false);
  protected readonly passwordMessage = signal<string | null>(null);
  protected readonly savingPreferences = signal(false);
  protected readonly preferencesMessage = signal<string | null>(null);

  private profile: EmployeeProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    designation: [''],
    department: [''],
    alternate_phone: [''],
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
    emergency_contact_name: [''],
    emergency_contact_phone: [''],
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      current_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected readonly preferencesForm = this.fb.nonNullable.group({
    email_notifications: [true],
    sms_notifications: [true],
    notify_on_assignment: [true],
    notify_on_approval: [true],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.employees.profile().subscribe({
      next: (profile) => {
        this.apply(profile);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Unable to load your profile.');
        this.loading.set(false);
      },
    });

    this.applyPreferences(this.auth.user());
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.savingPassword.set(true);
    this.passwordMessage.set(null);

    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.passwordMessage.set('Password updated.');
        this.passwordForm.reset({ current_password: '', password: '', password_confirmation: '' });
        this.savingPassword.set(false);
      },
      error: () => {
        this.passwordMessage.set('Could not update your password — check your current password and try again.');
        this.savingPassword.set(false);
      },
    });
  }

  protected savePreferences(): void {
    this.savingPreferences.set(true);
    this.preferencesMessage.set(null);

    this.auth.updatePreferences(this.preferencesForm.getRawValue()).subscribe({
      next: (user) => {
        this.applyPreferences(user);
        this.preferencesMessage.set('Preferences saved.');
        this.savingPreferences.set(false);
      },
      error: () => {
        this.preferencesMessage.set('Could not save your preferences.');
        this.savingPreferences.set(false);
      },
    });
  }

  private applyPreferences(user: AuthenticatedUser | null): void {
    if (!user) {
      return;
    }
    this.preferencesForm.patchValue({
      email_notifications: user.email_notifications,
      sms_notifications: user.sms_notifications,
      notify_on_assignment: user.notify_on_assignment,
      notify_on_approval: user.notify_on_approval,
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    this.employees.updateProfile(this.form.getRawValue()).subscribe({
      next: (profile) => {
        this.apply(profile);
        this.message.set('Profile updated.');
        this.saving.set(false);
      },
      error: () => {
        this.message.set('Could not save your profile. Please check the fields.');
        this.saving.set(false);
      },
    });
  }

  protected reset(): void {
    if (this.profile) {
      this.apply(this.profile);
    }
  }

  private apply(profile: EmployeeProfile): void {
    this.profile = profile;
    this.email.set(profile.user?.email ?? '');
    this.employeeCode.set(profile.employee_code ?? '—');
    this.displayName.set(profile.user?.name ?? '');
    const roleLabel = profile.user?.role_label ?? 'Employee';
    const meta = profile.designation || profile.department || '';
    this.displaySubtitle.set(meta ? `${roleLabel} · ${meta}` : roleLabel);
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      designation: profile.designation ?? '',
      department: profile.department ?? '',
      alternate_phone: profile.alternate_phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      pincode: profile.pincode ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_phone: profile.emergency_contact_phone ?? '',
    });
    this.form.markAsPristine();
  }
}
