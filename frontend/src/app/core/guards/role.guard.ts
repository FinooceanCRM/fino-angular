import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';

/**
 * Usage: { canActivate: [authGuard, roleGuard], data: { roles: ['super_admin'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const roles = (route.data?.['roles'] as UserRole[] | undefined) ?? [];

  if (roles.length === 0 || auth.hasRole(...roles)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
