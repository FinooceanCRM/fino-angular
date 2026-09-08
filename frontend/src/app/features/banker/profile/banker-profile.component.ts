import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { BankerProfile } from '@core/models/banker.model';
import { BankerService } from '@core/services/banker.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ProfileHeaderComponent } from '@shared/components/profile-header.component';

/** Loan products — keys must match config/bankers.php on the backend. */
const PRODUCTS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'personal_loan', label: 'Personal Loan' },
  { key: 'business_loan', label: 'Business Loan' },
  { key: 'home_loan', label: 'Home Loan' },
  { key: 'car_loan', label: 'Car Loan' },
  { key: 'mortgage_loan', label: 'Mortgage Loan' },
];

@Component({
  selector: 'app-banker-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    PageHeaderComponent,
    ProfileHeaderComponent,
  ],
  templateUrl: './banker-profile.component.html',
  styleUrl: './banker-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerProfileComponent implements OnInit {
  private readonly bankers = inject(BankerService);
  private readonly fb = inject(FormBuilder);

  protected readonly products = PRODUCTS;

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly displayName = signal('');
  protected readonly displaySubtitle = signal('');

  private profile: BankerProfile | null = null;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: [''],
    first_name: [''],
    last_name: [''],
    country: [''],
    pan_number: ['', [Validators.pattern(/^$|^[A-Za-z0-9]{10}$/)]],

    bank_name: [''],
    branch: [''],
    branch_address: [''],
    branch_location: [''],
    bank_city: [''],
    bank_state: [''],
    designation: [''],
    employee_code: [''],

    manager_name: [''],
    manager_email: ['', [Validators.email]],
    manager_phone: [''],

    alternate_phone: [''],
    address_line1: [''],
    address_line2: [''],
    city: [''],
    state: [''],
    pincode: ['', [Validators.pattern(/^$|^[0-9]{4,10}$/)]],
  });

  /** One boolean control per product — collected into a string[] on save. */
  protected readonly productsForm = new FormGroup(
    Object.fromEntries(PRODUCTS.map((p) => [p.key, new FormControl(false, { nonNullable: true })])),
  );

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

    const selectedProducts = PRODUCTS.filter(
      (p) => this.productsForm.controls[p.key].value,
    ).map((p) => p.key);

    this.bankers
      .updateProfile({ ...this.form.getRawValue(), products: selectedProducts })
      .subscribe({
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
    this.displayName.set(profile.user?.name ?? '');
    const roleLabel = profile.user?.role_label ?? 'Banker';
    const meta = profile.bank_name || profile.branch_location || profile.branch || '';
    this.displaySubtitle.set(meta ? `${roleLabel} · ${meta}` : roleLabel);
    this.form.patchValue({
      name: profile.user?.name ?? '',
      phone: profile.user?.phone ?? '',
      first_name: profile.first_name ?? '',
      last_name: profile.last_name ?? '',
      country: profile.country ?? '',
      pan_number: profile.pan_number ?? '',
      bank_name: profile.bank_name ?? '',
      branch: profile.branch ?? '',
      branch_address: profile.branch_address ?? '',
      branch_location: profile.branch_location ?? '',
      bank_city: profile.bank_city ?? '',
      bank_state: profile.bank_state ?? '',
      designation: profile.designation ?? '',
      employee_code: profile.employee_code ?? '',
      manager_name: profile.manager_name ?? '',
      manager_email: profile.manager_email ?? '',
      manager_phone: profile.manager_phone ?? '',
      alternate_phone: profile.alternate_phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      pincode: profile.pincode ?? '',
    });
    const selected = new Set(profile.products ?? []);
    for (const p of PRODUCTS) {
      this.productsForm.controls[p.key].setValue(selected.has(p.key));
    }
    this.form.markAsPristine();
    this.productsForm.markAsPristine();
  }
}
