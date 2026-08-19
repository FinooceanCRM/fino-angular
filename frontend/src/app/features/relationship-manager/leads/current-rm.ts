import { inject } from '@angular/core';

import { AuthService } from '@core/services/auth.service';

/**
 * The signed-in Relationship Manager's own id, read from the real
 * authenticated session. Must be called from a component's own injection
 * context (a field initializer or constructor), same as any other
 * `inject()` call.
 */
export function currentRmId(): number | null {
  return inject(AuthService).user()?.id ?? null;
}
