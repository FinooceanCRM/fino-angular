import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

/**
 * Route guard placeholder. Phase 1 allows access; the real session check is
 * wired up with the authentication module.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const enforceAuthentication = false; // enabled in Phase 3

  if (!enforceAuthentication || auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
