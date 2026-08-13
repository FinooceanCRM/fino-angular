import { Injectable } from '@angular/core';

import { AuthenticatedUser } from '@core/models/user.model';

const TOKEN_KEY = 'finoocean.token';
const USER_KEY = 'finoocean.user';

/**
 * Persists the auth session in localStorage so a page reload keeps the user
 * signed in until the token is revoked server-side.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  get token(): string | null {
    return this.storage?.getItem(TOKEN_KEY) ?? null;
  }

  get user(): AuthenticatedUser | null {
    const raw = this.storage?.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      this.clear();
      return null;
    }
  }

  persist(token: string, user: AuthenticatedUser): void {
    this.storage?.setItem(TOKEN_KEY, token);
    this.storage?.setItem(USER_KEY, JSON.stringify(user));
  }

  persistUser(user: AuthenticatedUser): void {
    this.storage?.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    this.storage?.removeItem(TOKEN_KEY);
    this.storage?.removeItem(USER_KEY);
  }
}
