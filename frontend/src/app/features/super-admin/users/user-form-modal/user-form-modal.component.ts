import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

export interface UserFormModalData {
  mode: 'create' | 'edit';
  roleLabel: string;
  user?: { name: string; email: string; phone: string | null; is_active: boolean };
  /**
   * When set, an additional required Department picker is shown (used when
   * creating a Relationship Manager, whose department the backend requires
   * at creation — see `StoreRelationshipManagerRequest`). Omitted entirely
   * for roles with no department of their own (e.g. Employee, who inherits
   * one from their Relationship Manager).
   */
  departmentOptions?: { value: string; label: string }[];
}

export interface UserFormModalResult {
  name: string;
  email: string;
  phone: string | null;
  password?: string;
  is_active: boolean;
  department?: string;
}

/**
 * Create/edit dialog shared by every Super Admin user-management page.
 * Resolves `afterClosed()` with the submitted values, or `undefined` if
 * cancelled — the caller decides how to fold that into its local rows.
 */
@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ModalComponent,
  ],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormModalComponent {
  protected readonly data = inject<UserFormModalData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<UserFormModalComponent, UserFormModalResult>);

  private readonly fb = inject(FormBuilder);

  protected readonly hidePassword = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.user?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(180)]],
    phone: [this.data.user?.phone ?? ''],
    password: [
      '',
      this.data.mode === 'create' ? [Validators.required, Validators.minLength(8)] : [Validators.minLength(8)],
    ],
    is_active: [this.data.user?.is_active ?? true],
    department: [
      '',
      this.data.departmentOptions ? [Validators.required] : [],
    ],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: UserFormModalResult = {
      name: raw.name,
      email: raw.email,
      phone: raw.phone || null,
      is_active: raw.is_active,
    };

    if (raw.password) {
      result.password = raw.password;
    }

    if (this.data.departmentOptions) {
      result.department = raw.department;
    }

    this.dialogRef.close(result);
  }
}
