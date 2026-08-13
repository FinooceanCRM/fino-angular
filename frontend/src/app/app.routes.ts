import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/dashboard/dashboard.routes').then(
        (m) => m.dashboardRoutes,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/components/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
