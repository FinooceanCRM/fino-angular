import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/** Bank criteria management (Phase 9). Writes are Super Admin only (API-enforced). */
export const banksRoutes: Routes = [
  {
    path: '',
    title: 'Banks — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./list/bank-list.component').then((m) => m.BankListComponent),
  },
];
