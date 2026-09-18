import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';

/** Shared bank-criteria view. Banker writes use the banker-scoped route. */
export const banksRoutes: Routes = [
  {
    path: '',
    title: 'Banks — FINOOCEAN',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./list/bank-list.component').then((m) => m.BankListComponent),
  },
];
