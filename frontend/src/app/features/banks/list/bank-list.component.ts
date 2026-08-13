import { CurrencyPipe } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { BankCriteria, BankCriteriaPayload } from '@core/models/bank.model';
import { CatalogueOption } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { BankService } from '@core/services/bank.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Bank criteria"
      subtitle="Products the matching engine evaluates leads against"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="notice"><mat-card-content>{{ message }}</mat-card-content></mat-card>
    }

    @if (canManage()) {
      <mat-card class="card">
        <mat-card-header><mat-card-title>Add a bank product</mat-card-title></mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" class="grid" (ngSubmit)="create()">
            <mat-form-field appearance="outline">
              <mat-label>Bank name</mat-label>
              <input matInput formControlName="bank_name" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Product name</mat-label>
              <input matInput formControlName="product_name" />
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
              <mat-label>Minimum amount</mat-label>
              <input matInput type="number" formControlName="min_loan_amount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Maximum amount</mat-label>
              <input matInput type="number" formControlName="max_loan_amount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Minimum monthly income</mat-label>
              <input matInput type="number" formControlName="min_monthly_income" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Minimum credit score</mat-label>
              <input matInput type="number" formControlName="min_credit_score" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Interest rate (%)</mat-label>
              <input matInput type="number" formControlName="interest_rate" />
            </mat-form-field>
            <mat-checkbox formControlName="is_active">Active</mat-checkbox>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
              Save product
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <mat-card class="card">
      <mat-card-content>
        @if (rows().length === 0 && !loading()) {
          <p class="muted">No bank criteria configured yet.</p>
        } @else {
          <table mat-table [dataSource]="rows()" class="full-width">
            <ng-container matColumnDef="bank">
              <th mat-header-cell *matHeaderCellDef>Bank</th>
              <td mat-cell *matCellDef="let row">{{ row.bank_name }}</td>
            </ng-container>
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let row">{{ row.product_name }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Loan type</th>
              <td mat-cell *matCellDef="let row">{{ row.loan_type }}</td>
            </ng-container>
            <ng-container matColumnDef="range">
              <th mat-header-cell *matHeaderCellDef>Amount range</th>
              <td mat-cell *matCellDef="let row">
                {{ row.min_loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }} –
                {{
                  row.max_loan_amount
                    ? (row.max_loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0')
                    : 'no cap'
                }}
              </td>
            </ng-container>
            <ng-container matColumnDef="rate">
              <th mat-header-cell *matHeaderCellDef>Rate</th>
              <td mat-cell *matCellDef="let row">{{ row.interest_rate ?? '—' }}%</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [highlighted]="row.is_active">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                @if (canManage()) {
                  <button mat-button (click)="toggle(row)">
                    {{ row.is_active ? 'Deactivate' : 'Activate' }}
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
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
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
        align-items: center;
      }
      .full-width {
        width: 100%;
      }
      .muted {
        opacity: 0.7;
      }
    `,
  ],
})
export class BankListComponent implements OnInit {
  private readonly banks = inject(BankService);
  private readonly leads = inject(LeadService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly columns = ['bank', 'product', 'type', 'range', 'rate', 'status', 'actions'];
  readonly rows = signal<BankCriteria[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    bank_name: ['', Validators.required],
    product_name: ['', Validators.required],
    loan_type: ['home', Validators.required],
    min_loan_amount: [100000, [Validators.required, Validators.min(0)]],
    max_loan_amount: [5000000],
    min_monthly_income: [25000, [Validators.required, Validators.min(0)]],
    min_credit_score: [700],
    interest_rate: [10.5],
    is_active: [true],
  });

  canManage(): boolean {
    return this.auth.user()?.role === 'super_admin';
  }

  ngOnInit(): void {
    this.load();
    this.leads.metadata().subscribe({
      next: (metadata) => this.loanTypes.set(metadata.loan_types),
      error: () => undefined,
    });
  }

  load(): void {
    this.loading.set(true);
    this.banks.list({ per_page: 50 }).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Bank criteria could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.banks.create(this.form.getRawValue() as BankCriteriaPayload).subscribe({
      next: () => {
        this.form.reset({
          loan_type: 'home',
          min_loan_amount: 100000,
          max_loan_amount: 5000000,
          min_monthly_income: 25000,
          min_credit_score: 700,
          interest_rate: 10.5,
          is_active: true,
          bank_name: '',
          product_name: '',
        });
        this.load();
      },
      error: () => this.error.set('The bank product could not be saved.'),
    });
  }

  toggle(row: BankCriteria): void {
    this.banks.update(row.id, { is_active: !row.is_active }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('The bank product could not be updated.'),
    });
  }
}
