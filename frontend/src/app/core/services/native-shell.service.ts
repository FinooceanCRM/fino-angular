import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { PlatformService } from './platform.service';

/**
 * One-time native chrome wiring: status bar styling, splash-screen
 * dismissal, the Android hardware back button, and keyboard resize
 * behaviour. A no-op on the web build. Called from an app initializer in
 * app.config.ts so it runs once, after the router exists.
 */
@Injectable({ providedIn: 'root' })
export class NativeShellService {
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  async init(): Promise<void> {
    if (!this.platform.isNative) {
      return;
    }

    // Navy chrome to match the app topbar. `Style.Light` = light icons on
    // a dark bar (Capacitor's naming is the content style, not the bar).
    try {
      await StatusBar.setStyle({ style: Style.Light });
      if (this.platform.isAndroid) {
        await StatusBar.setBackgroundColor({ color: '#0a2a43' });
      }
    } catch {
      /* status bar plugin unavailable on this device / OS version */
    }

    if (this.platform.isAndroid) {
      Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => undefined);
    }

    // Hardware back: navigate within the app history; if there is nowhere
    // to go back to, let the OS background the app.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack || this.canGoBackInApp()) {
        this.location.back();
      } else {
        App.exitApp();
      }
    });

    await SplashScreen.hide();
  }

  private canGoBackInApp(): boolean {
    // Router keeps no public history length; treat anything other than the
    // known landing routes as "has a back target".
    const url = this.router.url.split('?')[0];
    return url !== '/' && url !== '/dashboard' && url !== '/auth/login';
  }
}
