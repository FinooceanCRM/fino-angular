import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { AffiliateProfile } from '@core/models/affiliate.model';
import { AffiliateService } from '@core/services/affiliate.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProfileHeaderComponent } from '@shared/components/profile-header.component';

@Component({
  selector: 'app-affiliate-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    ProfileHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      icon="person"
      title="My Profile"
      subtitle="View and update your affiliate details"
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
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Alternate phone</mat-label>
              <input matInput formControlName="alternate_phone" />
            </mat-form-field>
          </div>

          <h3 class="section-title">Referral</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Referral code</mat-label>
              <input matInput [value]="referralCode()" disabled />
              <mat-hint>Auto-generated — not editable.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Commission rate</mat-label>
              <input matInput [value]="commissionRateDisplay()" disabled />
              <mat-hint>Set by a Super Admin.</mat-hint>
            </mat-form-field>
          </div>

          <h3 class="section-title">Payout Details</h3>
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Payout method</mat-label>
              <mat-select formControlName="payout_method">
                <mat-option value="bank_transfer">Bank transfer</mat-option>
                <mat-option value="upi">UPI</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Account holder name</mat-label>
              <input matInput formControlName="payout_account_name" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Account number / UPI ID</mat-label>
              <input matInput formControlName="payout_account_number" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>IFSC / UPI handle</mat-label>
              <input matInput formControlName="payout_ifsc_or_upi" />
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
export class AffiliateProfileComponent implements OnInit {
  private readonly affiliates = inject(AffiliateService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly referralCode = signal('');
  protected readonly commissionRateDisplay = signal('—');
  protected readonly displayName = signal('');
  protected readonly displaySubtitle = signal('');

  private profile: AffiliateProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    alternate_phone: [''],
    payout_method: [''],
    payout_account_name: [''],
    payout_account_number: [''],
    payout_ifsc_or_upi: [''],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.affiliates.profile().subscribe({
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

    this.affiliates.updateProfile(this.form.getRawValue()).subscribe({
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

  private apply(profile: AffiliateProfile): void {
    this.profile = profile;
    this.email.set(profile.user?.email ?? '');
    this.referralCode.set(profile.referral_code);
    this.commissionRateDisplay.set(
      profile.commission_rate !== null ? `${profile.commission_rate}%` : 'Global default',
    );
    this.displayName.set(profile.user?.name ?? '');
    const roleLabel = profile.user?.role_label ?? 'Affiliate';
    this.displaySubtitle.set(
      profile.referral_code ? `${roleLabel} · Referral ${profile.referral_code}` : roleLabel,
    );
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      alternate_phone: profile.alternate_phone ?? '',
      payout_method: profile.payout_method ?? '',
      payout_account_name: profile.payout_account_name ?? '',
      payout_account_number: profile.payout_account_number ?? '',
      payout_ifsc_or_upi: profile.payout_ifsc_or_upi ?? '',
    });
    this.form.markAsPristine();
  }
}
