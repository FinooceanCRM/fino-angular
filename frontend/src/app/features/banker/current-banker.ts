import { inject } from '@angular/core';

import { AuthService } from '@core/services/auth.service';

/**
 * The signed-in Banker's own id and name, read from the real authenticated
 * session. Must be called from a component's own injection context (a field
 * initializer or constructor), same as any other `inject()` call.
 */
export function currentBankerId(): number | null {
  return inject(AuthService).user()?.id ?? null;
}

export function currentBankerName(): string {
  return inject(AuthService).user()?.name ?? 'Banker';
}
