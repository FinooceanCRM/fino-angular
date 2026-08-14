import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { NotificationService } from '@core/services/notification.service';

/** Topbar bell linking to the existing /notifications route, badged with the unread count. */
@Component({
  selector: 'app-notification-icon',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      mat-icon-button
      routerLink="/notifications"
      matTooltip="Notifications"
      [attr.aria-label]="'Notifications, ' + notifications.unreadCount() + ' unread'"
    >
      @if (notifications.unreadCount() > 0) {
        <mat-icon [matBadge]="notifications.unreadCount()" matBadgeColor="warn" matBadgeSize="small">
          notifications
        </mat-icon>
      } @else {
        <mat-icon>notifications</mat-icon>
      }
    </a>
  `,
})
export class NotificationIconComponent {
  protected readonly notifications = inject(NotificationService);

  constructor() {
    // Hydrates the unread badge; NotificationService only tracks the count once list() runs.
    this.notifications.list().subscribe({ error: () => undefined });
  }
}
