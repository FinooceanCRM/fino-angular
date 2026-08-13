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
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CatalogueOption, LeadPayload } from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="leadId() ? 'Edit lead' : 'Create lead'"
      subtitle="Applicant and loan requirement details"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="notice"><mat-card-content>{{ message }}</mat-card-content></mat-card>
    }

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Applicant name</mat-label>
            <input matInput formControlName="applicant_name" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mobile number</mat-label>
            <input matInput formControlName="applicant_phone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="applicant_email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Loan type</mat-label>
            <mat-select formControlName="loan_type">
              @for (type of loanTypes(); track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Loan amount</mat-label>
            <input matInput type="number" formControlName="loan_amount" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tenure (months)</mat-label>
            <input matInput type="number" formControlName="tenure_months" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monthly income</mat-label>
            <input matInput type="number" formControlName="monthly_income" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Credit score</mat-label>
            <input matInput type="number" formControlName="credit_score" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Employment type</mat-label>
            <mat-select formControlName="employment_type">
              @for (type of employmentTypes(); track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
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
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-2">
            <mat-label>Notes</mat-label>
            <textarea matInput rows="3" formControlName="notes"></textarea>
          </mat-form-field>

          <div class="actions span-2">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || saving()"
            >
              {{ leadId() ? 'Save changes' : 'Create lead' }}
            </button>
            <a mat-stroked-button routerLink="/leads">Cancel</a>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 1rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.75rem;
      }
      .span-2 {
        grid-column: 1 / -1;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
      }
    `,
  ],
})
export class LeadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly leadId = signal<number | null>(null);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly employmentTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    applicant_name: ['', [Validators.required, Validators.maxLength(191)]],
    applicant_phone: ['', [Validators.required, Validators.maxLength(32)]],
    applicant_email: [''],
    loan_type: ['home', Validators.required],
    loan_amount: [500000, [Validators.required, Validators.min(1)]],
    tenure_months: [60],
    monthly_income: [0],
    credit_score: [700],
    employment_type: ['salaried'],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.loanTypes.set(metadata.loan_types);
        this.employmentTypes.set(metadata.employment_types);
      },
      error: () => undefined,
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.leadId.set(id);
      this.loading.set(true);
      this.leads.detail(id).subscribe({
        next: (detail) => {
          this.form.patchValue({
            applicant_name: detail.lead.applicant_name,
            applicant_phone: detail.lead.applicant_phone ?? '',
            applicant_email: detail.lead.applicant_email ?? '',
            loan_type: detail.lead.loan_type,
            loan_amount: detail.lead.loan_amount,
            tenure_months: detail.lead.tenure_months ?? 60,
            monthly_income: detail.lead.monthly_income ?? 0,
            credit_score: detail.lead.credit_score ?? 700,
            employment_type: detail.lead.employment_type ?? 'salaried',
            city: detail.lead.city ?? '',
            state: detail.lead.state ?? '',
            pincode: detail.lead.pincode ?? '',
            notes: detail.lead.notes ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('This lead could not be loaded.');
          this.loading.set(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload = this.form.getRawValue() as unknown as LeadPayload;
    const id = this.leadId();
    const request = id
      ? this.leads.update(id, payload)
      : this.leads.create(payload);

    request.subscribe({
      next: (lead) => {
        this.saving.set(false);
        void this.router.navigate(['/leads', lead.id]);
      },
      error: () => {
        this.error.set('The lead could not be saved. Check the fields and retry.');
        this.saving.set(false);
      },
    });
  }
}
