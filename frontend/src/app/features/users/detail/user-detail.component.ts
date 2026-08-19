import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { ManagedUser } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { LoadingComponent } from '@shared/components/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    LoadingComponent,
    PageHeaderComponent,
    StatusPillComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="User details" />

    @if (loading()) {
      <app-loading />
    }

    @if (error(); as message) {
      <mat-card class="notice">
        <mat-card-content>{{ message }}</mat-card-content>
      </mat-card>
    }

    @if (user(); as target) {
      <mat-card class="profile-card">
        <span class="profile-card__avatar">{{ initials() }}</span>
        <h2 class="profile-card__name">{{ target.name }}</h2>
        <p class="profile-card__role">{{ target.role_label }}</p>
        <app-status-pill
          [label]="target.is_active ? 'Active' : 'Inactive'"
          [colour]="target.is_active ? 'success' : 'default'"
        />

        <div class="profile-card__fields">
          <div class="profile-card__field">
            <mat-icon>mail</mat-icon>
            <span class="profile-card__field-label">Email</span>
            <span class="profile-card__field-sep">:</span>
            <a class="profile-card__field-value profile-card__field-value--link" [href]="'mailto:' + target.email">
              {{ target.email }}
            </a>
          </div>
          <div class="profile-card__field">
            <mat-icon>call</mat-icon>
            <span class="profile-card__field-label">Phone</span>
            <span class="profile-card__field-sep">:</span>
            <span class="profile-card__field-value">{{ target.phone ?? '—' }}</span>
          </div>
          <div class="profile-card__field">
            <mat-icon>person</mat-icon>
            <span class="profile-card__field-label">Manager</span>
            <span class="profile-card__field-sep">:</span>
            <span class="profile-card__field-value">{{ manager()?.name ?? '—' }}</span>
          </div>
          <div class="profile-card__field">
            <mat-icon>support_agent</mat-icon>
            <span class="profile-card__field-label">Relationship Manager</span>
            <span class="profile-card__field-sep">:</span>
            <span class="profile-card__field-value">{{ relationshipManager()?.name ?? '—' }}</span>
          </div>
          <div class="profile-card__field">
            <mat-icon>event</mat-icon>
            <span class="profile-card__field-label">Created Date</span>
            <span class="profile-card__field-sep">:</span>
            <span class="profile-card__field-value">
              {{ target.created_at ? (target.created_at | date: 'medium') : '—' }}
            </span>
          </div>
        </div>

        <div class="profile-card__actions">
          @if (auth.can('users.update')) {
            <a mat-flat-button color="primary" [routerLink]="['/users', target.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </a>
          }
          @if (auth.can('users.delete') && target.id !== auth.user()?.id) {
            <button mat-flat-button color="warn" type="button" (click)="confirmDelete(target)">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          }
        </div>
      </mat-card>

      <a class="profile-card__back" routerLink="/users">
        <mat-icon>arrow_back</mat-icon>
        Back to Users
      </a>
    }
  `,
  styles: [
    `
      .notice {
        margin-top: 1rem;
      }
      .profile-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        margin: var(--app-space-5) auto 0;
        padding: var(--app-space-6) var(--app-space-5);
        border-radius: var(--app-radius-lg);
        text-align: center;
      }
      .profile-card__avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        font-size: 1.75rem;
        font-weight: 700;
      }
      .profile-card__name {
        margin: var(--app-space-4) 0 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .profile-card__role {
        margin: var(--app-space-1) 0 var(--app-space-3);
        color: var(--app-status-default-fg);
      }
      .profile-card__fields {
        width: 100%;
        margin-top: var(--app-space-5);
        padding-top: var(--app-space-4);
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-direction: column;
        gap: var(--app-space-3);
      }
      .profile-card__field {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        text-align: left;

        mat-icon {
          color: var(--mat-sys-primary);
          flex-shrink: 0;
          font-size: 1.2rem;
          width: 1.2rem;
          height: 1.2rem;
        }
      }
      .profile-card__field-label {
        color: var(--app-status-default-fg);
        min-width: 168px;
      }
      .profile-card__field-sep {
        color: var(--app-status-default-fg);
      }
      .profile-card__field-value {
        font-weight: 500;
        overflow-wrap: anywhere;
      }
      .profile-card__field-value--link {
        color: var(--mat-sys-primary);
        text-decoration: none;
      }
      .profile-card__field-value--link:hover {
        text-decoration: underline;
      }
      .profile-card__actions {
        display: flex;
        gap: var(--app-space-3);
        margin-top: var(--app-space-5);
      }
      .profile-card__back {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--app-space-1);
        margin: var(--app-space-4) auto 0;
        width: fit-content;
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-weight: 500;

        mat-icon {
          font-size: 1.1rem;
          width: 1.1rem;
          height: 1.1rem;
        }
      }
      .profile-card__back:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly users = inject(UserService);

  protected readonly auth = inject(AuthService);

  protected readonly user = signal<ManagedUser | null>(null);
  protected readonly manager = signal<ManagedUser | null>(null);
  protected readonly relationshipManager = signal<ManagedUser | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly initials = computed(() => {
    const parts = (this.user()?.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);

    this.users.get(id).subscribe({
      next: (target) => {
        this.user.set(target);
        this.loading.set(false);

        forkJoin({
          manager: target.manager_id ? this.users.get(target.manager_id) : of(null),
          rm: target.relationship_manager_id
            ? this.users.get(target.relationship_manager_id)
            : of(null),
        }).subscribe({
          next: ({ manager, rm }) => {
            this.manager.set(manager);
            this.relationshipManager.set(rm);
          },
          // The actor may lack visibility into the manager/RM record itself
          // (e.g. an RM viewing their own manager's user record); degrade
          // to showing "—" for those fields rather than surfacing an error.
          error: () => undefined,
        });
      },
      error: () => {
        this.error.set('This user could not be loaded.');
        this.loading.set(false);
      },
    });
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
            void this.router.navigate(['/users']);
          },
          error: () => {
            this.snackBar.open('That user could not be deleted.', 'Dismiss', { duration: 4000 });
          },
        });
      });
  }
}
