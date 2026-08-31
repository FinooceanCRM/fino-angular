import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { ManagedUser, UserRole } from '@core/models/user.model';
import { UserService } from '@core/services/user.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { UserFormModalComponent, UserFormModalResult } from '../user-form-modal/user-form-modal.component';
import { UserViewModalComponent } from '../user-view-modal/user-view-modal.component';

/**
 * Reusable list page for one role bucket (Managers, Relationship Managers,
 * Employees, Connectors, Bankers). Backed by the real `GET/POST/PUT users`
 * API via `UserService` — a create/edit/deactivate here is visible
 * everywhere else that reads the same backend.
 */
@Component({
  selector: 'app-super-admin-user-role-table',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './user-role-table.component.html',
  styleUrl: './user-role-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRoleTableComponent {
  readonly role = input.required<UserRole>();
  readonly roleLabel = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input('');

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly users = inject(UserService);
  private readonly route = inject(ActivatedRoute);

  protected readonly rows = signal<ManagedUser[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);

  private pendingRequest?: Subscription;

  /** Seeded from `?search=` so quick navigation from Global Search lands pre-filtered. */
  protected readonly filters = this.fb.nonNullable.group({
    search: this.route.snapshot.queryParamMap.get('search') ?? '',
    status: '',
  });

  /**
   * `computed()` only re-runs when a *signal* dependency changes — a
   * FormControl's `.value` is a plain mutable property, not a signal, so a
   * computed reading it directly would freeze on its first (empty) value
   * and never actually filter. Bridging valueChanges through `toSignal`
   * makes the filter form genuinely reactive.
   */
  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly columns: TableColumn<ManagedUser>[] = [
    { key: 'name', label: 'User' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', formatter: (row) => row.phone ?? '—' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
    effect(() => {
      const f = this.filterValues();
      const page = this.pageIndex();
      const size = this.pageSize();
      this.load(f, page, size);
    });
  }

  private load(f: ReturnType<typeof this.filterValues>, page: number, size: number): void {
    this.pendingRequest?.unsubscribe();
    this.loading.set(true);
    const search = (f.search ?? '').trim();
    const isActive = f.status === 'active' ? true : f.status === 'inactive' ? false : undefined;

    this.pendingRequest = this.users
      .list({ role: this.role(), search: search || undefined, isActive, page: page + 1, perPage: size })
      .subscribe({
        next: (items) => {
          this.rows.set(items);
          this.total.set(this.users.meta().total ?? items.length);
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected applyFilters(): void {
    this.pageIndex.set(0);
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  private reload(): void {
    this.load(this.filterValues(), this.pageIndex(), this.pageSize());
  }

  /**
   * Public so a host page (e.g. SuperAdminBankersComponent) can trigger it
   * from an "Add {role}" button it projects into the shared
   * UserRoleTabsComponent page-header, via a template reference variable on
   * this component. Behavior is unchanged for the existing internal caller.
   */
  openCreate(): void {
    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: { mode: 'create', roleLabel: this.roleLabel() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.users
          .create({
            name: result.name,
            email: result.email,
            password: result.password ?? '',
            role: this.role(),
            phone: result.phone,
            is_active: result.is_active,
          })
          .subscribe({
            next: () => {
              this.snackBar.open(`${result.name} was added.`, 'Dismiss', { duration: 4000 });
              this.reload();
            },
            error: () => this.snackBar.open(`Could not create ${result.name}.`, 'Dismiss', { duration: 4000 }),
          });
      });
  }

  protected openEdit(row: ManagedUser): void {
    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: { mode: 'edit', roleLabel: this.roleLabel(), user: row },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.users
          .update(row.id, {
            name: result.name,
            email: result.email,
            phone: result.phone,
            is_active: result.is_active,
            ...(result.password ? { password: result.password } : {}),
          })
          .subscribe({
            next: () => {
              this.snackBar.open(`${result.name} was updated.`, 'Dismiss', { duration: 4000 });
              this.reload();
            },
            error: () => this.snackBar.open(`Could not update ${result.name}.`, 'Dismiss', { duration: 4000 }),
          });
      });
  }

  protected openView(row: ManagedUser): void {
    this.dialog
      .open<UserViewModalComponent, unknown, boolean>(UserViewModalComponent, { data: { user: row } })
      .afterClosed()
      .subscribe((wantsEdit) => {
        if (wantsEdit) {
          this.openEdit(row);
        }
      });
  }

  protected toggleActive(row: ManagedUser): void {
    const activating = !row.is_active;

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: activating ? 'Activate user' : 'Deactivate user',
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

        this.users.update(row.id, { is_active: activating }).subscribe({
          next: () => {
            this.snackBar.open(`${row.name} was ${activating ? 'activated' : 'deactivated'}.`, 'Dismiss', {
              duration: 4000,
            });
            this.reload();
          },
          error: () => this.snackBar.open(`Could not update ${row.name}.`, 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
