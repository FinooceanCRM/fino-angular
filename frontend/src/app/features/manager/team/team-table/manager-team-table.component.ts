import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { DEPARTMENT_LABELS, Department, UserRole } from '@core/models/user.model';

import { UserFormModalComponent, UserFormModalResult } from '@features/super-admin/users/user-form-modal/user-form-modal.component';

import { ManagerTeamDataProvider, TeamMember } from '../data/manager-team-data.provider';
import {
  ManagerTeamAssignDialogComponent,
  ManagerTeamAssignDialogResult,
} from '../team-assign-dialog/manager-team-assign-dialog.component';

const DEPARTMENT_OPTIONS = (Object.entries(DEPARTMENT_LABELS) as [Department, string][]).map(
  ([value, label]) => ({ value, label }),
);

/**
 * Directory tab shared by Employee Management and Relationship Manager
 * Management — search, status filter, pagination, and create/edit/view/
 * activate actions. Reuses Super Admin's `UserFormModalComponent` and
 * `ConfirmDialogComponent` directly; reads and writes through the real
 * `ManagerTeamDataProvider` (`ManagerService` / `UserService`), so a
 * create/edit/reassign here hits the real backend immediately.
 */
@Component({
  selector: 'app-manager-team-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './manager-team-table.component.html',
  styleUrl: './manager-team-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTeamTableComponent {
  readonly role = input.required<UserRole>();

  protected readonly team = inject(ManagerTeamDataProvider);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isEmployee = computed(() => this.role() === 'employee');
  protected readonly roleLabel = computed(() => this.team.roleLabel(this.role()));
  protected readonly detailBase = computed(() =>
    this.role() === 'employee' ? '/manager/employees' : '/manager/relationship-managers',
  );

  protected readonly rows = computed<TeamMember[]>(() =>
    this.isEmployee() ? this.team.employees() : this.team.relationshipManagers(),
  );

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    status: '',
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly filteredRows = computed(() => {
    const search = (this.filterValues().search ?? '').trim().toLowerCase();
    const status = this.filterValues().status ?? '';

    return this.rows().filter((row) => {
      const matchesSearch =
        !search || row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search);
      const matchesStatus = !status || (status === 'active' ? row.is_active : !row.is_active);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected readonly columns = computed<TableColumn<TeamMember>[]>(() => [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', formatter: (row) => row.phone ?? '—' },
    this.isEmployee()
      ? { key: 'rm', label: 'Relationship Manager' }
      : { key: 'employees', label: 'Employees' },
    { key: 'status', label: 'Status' },
  ]);

  protected rmName(employee: TeamMember): string {
    const rm = employee.relationship_manager_id ? this.team.getById(employee.relationship_manager_id) : undefined;
    return rm?.name ?? '—';
  }

  protected employeeCount(rm: TeamMember): number {
    return this.team.employeesFor(rm.id).length;
  }

  protected applyFilters(): void {
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  protected openCreate(): void {
    if (this.isEmployee() && this.team.relationshipManagers().length === 0) {
      this.snackBar.open('Create a Relationship Manager before adding employees.', 'Dismiss', { duration: 4000 });
      return;
    }

    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: {
          mode: 'create',
          roleLabel: this.roleLabel(),
          departmentOptions: this.isEmployee() ? undefined : DEPARTMENT_OPTIONS,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result || !result.password) {
          return;
        }

        const payload = {
          name: result.name,
          email: result.email,
          password: result.password,
          phone: result.phone,
          is_active: result.is_active,
        };

        if (this.isEmployee()) {
          const defaultRm = this.team.relationshipManagers()[0];
          this.team.createEmployee(payload, defaultRm.id);
          this.snackBar.open(`${result.name} was added, reporting to ${defaultRm.name}.`, 'Dismiss', {
            duration: 4000,
          });
        } else {
          this.team.createRelationshipManager({ ...payload, department: (result.department ?? 'personal_loan') as Department });
          this.snackBar.open(`${result.name} was added to your team.`, 'Dismiss', { duration: 4000 });
        }
      });
  }

  protected openEdit(row: TeamMember): void {
    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: { mode: 'edit', roleLabel: this.roleLabel(), user: row },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.team.updateUser(row.id, {
          name: result.name,
          email: result.email,
          phone: result.phone,
          is_active: result.is_active,
        });

        this.snackBar.open(`${result.name} was updated.`, 'Dismiss', { duration: 4000 });
      });
  }

  protected toggleActive(row: TeamMember): void {
    const activating = !row.is_active;

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: activating ? 'Activate' : 'Deactivate',
          message: activating
            ? `Activate ${row.name}? They will regain access immediately.`
            : `Deactivate ${row.name}? They will lose access until reactivated.`,
          confirmLabel: activating ? 'Activate' : 'Deactivate',
          danger: !activating,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.team.setActive(row.id, activating);
        this.snackBar.open(`${row.name} was ${activating ? 'activated' : 'deactivated'}.`, 'Dismiss', {
          duration: 4000,
        });
      });
  }

  protected reassign(row: TeamMember): void {
    this.dialog
      .open<ManagerTeamAssignDialogComponent, unknown, ManagerTeamAssignDialogResult>(ManagerTeamAssignDialogComponent, {
        data: {
          employeeName: row.name,
          relationshipManagers: this.team.relationshipManagers(),
          currentRmId: row.relationship_manager_id,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.team.reassignEmployee(row.id, result.relationshipManagerId, result.remarks);
        const rm = this.team.getById(result.relationshipManagerId);
        this.snackBar.open(`${row.name} reassigned to ${rm?.name ?? 'the new Relationship Manager'}.`, 'Dismiss', {
          duration: 4000,
        });
      });
  }
}
