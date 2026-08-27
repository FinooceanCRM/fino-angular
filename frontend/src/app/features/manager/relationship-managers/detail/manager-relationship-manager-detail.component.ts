import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { EntityHeaderComponent } from '@shared/components/entity-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { UserFormModalComponent, UserFormModalResult } from '@features/super-admin/users/user-form-modal/user-form-modal.component';

import { ManagerTeamDataProvider } from '../../team/data/manager-team-data.provider';
import { ManagerTeamActivityComponent } from '../../team/team-activity/manager-team-activity.component';
import { ManagerTeamPerformanceCardsComponent } from '../../team/team-performance-cards/manager-team-performance-cards.component';

/** Relationship Manager "View page" — profile, their employee roster, individual performance and activity. */
@Component({
  selector: 'app-manager-relationship-manager-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    EmptyStateComponent,
    EntityHeaderComponent,
    StatusPillComponent,
    ManagerTeamActivityComponent,
    ManagerTeamPerformanceCardsComponent,
  ],
  templateUrl: './manager-relationship-manager-detail.component.html',
  styleUrl: './manager-relationship-manager-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerRelationshipManagerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly team = inject(ManagerTeamDataProvider);

  private readonly rmId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly rm = computed(() => this.team.relationshipManagers().find((row) => row.id === this.rmId));
  protected readonly teamMembers = computed(() => this.team.employeesFor(this.rmId));

  protected editRm(): void {
    const row = this.rm();
    if (!row) {
      return;
    }

    this.dialog
      .open<UserFormModalComponent, unknown, UserFormModalResult>(UserFormModalComponent, {
        data: { mode: 'edit', roleLabel: 'Relationship Manager', user: row },
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
    const row = this.rm();
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
}
