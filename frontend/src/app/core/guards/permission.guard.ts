import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppPermission } from '@core/auth/permissions';
import { AuthService } from '@core/services/auth.service';

/**
 * Usage:
 * { canActivate: [authGuard, permissionGuard], data: { permissions: ['users.view'] } }
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required =
    (route.data?.['permissions'] as AppPermission[] | undefined) ?? [];

  if (required.length === 0 || required.every((p) => auth.can(p))) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
