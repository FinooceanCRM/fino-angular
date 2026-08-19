import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NormalizedApiError } from '@core/interceptors/error.interceptor';
import {
  CreateUserPayload,
  Department,
  DEPARTMENT_LABELS,
  ManagedUser,
  UpdateUserPayload,
  UserRole,
} from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { FormComponent } from '@shared/components/form.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/**
 * Create/edit user. The manager / relationship-manager pickers are shown or
 * hidden based on the signed-in actor's own role and the selected target
 * role, mirroring UserService::applyHierarchyDefaults on the backend so the
 * request the actor submits doesn't get rejected by hierarchy validation.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    FormComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      [title]="mode() === 'edit' ? 'Edit User' : 'Create User'"
      [subtitle]="
        mode() === 'edit'
          ? 'Update this user\\'s details and access.'
          : 'Add a new user to the system and assign appropriate access.'
      "
    />

    <app-form
      [formGroup]="form"
      [loading]="loading()"
      [error]="error()"
      [submitLabel]="mode() === 'edit' ? 'Save Changes' : 'Create User'"
      [submitDisabled]="form.invalid || saving()"
      [twoColumn]="true"
      (submitted)="submit()"
    >
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" placeholder="Enter full name" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phone" placeholder="Enter phone number" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" placeholder="Enter email address" />
      </mat-form-field>

      @if (showManagerPicker()) {
        <mat-form-field appearance="outline">
          <mat-label>Manager</mat-label>
          <mat-select formControlName="manager_id" (selectionChange)="onManagerChange($event)">
            @for (manager of managers(); track manager.id) {
              <mat-option [value]="manager.id">{{ manager.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (showDepartmentPicker()) {
        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select formControlName="department">
            @for (option of departmentOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
          <mat-hint>Relationship Managers and Employees inherit this from their Manager.</mat-hint>
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>{{ mode() === 'edit' ? 'New password (optional)' : 'Password' }}</mat-label>
        <input
          matInput
          [type]="hidePassword() ? 'password' : 'text'"
          formControlName="password"
          autocomplete="new-password"
          placeholder="Enter password"
        />
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
          (click)="hidePassword.set(!hidePassword())"
        >
          <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.controls.password.touched && form.controls.password.hasError('minlength')) {
          <mat-error>Password must be at least 8 characters.</mat-error>
        }
      </mat-form-field>

      @if (showRmPicker()) {
        <mat-form-field appearance="outline">
          <mat-label>Relationship Manager</mat-label>
          <mat-select formControlName="relationship_manager_id">
            @for (rm of filteredRelationshipManagers(); track rm.id) {
              <mat-option [value]="rm.id">{{ rm.name }}</mat-option>
            }
          </mat-select>
          @if (filteredRelationshipManagers().length === 0) {
            <mat-hint>{{ rmHint() }}</mat-hint>
          }
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select formControlName="role" (selectionChange)="onRoleChange($event)">
          @for (option of users.assignableRoles(); track option.value) {
            <mat-option [value]="option.value">{{ option.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class="active-box span-2">
        <mat-checkbox formControlName="is_active">
          <strong>Active</strong>
          <span class="active-box__hint">User will be active and can access the system</span>
        </mat-checkbox>
      </div>

      <a form-secondary-actions mat-button routerLink="/users">Cancel</a>
    </app-form>
  `,
  styles: [
    `
      .span-2 {
        grid-column: 1 / -1;
      }
      .active-box {
        padding: var(--app-space-3) var(--app-space-4);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-md);
      }
      .active-box__hint {
        display: block;
        font-size: 0.8rem;
        font-weight: 400;
        color: var(--app-status-default-fg);
      }
    `,
  ],
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly users = inject(UserService);
  protected readonly auth = inject(AuthService);

  protected readonly userId = signal<number | null>(null);
  protected readonly mode = computed<'create' | 'edit'>(() => (this.userId() ? 'edit' : 'create'));
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hidePassword = signal(true);

  protected readonly selectedRole = signal<UserRole | ''>('');
  protected readonly selectedManagerId = signal<number | null>(null);
  protected readonly managers = signal<ManagedUser[]>([]);
  protected readonly relationshipManagers = signal<ManagedUser[]>([]);

  protected readonly showManagerPicker = computed(
    () => this.auth.hasRole('super_admin') &&
      (this.selectedRole() === 'relationship_manager' || this.selectedRole() === 'employee'),
  );

  protected readonly showRmPicker = computed(
    () =>
      (this.auth.hasRole('super_admin') || this.auth.hasRole('manager')) &&
      this.selectedRole() === 'employee',
  );

  /**
   * A Relationship Manager's department is chosen explicitly (one Manager
   * runs Personal Loan, Home Loan and Mortgage Loan at once, split across
   * separate RMs); Employees inherit theirs from their RM. Telecallers
   * choose theirs explicitly too, same as an RM.
   */
  protected readonly showDepartmentPicker = computed(
    () => this.selectedRole() === 'relationship_manager' || this.selectedRole() === 'telecaller',
  );

  protected readonly departmentOptions = (Object.entries(DEPARTMENT_LABELS) as [Department, string][]).map(
    ([value, label]) => ({ value, label }),
  );

  protected readonly filteredRelationshipManagers = computed(() => {
    if (!this.auth.hasRole('super_admin')) {
      return this.relationshipManagers();
    }
    const managerId = this.selectedManagerId();
    return managerId
      ? this.relationshipManagers().filter((rm) => rm.manager_id === managerId)
      : [];
  });

  protected readonly rmHint = computed(() =>
    this.auth.hasRole('super_admin') && !this.selectedManagerId()
      ? 'Choose a manager first.'
      : 'No relationship managers found.',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    password: [''],
    phone: [''],
    role: this.fb.nonNullable.control<UserRole | ''>('', Validators.required),
    is_active: [true],
    manager_id: this.fb.control<number | null>(null),
    relationship_manager_id: this.fb.control<number | null>(null),
    department: this.fb.control<Department | null>(null),
  });

  ngOnInit(): void {
    // Hydrates users.assignableRoles() for the role <select>.
    this.users.list({ perPage: 1 }).subscribe({ error: () => undefined });

    if (this.auth.hasRole('super_admin')) {
      this.users
        .list({ role: 'manager', perPage: 200 })
        .subscribe({ next: (managers) => this.managers.set(managers), error: () => undefined });
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.controls.password.updateValueAndValidity();
      return;
    }

    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();

    const id = Number(idParam);
    this.userId.set(id);
    this.loading.set(true);

    this.users.get(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          role: user.role,
          is_active: user.is_active,
          manager_id: user.manager_id,
          relationship_manager_id: user.relationship_manager_id,
          department: user.department,
        });
        this.selectedRole.set(user.role);
        this.selectedManagerId.set(user.manager_id);
        this.loadRelationshipManagersIfNeeded(user.role);
        this.syncDepartmentValidator(user.role);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This user could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  protected onRoleChange(event: MatSelectChange): void {
    const role = event.value as UserRole;
    this.selectedRole.set(role);
    this.loadRelationshipManagersIfNeeded(role);
    this.syncDepartmentValidator(role);
  }

  private syncDepartmentValidator(role: UserRole): void {
    if (role === 'relationship_manager' || role === 'telecaller') {
      this.form.controls.department.setValidators([Validators.required]);
    } else {
      this.form.controls.department.clearValidators();
      this.form.controls.department.setValue(null);
    }
    this.form.controls.department.updateValueAndValidity();
  }

  protected onManagerChange(event: MatSelectChange): void {
    this.selectedManagerId.set(event.value as number);
    this.form.controls.relationship_manager_id.setValue(null);
  }

  private loadRelationshipManagersIfNeeded(role: UserRole): void {
    const needsRms =
      role === 'employee' && (this.auth.hasRole('super_admin') || this.auth.hasRole('manager'));

    if (!needsRms || this.relationshipManagers().length > 0) {
      return;
    }

    this.users
      .list({ role: 'relationship_manager', perPage: 200 })
      .subscribe({ next: (rms) => this.relationshipManagers.set(rms), error: () => undefined });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const id = this.userId();
    const payload = this.buildPayload();
    const request = id
      ? this.users.update(id, payload as UpdateUserPayload)
      : this.users.create(payload as CreateUserPayload);

    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        void this.router.navigate(['/users', user.id]);
      },
      error: (err: NormalizedApiError) => {
        this.saving.set(false);
        this.error.set(err.message ?? 'The user could not be saved. Check the fields and retry.');
      },
    });
  }

  private buildPayload(): CreateUserPayload | UpdateUserPayload {
    const raw = this.form.getRawValue();
    const actor = this.auth.user();
    const actorRole = actor?.role;

    let managerId: number | null = null;
    let relationshipManagerId: number | null = null;

    if (raw.role === 'connector' || raw.role === 'banker' || raw.role === 'telecaller' || raw.role === 'manager') {
      // Connectors, Bankers and Telecallers sit outside the hierarchy; Managers are auto-assigned by the backend.
      managerId = null;
      relationshipManagerId = null;
    } else if (actorRole === 'relationship_manager') {
      managerId = actor?.manager_id ?? null;
      relationshipManagerId = actor?.id ?? null;
    } else if (actorRole === 'manager') {
      managerId = actor?.id ?? null;
      relationshipManagerId = raw.role === 'employee' ? raw.relationship_manager_id : null;
    } else if (actorRole === 'super_admin') {
      managerId = raw.role === 'relationship_manager' || raw.role === 'employee' ? raw.manager_id : null;
      relationshipManagerId = raw.role === 'employee' ? raw.relationship_manager_id : null;
    }

    const payload: Record<string, unknown> = {
      name: raw.name,
      email: raw.email,
      phone: raw.phone || null,
      role: raw.role,
      is_active: raw.is_active,
      manager_id: managerId,
      relationship_manager_id: relationshipManagerId,
    };

    if (raw.role === 'relationship_manager' || raw.role === 'telecaller') {
      // Manager has no department of its own; Employee inherits its RM's on the backend.
      payload['department'] = raw.department;
    }

    if (raw.password) {
      payload['password'] = raw.password;
    }

    return payload as CreateUserPayload | UpdateUserPayload;
  }
}
