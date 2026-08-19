import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';

import { UserFormModalComponent, UserFormModalResult } from '@features/super-admin/users/user-form-modal/user-form-modal.component';

import { ManagerTeamDataProvider } from '../../team/data/manager-team.provider';
import {
  ManagerTeamAssignDialogComponent,
  ManagerTeamAssignDialogResult,
} from '../../team/team-assign-dialog/manager-team-assign-dialog.component';
import { ManagerTeamActivityComponent } from '../../team/team-activity/manager-team-activity.component';
import { ManagerTeamPerformanceCardsComponent } from '../../team/team-performance-cards/manager-team-performance-cards.component';

/** Employee "View page" — profile, hierarchy position, individual performance and activity. */
@Component({
  selector: 'app-manager-employee-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    ManagerTeamActivityComponent,
    ManagerTeamPerformanceCardsComponent,
  ],
  templateUrl: './manager-employee-detail.component.html',
  styleUrl: './manager-employee-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerEmployeeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly team = inject(ManagerTeamDataProvider);

  private readonly employeeId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly employee = computed(() => this.team.employees().find((row) => row.id === this.employeeId));

  protected readonly relationshipManager = computed(() => {
    const rmId = this.employee()?.relationship_manager_id;
    return rmId ? this.team.getById(rmId) : undefined;
  });

  protected editEmployee(): void {
    const row = this.employee();
    if (!row) {
      return;
    }

    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: { mode: 'edit', roleLabel: 'Employee', user: row },
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

  protected toggleActive(): void {
    const row = this.employee();
    if (!row) {
      return;
    }

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

  protected reassign(): void {
    const row = this.employee();
    if (!row) {
      return;
    }

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
