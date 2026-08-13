import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

export const notificationsRoutes: Routes = [
  {
    path: '',
    title: 'Notifications — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notifications.component').then((m) => m.NotificationsComponent),
  },
];
