import { Injectable, inject } from '@angular/core';

import { AuthenticatedUser } from '@core/models/user.model';

import { PlatformService } from './platform.service';
import { TokenStore, createTokenStore } from './token-store';

const TOKEN_KEY = 'finoocean.token';
const USER_KEY = 'finoocean.user';

/**
 * Persists the auth session so a reload (web) or app restart (native)
 * keeps the user signed in until the token is revoked server-side.
 *
 * Storage is delegated to a {@link TokenStore} (localStorage on web,
 * Capacitor Preferences on native). Because that backend is async but the
 * HTTP interceptor and route guards read the token synchronously, this
 * service keeps a synchronous in-memory cache: it is primed synchronously
 * from localStorage on web at construction, and authoritatively refreshed
 * by {@link hydrate} (awaited from an app initializer) before the first
 * navigation runs — which is the only path that populates it on native.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly store: TokenStore = createTokenStore(inject(PlatformService));

  private tokenCache: string | null = null;
  private userCache: string | null = null;
  private hydrated?: Promise<void>;

  constructor() {
    // Best-effort synchronous prime for the web path so existing
    // synchronous callers work before hydrate() resolves. Harmless on
    // native (localStorage is absent there); hydrate() is authoritative.
    try {
      if (typeof localStorage !== 'undefined') {
        this.tokenCache = localStorage.getItem(TOKEN_KEY);
        this.userCache = localStorage.getItem(USER_KEY);
      }
    } catch {
      /* private mode / disabled site data */
    }
  }

  /** Loads the persisted session into the synchronous cache. Idempotent. */
  hydrate(): Promise<void> {
    return (this.hydrated ??= this.store.getAll([TOKEN_KEY, USER_KEY]).then((values) => {
      this.tokenCache = values[TOKEN_KEY];
      this.userCache = values[USER_KEY];
    }));
  }

  get token(): string | null {
    return this.tokenCache;
  }

  get user(): AuthenticatedUser | null {
    if (!this.userCache) {
      return null;
    }

    try {
      return JSON.parse(this.userCache) as AuthenticatedUser;
    } catch {
      this.clear();
      return null;
    }
  }

  persist(token: string, user: AuthenticatedUser): void {
    this.tokenCache = token;
    void this.store.set(TOKEN_KEY, token);
    this.persistUser(user);
  }

  persistUser(user: AuthenticatedUser): void {
    this.userCache = JSON.stringify(user);
    void this.store.set(USER_KEY, this.userCache);
  }

  clear(): void {
    this.tokenCache = null;
    this.userCache = null;
    void this.store.remove(TOKEN_KEY);
    void this.store.remove(USER_KEY);
  }
}
