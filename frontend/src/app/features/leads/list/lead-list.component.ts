import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import {
  CatalogueOption,
  Lead,
  PaginationMeta,
} from '@core/models/lead.model';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Leads"
      subtitle="Every lead visible to you, scoped by your role"
    />

    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="filters" class="filters" (ngSubmit)="load(0)">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput formControlName="search" placeholder="Name, phone, reference" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All</mat-option>
              @for (status of statuses(); track status.value) {
                <mat-option [value]="status.value">{{ status.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Loan type</mat-label>
            <mat-select formControlName="loan_type">
              <mat-option value="">All</mat-option>
              @for (type of loanTypes(); track type.value) {
                <mat-option [value]="type.value">{{ type.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit">Apply</button>
          <a mat-stroked-button routerLink="/leads/create">New lead</a>
        </form>
      </mat-card-content>
    </mat-card>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (error(); as message) {
      <mat-card class="notice"><mat-card-content>{{ message }}</mat-card-content></mat-card>
    }

    <mat-card class="card">
      <mat-card-content>
        @if (rows().length === 0 && !loading()) {
          <p class="muted">No leads match the current filters.</p>
        } @else {
          <table mat-table [dataSource]="rows()" class="full-width">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>Reference</th>
              <td mat-cell *matCellDef="let row">{{ row.reference }}</td>
            </ng-container>

            <ng-container matColumnDef="applicant">
              <th mat-header-cell *matHeaderCellDef>Applicant</th>
              <td mat-cell *matCellDef="let row">{{ row.applicant_name }}</td>
            </ng-container>

            <ng-container matColumnDef="loan">
              <th mat-header-cell *matHeaderCellDef>Loan</th>
              <td mat-cell *matCellDef="let row">
                {{ row.loan_type }} · {{ row.loan_amount | currency: 'INR' : 'symbol-narrow' : '1.0-0' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="assignee">
              <th mat-header-cell *matHeaderCellDef>Assigned to</th>
              <td mat-cell *matCellDef="let row">
                {{ row.assigned_employee?.name ?? row.assigned_relationship_manager?.name ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [highlighted]="true">{{ row.status_label }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let row">{{ row.created_at | date: 'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <a mat-button [routerLink]="['/leads', row.id]">Open</a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>

          <mat-paginator
            [length]="meta().total"
            [pageSize]="meta().per_page || 15"
            [pageIndex]="(meta().current_page || 1) - 1"
            [pageSizeOptions]="[10, 15, 25, 50]"
            (page)="onPage($event)"
          />
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 1rem;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
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
export class LeadListComponent implements OnInit {
  private readonly leads = inject(LeadService);
  private readonly fb = inject(FormBuilder);

  readonly columns = [
    'reference',
    'applicant',
    'loan',
    'assignee',
    'status',
    'created',
    'actions',
  ];

  readonly rows = signal<Lead[]>([]);
  readonly meta = signal<PaginationMeta>({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });
  readonly statuses = signal<CatalogueOption[]>([]);
  readonly loanTypes = signal<CatalogueOption[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
    loan_type: '',
  });

  private pageSize = 15;

  ngOnInit(): void {
    this.leads.metadata().subscribe({
      next: (metadata) => {
        this.statuses.set(metadata.statuses);
        this.loanTypes.set(metadata.loan_types);
      },
      error: () => undefined,
    });

    this.load(0);
  }

  load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.leads
      .list({
        ...this.filters.getRawValue(),
        page: pageIndex + 1,
        per_page: this.pageSize,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.meta.set({
            current_page: result.meta?.current_page ?? 1,
            per_page: result.meta?.per_page ?? this.pageSize,
            total: result.meta?.total ?? result.items.length,
            last_page: result.meta?.last_page ?? 1,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Leads could not be loaded.');
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex);
  }
}
