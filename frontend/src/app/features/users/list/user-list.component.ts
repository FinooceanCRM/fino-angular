import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
import { RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { ManagedUser, ROLE_LABELS, UserRole } from '@core/models/user.model';
import { UserService } from '@core/services/user.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

const FILTERABLE_ROLES: UserRole[] = [
  'super_admin',
  'manager',
  'relationship_manager',
  'employee',
  'connector',
  'banker',
];

@Component({
  selector: 'app-user-list',
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
    PageHeaderComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly users = inject(UserService);
  protected readonly auth = inject(AuthService);

  protected readonly roles = FILTERABLE_ROLES;
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly columns: TableColumn<ManagedUser>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role_label', label: 'Role' },
    { key: 'phone', label: 'Phone', formatter: (row) => row.phone ?? '—' },
    { key: 'status', label: 'Status' },
  ];

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    role: '',
    isActive: '',
  });

  private pageSize = 15;

  ngOnInit(): void {
    this.load(0);
  }

  load(pageIndex: number): void {
    const raw = this.filters.getRawValue();

    this.users
      .list({
        search: raw.search || undefined,
        role: (raw.role || undefined) as UserRole | undefined,
        isActive: raw.isActive === '' ? undefined : raw.isActive === '1',
        page: pageIndex + 1,
        perPage: this.pageSize,
      })
      .subscribe({ error: () => undefined });
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex);
  }

  confirmDelete(user: ManagedUser): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete user',
          message: `Delete ${user.name}? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.users.remove(user.id).subscribe({
          next: () => {
            this.snackBar.open(`${user.name} was deleted.`, 'Dismiss', { duration: 4000 });
            this.load(this.users.meta().current_page - 1);
          },
          error: () => {
            this.snackBar.open('That user could not be deleted.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
