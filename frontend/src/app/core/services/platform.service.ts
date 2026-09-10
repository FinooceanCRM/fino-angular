import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Single source of truth for "where is this code running". Feature code
 * that forks between the browser and the native Capacitor shell (secure
 * storage, camera, downloads, push) depends on this rather than reaching
 * for `Capacitor` directly, so the fork points are greppable and easy to
 * stub in tests.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  /** Running inside the Capacitor native WebView (iOS or Android). */
  readonly isNative = Capacitor.isNativePlatform();

  /** 'ios' | 'android' | 'web' */
  readonly platform = Capacitor.getPlatform();

  readonly isIOS = this.platform === 'ios';
  readonly isAndroid = this.platform === 'android';
  readonly isWeb = !this.isNative;

  /** True when a Capacitor plugin is actually available to call. */
  isPluginAvailable(name: string): boolean {
    return Capacitor.isPluginAvailable(name);
  }
}
