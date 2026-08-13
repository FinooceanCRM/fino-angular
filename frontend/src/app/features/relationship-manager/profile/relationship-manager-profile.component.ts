import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { RelationshipManagerProfile } from '@core/models/relationship-manager.model';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-relationship-manager-profile',
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Relationship Manager profile"
      subtitle="View and update your own details"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
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
              <mat-label>RM code</mat-label>
              <input matInput [value]="rmCode()" disabled />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Designation</mat-label>
              <input matInput formControlName="designation" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Branch</mat-label>
              <input matInput formControlName="branch" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Region</mat-label>
              <input matInput formControlName="region" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Alternate phone</mat-label>
              <input matInput formControlName="alternate_phone" />
            </mat-form-field>

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
                <mat-error>Enter a valid pincode.</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || saving()"
            >
              <mat-icon>save</mat-icon>
              Save changes
            </button>
            <button mat-stroked-button type="button" (click)="reset()">
              Reset
            </button>
          </div>

          @if (message(); as text) {
            <p class="message">{{ text }}</p>
          }
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-top: 1rem;
      }
      .grid {
        display: grid;
        gap: 0.75rem 1rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .message {
        margin-top: 0.75rem;
        font-weight: 500;
      }
    `,
  ],
})
export class RelationshipManagerProfileComponent implements OnInit {
  private readonly relationshipManagers = inject(RelationshipManagerService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly rmCode = signal('');

  private profile: RelationshipManagerProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    designation: [''],
    branch: [''],
    region: [''],
    alternate_phone: [''],
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.relationshipManagers.profile().subscribe({
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

    this.relationshipManagers
      .updateProfile(this.form.getRawValue())
      .subscribe({
        next: (profile) => {
          this.apply(profile);
          this.message.set('Profile updated.');
          this.saving.set(false);
        },
        error: () => {
          this.message.set(
            'Could not save your profile. Please check the fields.',
          );
          this.saving.set(false);
        },
      });
  }

  protected reset(): void {
    if (this.profile) {
      this.apply(this.profile);
    }
  }

  private apply(profile: RelationshipManagerProfile): void {
    this.profile = profile;
    this.email.set(profile.user?.email ?? '');
    this.rmCode.set(profile.rm_code ?? '—');
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      designation: profile.designation ?? '',
      branch: profile.branch ?? '',
      region: profile.region ?? '',
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
