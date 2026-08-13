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
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';

import { ManagedRelationshipManager } from '@core/models/manager.model';
import { ManagerService } from '@core/services/manager.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-manager-relationship-managers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="My Relationship Managers"
      subtitle="Create, edit, activate and deactivate the RMs reporting to you"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (message(); as text) {
      <mat-card class="notice">
        <mat-card-content>{{ text }}</mat-card-content>
      </mat-card>
    }

    <mat-card class="card">
      <mat-card-header>
        <mat-card-title>
          {{ editingId() ? 'Edit Relationship Manager' : 'Create Relationship Manager' }}
        </mat-card-title>
        <mat-card-subtitle>
          New Relationship Managers are always attached to you.
        </mat-card-subtitle>
      </mat-card-header>
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
              <input matInput type="email" formControlName="email" />
              @if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>
                {{ editingId() ? 'New password (optional)' : 'Password' }}
              </mat-label>
              <input matInput type="password" formControlName="password" />
              @if (form.controls.password.hasError('minlength')) {
                <mat-error>At least 8 characters.</mat-error>
              }
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
          </div>

          <mat-slide-toggle formControlName="is_active">Active</mat-slide-toggle>

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || saving()"
            >
              <mat-icon>{{ editingId() ? 'save' : 'person_add' }}</mat-icon>
              {{ editingId() ? 'Save changes' : 'Create Relationship Manager' }}
            </button>
            @if (editingId()) {
              <button mat-stroked-button type="button" (click)="cancelEdit()">
                Cancel
              </button>
            }
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    <mat-card class="card">
      <mat-card-header>
        <mat-card-title>{{ total() }} Relationship Manager(s)</mat-card-title>
        <mat-card-subtitle>
          You can only see Relationship Managers reporting to you.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (rows().length === 0 && !loading()) {
          <p class="muted">No Relationship Managers report to you yet.</p>
        } @else {
          <table mat-table [dataSource]="rows()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container matColumnDef="employees">
              <th mat-header-cell *matHeaderCellDef>Employees</th>
              <td mat-cell *matCellDef="let row">{{ row.employee_count }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [highlighted]="row.is_active">{{ row.status }}</mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button type="button" (click)="edit(row)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-button
                  type="button"
                  [disabled]="saving()"
                  (click)="toggleActive(row)"
                >
                  {{ row.is_active ? 'Deactivate' : 'Activate' }}
                </button>
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
        margin-top: 1rem;
      }
      .notice {
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
      .full-width {
        width: 100%;
      }
      .muted {
        opacity: 0.75;
      }
    `,
  ],
})
export class ManagerRelationshipManagersComponent implements OnInit {
  private readonly managers = inject(ManagerService);
  private readonly fb = inject(FormBuilder);

  protected readonly columns = ['name', 'email', 'employees', 'status', 'actions'];
  protected readonly rows = signal<ManagedRelationshipManager[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    designation: [''],
    branch: [''],
    region: [''],
    is_active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected edit(row: ManagedRelationshipManager): void {
    this.editingId.set(row.id);
    this.form.controls.password.clearValidators();
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.form.patchValue({
      name: row.name,
      email: row.email,
      password: '',
      phone: row.phone ?? '',
      designation: row.designation ?? '',
      branch: row.branch ?? '',
      region: row.region ?? '',
      is_active: row.is_active,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ is_active: true });
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.form.controls.password.updateValueAndValidity();
  }

  protected save(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.message.set(null);

    const id = this.editingId();

    const request$ = id
      ? this.managers.updateRelationshipManager(id, {
          ...value,
          password: value.password ? value.password : null,
        })
      : this.managers.createRelationshipManager(value);

    request$.subscribe({
      next: () => {
        this.message.set(
          id ? 'Relationship Manager updated.' : 'Relationship Manager created.',
        );
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.message.set(
          'Could not save the Relationship Manager. Please check the fields.',
        );
        this.saving.set(false);
      },
    });
  }

  protected toggleActive(row: ManagedRelationshipManager): void {
    this.saving.set(true);
    this.managers
      .updateRelationshipManager(row.id, { is_active: !row.is_active })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set(
            row.is_active
              ? `${row.name} deactivated.`
              : `${row.name} activated.`,
          );
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.message.set('Could not change the status.');
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.managers.relationshipManagers().subscribe({
      next: (result) => {
        this.rows.set(result.relationship_managers);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Unable to load your Relationship Managers.');
        this.loading.set(false);
      },
    });
  }
}
