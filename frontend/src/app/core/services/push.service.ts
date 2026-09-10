import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PushNotifications } from '@capacitor/push-notifications';

import { ApiService } from './api.service';
import { PlatformService } from './platform.service';

/**
 * Native push notifications (FCM via `@capacitor/push-notifications`).
 *
 * Web is a no-op — the web app already polls `GET /notifications`. On native
 * this asks for permission, registers the device token with the API after
 * login, removes it on logout, and routes to the relevant screen when the
 * user taps a delivered notification.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly platform = inject(PlatformService);
  private readonly api = inject(ApiService);
  // Optional so this service can be constructed in unit tests that don't
  // set up the router; it is only used on a native notification tap.
  private readonly router = inject(Router, { optional: true });

  private token: string | null = null;
  private wired = false;

  /** Call after a successful login (and on app start if already signed in). */
  async register(): Promise<void> {
    if (!this.platform.isNative) {
      return;
    }

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') {
      return;
    }

    if (!this.wired) {
      this.wired = true;

      await PushNotifications.addListener('registration', (token) => {
        this.token = token.value;
        this.api
          .post('me/device-tokens', { token: token.value, platform: this.platform.platform })
          .subscribe({ error: () => undefined });
      });

      await PushNotifications.addListener('registrationError', () => {
        // Nothing actionable client-side; the app still works via polling.
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        this.routeFromData((notification.data ?? {}) as Record<string, unknown>);
      });
    }

    await PushNotifications.register();
  }

  /** Call on logout so this device stops receiving the user's notifications. */
  async unregister(): Promise<void> {
    if (!this.platform.isNative || !this.token) {
      return;
    }
    const token = this.token;
    this.token = null;
    this.api
      .delete(`me/device-tokens?token=${encodeURIComponent(token)}`)
      .subscribe({ error: () => undefined });
  }

  private routeFromData(data: Record<string, unknown>): void {
    const link = typeof data['link'] === 'string' ? data['link'] : null;
    void this.router?.navigateByUrl(link ?? '/notifications');
  }
}
