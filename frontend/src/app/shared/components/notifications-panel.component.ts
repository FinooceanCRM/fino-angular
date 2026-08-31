import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AppNotification, notificationIcon } from '@core/models/notification.model';
import { NotificationService } from '@core/services/notification.service';

import { EmptyStateComponent } from './empty-state.component';
import { LoadingComponent } from './loading.component';

/**
 * Compact notifications panel for dashboards. Backed by the existing
 * NotificationService (same data as the full /notifications page), trimmed
 * to the most recent entries.
 */
@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterLink,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="notifications-panel">
      <mat-card-header>
        <mat-card-title>Notifications</mat-card-title>
        <a mat-button routerLink="/notifications" class="notifications-panel__view-all">View all</a>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <app-loading mode="bar" />
        } @else if (items().length === 0) {
          <app-empty-state icon="notifications_none" message="You're all caught up." />
        } @else {
          <ul class="notifications-panel__list">
            @for (item of items(); track item.id) {
              <li class="notifications-panel__item" [class.notifications-panel__item--unread]="!item.is_read">
                <span class="notifications-panel__icon">
                  <mat-icon>{{ notificationIcon(item.type) }}</mat-icon>
                </span>
                <span class="notifications-panel__body">
                  <span class="notifications-panel__title">{{ item.title }}</span>
                  @if (item.body) {
                    <span class="notifications-panel__subtitle">{{ item.body }}</span>
                  }
                </span>
                <span class="notifications-panel__meta">
                  <span class="notifications-panel__time">{{ item.created_at | date: 'short' }}</span>
                  @if (!item.is_read) {
                    <span class="notifications-panel__dot"></span>
                  }
                </span>
              </li>
            }
          </ul>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .notifications-panel mat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .notifications-panel__view-all {
        margin-left: auto;
      }
      .notifications-panel__list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .notifications-panel__item {
        display: flex;
        align-items: flex-start;
        gap: var(--app-space-3);
        padding: var(--app-space-2) var(--app-space-2);
        border-radius: var(--app-radius-md);
      }
      .notifications-panel__item--unread {
        background: var(--mat-sys-primary-container);
      }
      .notifications-panel__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-tertiary);

        mat-icon {
          font-size: 1.15rem;
          width: 1.15rem;
          height: 1.15rem;
        }
      }
      .notifications-panel__item--unread .notifications-panel__icon {
        background: var(--tide-color-surface);
      }
      .notifications-panel__body {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1 1 auto;
      }
      .notifications-panel__title {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .notifications-panel__subtitle {
        font-size: 0.8rem;
        color: var(--app-status-default-fg);
      }
      .notifications-panel__meta {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        flex-shrink: 0;
      }
      .notifications-panel__time {
        font-size: 0.75rem;
        color: var(--app-status-default-fg);
        white-space: nowrap;
      }
      .notifications-panel__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--mat-sys-primary);
      }
    `,
  ],
})
export class NotificationsPanelComponent implements OnInit {
  protected readonly notifications = inject(NotificationService);
  protected readonly notificationIcon = notificationIcon;

  readonly limit = input(5);

  protected readonly items = signal<AppNotification[]>([]);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.notifications.list().subscribe({
      next: (items) => {
        this.items.set(items.slice(0, this.limit()));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
