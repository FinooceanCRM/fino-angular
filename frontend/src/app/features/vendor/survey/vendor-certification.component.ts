import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { debounceTime, filter } from 'rxjs';

import {
  CertImage,
  VendorCertification,
  VendorCertificationDraftPayload,
  VendorCertificationMetadata,
} from '@core/models/vendor-certification.model';
import { DeviceService } from '@core/services/device.service';
import { GeocodeService } from '@core/services/geocode.service';
import { VendorCertificationService } from '@core/services/vendor-certification.service';
import {
  aadhaarValidator,
  calculateAge,
  gstValidator,
  mobileValidator,
  NAME_PATTERN,
  pastDateValidator,
  pinValidator,
} from '@core/validators/vendor-cert.validators';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { CertImageUploadComponent } from './cert-image-upload.component';
import { LatLng, LeafletMapComponent } from './leaflet-map.component';

/**
 * Vendor Certification wizard — the Fino-native rebuild of the reference
 * Customer Survey (customer-survey/ PHP app). Same five-step sequence,
 * same field set, same validation, same map / image / review behaviour;
 * built on Angular Material + Fino's design system instead of the PHP
 * app's Bootstrap markup.
 *
 *   1 Location permission  2 Vendor details  3 Location & map
 *   4 Images               5 Review → Submit → certificate
 *
 * The draft is a server row (Fino is stateless); it autosaves on change and
 * on every step move, so a refresh resumes exactly where the vendor left
 * off — the equivalent of the source app's session draft.
 */
@Component({
  selector: 'app-vendor-certification',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    LeafletMapComponent,
    CertImageUploadComponent,
  ],
  templateUrl: './vendor-certification.component.html',
  styleUrl: './vendor-certification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorCertificationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly certs = inject(VendorCertificationService);
  private readonly geocode = inject(GeocodeService);
  private readonly device = inject(DeviceService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('stepper') private stepper?: MatStepper;
  @ViewChild(LeafletMapComponent) private map?: LeafletMapComponent;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly meta = signal<VendorCertificationMetadata | null>(null);
  protected readonly draftId = signal<number | null>(null);
  protected readonly images = signal<CertImage[]>([]);
  protected readonly locating = signal(false);
  protected readonly geoDenied = signal(false);
  protected readonly searchResults = signal<{ label: string; lat: number; lng: number }[]>([]);
  protected readonly savedAt = signal<Date | null>(null);

  protected readonly genders = ['Male', 'Female', 'Other'] as const;

  protected readonly form = this.fb.group({
    // Step 2 — personal
    full_name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    guardian_name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    gender: ['Male', Validators.required],
    dob: [null as Date | null, [Validators.required, pastDateValidator]],
    age: [null as number | null, [Validators.required, Validators.min(1), Validators.max(120)]],
    mobile: ['', [Validators.required, mobileValidator]],
    alt_mobile: ['', [mobileValidator]],
    email: ['', [Validators.email]],
    aadhaar_number: ['', [aadhaarValidator]],
    occupation: [''],
    education: [''],
    category: [''],
    social_category: ['', Validators.required],
    // Step 2 — shop
    shop_name: ['', [Validators.required, Validators.minLength(2)]],
    business_type: ['', Validators.required],
    vendor_category: ['', Validators.required],
    years_in_business: [null as number | null, [Validators.required, Validators.min(0), Validators.max(90)]],
    ownership: ['', Validators.required],
    license_number: [''],
    gst_number: ['', [gstValidator]],
    // Upper bounds mirror SubmitVendorCertificationRequest / the source
    // survey's decimal() rules — ₹1 crore/day, ₹10 crore/month.
    daily_income: [null as number | null, [Validators.min(0), Validators.max(9_999_999.99)]],
    monthly_income: [null as number | null, [Validators.min(0), Validators.max(99_999_999.99)]],
    employees: [0 as number | null, [Validators.min(0), Validators.max(500)]],
    business_open_time: ['09:00'],
    business_close_time: ['21:00'],
    weekly_holiday: ['None'],
    seasonal_business: ['No'],
    // Step 3 — location (hidden / map-driven)
    location_mode: ['manual'],
    gps_latitude: [null as number | null, Validators.required],
    gps_longitude: [null as number | null, Validators.required],
    accuracy: [null as number | null],
    gps_heading: [null as number | null],
    gps_speed: [null as number | null],
    gps_captured_at: [null as string | null],
    location_verified: [false],
    // Step 3 — address
    house_no: [''],
    building: [''],
    street: [''],
    landmark: [''],
    area: [''],
    village: [''],
    city: ['', [Validators.required, Validators.minLength(2)]],
    district: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    pin_code: ['', [Validators.required, pinValidator]],
    country: ['India'],
    // Complete free-text address — required on submit (mirrors the source
    // survey's `<textarea id="address" required>`). Reverse-geocode fills
    // it; the vendor can also compose it from the fields above.
    address: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(500)]],
    // Step 5 — declarations
    declaration_truth: [false, Validators.requiredTrue],
    declaration_submit: [false, Validators.requiredTrue],
  });

  private searchTerm = '';

  ngOnInit(): void {
    this.certs.metadata().subscribe({
      next: (m) => this.meta.set(m),
      error: () => this.meta.set(null),
    });

    this.certs.draft().subscribe({
      next: (draft) => {
        this.hydrate(draft);
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Could not start your certification.');
        this.loading.set(false);
      },
    });

    // Auto-fill age from DOB (mirrors survey.js).
    this.form.controls.dob.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dob) => {
        if (dob instanceof Date && !isNaN(dob.getTime())) {
          const age = calculateAge(dob);
          if (age >= 0 && age < 120) this.form.controls.age.setValue(age, { emitEvent: false });
        }
      });

    // Estimate monthly income from daily income when blank (× 26).
    this.form.controls.daily_income.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((daily) => {
        if (daily != null && !this.form.controls.monthly_income.value) {
          this.form.controls.monthly_income.setValue(Math.round(daily * 26 * 100) / 100, { emitEvent: false });
        }
      });

    // Debounced draft autosave.
    this.form.valueChanges
      .pipe(debounceTime(1200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.persistDraft(false));
  }

  private hydrate(draft: VendorCertification): void {
    this.draftId.set(draft.id);
    this.images.set(draft.images ?? []);

    this.form.patchValue(
      {
        full_name: draft.full_name ?? '',
        guardian_name: draft.guardian_name ?? '',
        gender: draft.gender ?? 'Male',
        dob: draft.dob ? new Date(draft.dob) : null,
        age: draft.age,
        mobile: draft.mobile ?? '',
        alt_mobile: draft.alt_mobile ?? '',
        email: draft.email ?? '',
        aadhaar_number: draft.aadhaar_number ?? '',
        occupation: draft.occupation ?? '',
        education: draft.education ?? '',
        category: draft.category ?? '',
        social_category: draft.social_category ?? '',
        shop_name: draft.shop_name ?? '',
        business_type: draft.business_type ?? '',
        vendor_category: draft.vendor_category ?? '',
        years_in_business: draft.years_in_business,
        ownership: draft.ownership ?? '',
        license_number: draft.license_number ?? '',
        gst_number: draft.gst_number ?? '',
        daily_income: draft.daily_income,
        monthly_income: draft.monthly_income,
        employees: draft.employees ?? 0,
        business_open_time: draft.business_open_time?.slice(0, 5) ?? '09:00',
        business_close_time: draft.business_close_time?.slice(0, 5) ?? '21:00',
        weekly_holiday: draft.weekly_holiday ?? 'None',
        seasonal_business: draft.seasonal_business ?? 'No',
        location_mode: draft.location_mode ?? 'manual',
        gps_latitude: draft.gps_latitude,
        gps_longitude: draft.gps_longitude,
        accuracy: draft.accuracy,
        gps_heading: draft.gps_heading,
        gps_speed: draft.gps_speed,
        gps_captured_at: draft.gps_captured_at,
        location_verified: draft.location_verified,
        house_no: draft.house_no ?? '',
        building: draft.building ?? '',
        street: draft.street ?? '',
        landmark: draft.landmark ?? '',
        area: draft.area ?? '',
        village: draft.village ?? '',
        city: draft.city ?? '',
        district: draft.district ?? '',
        state: draft.state ?? '',
        pin_code: draft.pin_code ?? '',
        country: draft.country ?? 'India',
        address: draft.address ?? '',
      },
      { emitEvent: false },
    );
  }

  /* --------------------------------------------------------- step 1: GPS */

  protected async enableLocation(): Promise<void> {
    this.locating.set(true);
    try {
      // DeviceService uses the Capacitor Geolocation plugin on native
      // (handling the OS permission prompt) and navigator.geolocation on
      // the web.
      const pos = await this.device.getPosition({ timeout: 12000, highAccuracy: true });
      this.locating.set(false);
      this.geoDenied.set(false);
      const lat = +pos.latitude.toFixed(7);
      const lng = +pos.longitude.toFixed(7);
      this.form.patchValue({
        location_mode: 'gps',
        gps_latitude: lat,
        gps_longitude: lng,
        accuracy: pos.accuracy != null ? +pos.accuracy.toFixed(2) : null,
        gps_heading: pos.heading ?? null,
        gps_speed: pos.speed ?? null,
        gps_captured_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        location_verified: true,
      });
      this.reverseGeocode(lat, lng);
      this.persistDraft(false);
      this.stepper?.next();
    } catch {
      this.locating.set(false);
      this.geoDenied.set(true);
      this.snackBar.open(
        'Location could not be captured. Please enter the address manually.',
        'Dismiss',
        { duration: 5000 },
      );
    }
  }

  protected continueManually(): void {
    this.form.patchValue({ location_mode: 'manual' });
    this.stepper?.next();
  }

  /* ------------------------------------------------------- step 3: map */

  protected onStepChange(index: number): void {
    if (index === 2) setTimeout(() => this.map?.refresh(), 120);
    this.persistDraft(false);
  }

  protected onPinMoved(p: LatLng): void {
    this.form.patchValue({
      gps_latitude: p.lat,
      gps_longitude: p.lng,
      location_mode: this.form.controls.location_mode.value === 'gps' ? 'gps' : 'manual',
      location_verified: true,
    });
    this.reverseGeocode(p.lat, p.lng);
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.geocode.reverse(lat, lng).subscribe({
      next: (addr) => {
        if (!addr) return;
        const patch: Record<string, string> = {};
        for (const key of [
          'house_no', 'building', 'street', 'landmark', 'area', 'village',
          'city', 'district', 'state', 'pin_code', 'country', 'address',
        ] as const) {
          const value = (addr as unknown as Record<string, string>)[key];
          if (value && !((this.form.get(key)?.value ?? '') as string).trim()) {
            patch[key] = value;
          }
        }
        this.form.patchValue(patch as never);
      },
      error: () => undefined,
    });
  }

  protected onSearchInput(term: string): void {
    this.searchTerm = term;
    if (term.trim().length < 3) {
      this.searchResults.set([]);
      return;
    }
    this.geocode.suggest(term).subscribe({
      next: (items) =>
        this.searchResults.set(
          items.map((i) => ({ label: `${i.title}${i.subtitle ? ' · ' + i.subtitle : ''}`, lat: i.lat, lng: i.lng })),
        ),
      error: () => this.searchResults.set([]),
    });
  }

  protected pickSearchResult(r: { lat: number; lng: number }): void {
    this.searchResults.set([]);
    this.map?.setPosition(r.lat, r.lng, null);
    this.onPinMoved({ lat: r.lat, lng: r.lng });
  }

  /** "Build from the fields above" — mirrors the source survey's composeAddress(). */
  protected composeAddress(): void {
    const f = this.form.controls;
    const parts = [
      f.house_no.value, f.building.value, f.street.value, f.area.value,
      f.village.value, f.landmark.value, f.city.value, f.pin_code.value,
    ]
      .map((v) => (v ?? '').trim())
      .filter(Boolean);

    if (!parts.length) {
      this.snackBar.open('Fill in house no, street or area first.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.form.controls.address.setValue(parts.join(', '));
    this.form.controls.address.markAsDirty();
    this.form.controls.address.markAsTouched();
  }

  /* ----------------------------------------------------- step 4: images */

  protected profile(type: 'vendor' | 'shop' | 'product') {
    return this.meta()?.image_profiles[type] ?? null;
  }

  protected imageFor(type: 'vendor' | 'shop'): CertImage | null {
    return this.images().find((i) => i.image_type === type) ?? null;
  }

  protected productImages(): CertImage[] {
    return this.images().filter((i) => i.image_type === 'product');
  }

  protected get locationLocked(): boolean {
    return this.form.controls.gps_latitude.value == null || this.form.controls.gps_longitude.value == null;
  }

  protected onImageUploaded(img: CertImage): void {
    this.images.update((list) => [...list.filter((i) => !(i.image_type === img.image_type && i.image_type !== 'product')), img]);
  }

  protected onImageRemoved(id: number): void {
    this.images.update((list) => list.filter((i) => i.id !== id));
  }

  protected get imagesComplete(): boolean {
    return !!this.imageFor('vendor') && !!this.imageFor('shop');
  }

  /* ------------------------------------------------------ draft / submit */

  private toPayload(): VendorCertificationDraftPayload {
    const v = this.form.getRawValue();
    return {
      ...v,
      dob: v.dob ? this.formatDate(v.dob) : null,
      business_open_time: v.business_open_time || null,
      business_close_time: v.business_close_time || null,
    } as VendorCertificationDraftPayload;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  protected persistDraft(notify: boolean): void {
    if (this.draftId() == null || this.submitting()) return;
    this.saving.set(true);
    this.certs.saveDraft(this.toPayload()).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedAt.set(new Date());
        if (notify) this.snackBar.open('Draft saved. Continue any time.', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        if (notify) this.snackBar.open('Could not save the draft.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  protected saveDraftClicked(): void {
    this.persistDraft(true);
  }

  protected reviewIncomplete(): string[] {
    const missing: string[] = [];
    const personal = ['full_name', 'guardian_name', 'gender', 'dob', 'age', 'mobile', 'social_category'];
    const shop = ['shop_name', 'business_type', 'vendor_category', 'years_in_business', 'ownership'];
    const location = ['gps_latitude', 'gps_longitude', 'address', 'city', 'district', 'state', 'pin_code'];
    if (personal.some((k) => this.form.get(k)?.invalid)) missing.push('Personal details');
    if (shop.some((k) => this.form.get(k)?.invalid)) missing.push('Business details');
    if (location.some((k) => this.form.get(k)?.invalid)) missing.push('Location & address');
    if (!this.imagesComplete) missing.push('Images');
    return missing;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.imagesComplete) {
      this.snackBar.open('Please complete every step before submitting.', 'Dismiss', { duration: 4000 });
      const detailKeys = [
        'full_name', 'guardian_name', 'gender', 'dob', 'age', 'mobile', 'alt_mobile', 'email',
        'aadhaar_number', 'social_category', 'shop_name', 'business_type', 'vendor_category',
        'years_in_business', 'ownership', 'gst_number', 'daily_income', 'monthly_income', 'employees',
      ];
      const locationKeys = ['gps_latitude', 'address', 'city', 'district', 'state', 'pin_code'];
      if (this.stepper) {
        if (detailKeys.some((k) => this.form.get(k)?.invalid)) this.stepper.selectedIndex = 1;
        else if (locationKeys.some((k) => this.form.get(k)?.invalid)) this.stepper.selectedIndex = 2;
        else if (!this.imagesComplete) this.stepper.selectedIndex = 3;
      }
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.certs.submit(this.toPayload()).subscribe({
      next: (cert) => {
        this.submitting.set(false);
        void this.router.navigate(['/vendor/certification/success', cert.id]);
      },
      error: (err: { message?: string; errors?: Record<string, string[]> }) => {
        this.submitting.set(false);
        this.error.set(err?.message ?? 'Submission failed. Please review the form.');
        this.snackBar.open(err?.message ?? 'Submission failed.', 'Dismiss', { duration: 5000 });
      },
    });
  }

  protected accuracyLabel(): string {
    const a = this.form.controls.accuracy.value;
    if (a == null) return 'Not available';
    const good = this.meta()?.map.good_accuracy ?? 50;
    if (a <= 20) return 'Excellent';
    if (a <= good) return 'Good';
    if (a <= 150) return 'Fair — verify the pin';
    return 'Poor — adjust the pin manually';
  }
}
