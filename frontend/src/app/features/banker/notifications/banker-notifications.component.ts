import { ChangeDetectionStrategy, Component } from '@angular/core';

import { NotificationsComponent } from '@features/notifications/notifications.component';

/**
 * Notifications, Banker-scoped route. Reuses the shared, real
 * `NotificationsComponent` unmodified — same `NotificationService`, same
 * All/Unread/Leads/Documents/System tabs. Existing purely for a guarded
 * route in the Banker workspace; no mock data involved.
 */
@Component({
  selector: 'app-banker-notifications',
  standalone: true,
  imports: [NotificationsComponent],
  template: `<app-notifications />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankerNotificationsComponent {}
