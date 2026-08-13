import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

export const documentsRoutes: Routes = [
  {
    path: '',
    title: 'Documents — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./documents.component').then((m) => m.DocumentsComponent),
  },
];
