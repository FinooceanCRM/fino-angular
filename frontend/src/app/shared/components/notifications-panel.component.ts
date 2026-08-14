import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { AppNotification } from '@core/models/notification.model';
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
    MatListModule,
    RouterLink,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="notifications-panel">
      <mat-card-header>
        <mat-card-title>Notifications</mat-card-title>
        @if (notifications.unreadCount() > 0) {
          <mat-card-subtitle>{{ notifications.unreadCount() }} unread</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <app-loading mode="bar" />
        } @else if (items().length === 0) {
          <app-empty-state icon="notifications_none" message="You're all caught up." />
        } @else {
          <mat-list>
            @for (item of items(); track item.id) {
              <mat-list-item>
                <span matListItemTitle>
                  {{ item.title }}
                  @if (!item.is_read) {
                    <strong> · new</strong>
                  }
                </span>
                <span matListItemLine>{{ item.created_at | date: 'short' }}</span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
      <mat-card-actions align="end">
        <a mat-button routerLink="/notifications">View all</a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class NotificationsPanelComponent implements OnInit {
  protected readonly notifications = inject(NotificationService);

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
