import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AccountsProfile } from '@core/models/accounts.model';
import { AccountsService } from '@core/services/accounts.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProfileHeaderComponent } from '@shared/components/profile-header.component';

/** Mirrors BankerProfileComponent — same shape, Accounts-specific fields. */
@Component({
  selector: 'app-accounts-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ProfileHeaderComponent,
  ],
  templateUrl: './accounts-profile.component.html',
  styleUrl: './accounts-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsProfileComponent implements OnInit {
  private readonly accounts = inject(AccountsService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly displayName = signal('');
  protected readonly displaySubtitle = signal('');

  private profile: AccountsProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    designation: [''],
    branch: [''],
    employee_code: [''],
    alternate_phone: [''],
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.accounts.profile().subscribe({
      next: (profile) => {
        this.apply(profile);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Unable to load your profile.');
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.message.set(null);

    this.accounts.updateProfile(this.form.getRawValue()).subscribe({
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

  private apply(profile: AccountsProfile): void {
    this.profile = profile;
    this.email.set(profile.user?.email ?? '');
    this.displayName.set(profile.user?.name ?? '');
    const roleLabel = profile.user?.role_label ?? 'Accounts';
    const meta = profile.designation || profile.branch || '';
    this.displaySubtitle.set(meta ? `${roleLabel} · ${meta}` : roleLabel);
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      designation: profile.designation ?? '',
      branch: profile.branch ?? '',
      employee_code: profile.employee_code ?? '',
      alternate_phone: profile.alternate_phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      pincode: profile.pincode ?? '',
    });
    this.form.markAsPristine();
  }
}
