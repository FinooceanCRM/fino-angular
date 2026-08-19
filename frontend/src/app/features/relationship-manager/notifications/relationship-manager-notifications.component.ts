import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerNotificationsComponent } from '@features/manager/notifications/manager-notifications.component';

/** Notifications — reuses `ManagerNotificationsComponent` as-is, which itself reuses Super Admin's shared `NotificationDataProvider`. */
@Component({
  selector: 'app-relationship-manager-notifications',
  standalone: true,
  imports: [ManagerNotificationsComponent],
  template: `<app-manager-notifications subtitle="Updates about your leads, employees and connectors." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerNotificationsComponent {}
