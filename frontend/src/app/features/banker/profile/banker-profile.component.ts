import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { BankerProfile } from '@core/models/banker.model';
import { BankerService } from '@core/services/banker.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-banker-profile',
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
  templateUrl: './banker-profile.component.html',
  styleUrl: './banker-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerProfileComponent implements OnInit {
  private readonly bankers = inject(BankerService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');

  private profile: BankerProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    bank_name: [''],
    branch: [''],
    designation: [''],
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
    this.bankers.profile().subscribe({
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

    this.bankers.updateProfile(this.form.getRawValue()).subscribe({
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

  private apply(profile: BankerProfile): void {
    this.profile = profile;
    this.email.set(profile.user?.email ?? '');
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      bank_name: profile.bank_name ?? '',
      branch: profile.branch ?? '',
      designation: profile.designation ?? '',
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
