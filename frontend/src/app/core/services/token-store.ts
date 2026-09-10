import { Preferences } from '@capacitor/preferences';

import { PlatformService } from './platform.service';

/**
 * Async key/value persistence for the auth session. Two backends:
 *
 * - Web: `localStorage` (unchanged from the original SessionService).
 * - Native: Capacitor Preferences, which maps to the iOS Keychain-backed
 *   `UserDefaults` / Android `SharedPreferences` — survives app restarts
 *   and is not readable by other apps.
 *
 * `SessionService` keeps a synchronous in-memory cache on top of this so
 * that the HTTP interceptor and route guards can still read the token
 * synchronously; this interface is only touched on hydrate and on write.
 */
export interface TokenStore {
  getAll(keys: string[]): Promise<Record<string, string | null>>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

class WebTokenStore implements TokenStore {
  private get storage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      // Access itself can throw (Safari private mode, disabled site data).
      return null;
    }
  }

  async getAll(keys: string[]): Promise<Record<string, string | null>> {
    const store = this.storage;
    const out: Record<string, string | null> = {};
    for (const key of keys) {
      out[key] = store?.getItem(key) ?? null;
    }
    return out;
  }

  async set(key: string, value: string): Promise<void> {
    this.storage?.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage?.removeItem(key);
  }
}

class NativeTokenStore implements TokenStore {
  async getAll(keys: string[]): Promise<Record<string, string | null>> {
    const entries = await Promise.all(
      keys.map(async (key) => [key, (await Preferences.get({ key })).value] as const),
    );
    return Object.fromEntries(entries);
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}

export function createTokenStore(platform: PlatformService): TokenStore {
  return platform.isNative ? new NativeTokenStore() : new WebTokenStore();
}
