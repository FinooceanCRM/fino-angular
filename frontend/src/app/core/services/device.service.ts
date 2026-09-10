import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

import { PlatformService } from './platform.service';

export interface DevicePosition {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

/**
 * Camera and geolocation behind one interface, with browser fallbacks.
 *
 * Native (Capacitor): the Camera / Geolocation plugins — real OS permission
 * prompts, EXIF-corrected JPEGs, no WebView `<input>` quirks.
 * Web: `takePhoto()` returns `null` so the caller falls back to its own
 * `<input type="file">`; `getPosition()` uses `navigator.geolocation`.
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly platform = inject(PlatformService);

  /** Whether `takePhoto()` will do anything (i.e. the native camera is available). */
  get hasNativeCamera(): boolean {
    return this.platform.isNative;
  }

  /**
   * Capture a photo with the native camera / picker. Returns a `File`
   * ready to feed into an existing upload pipeline, or `null` on the web —
   * the caller should then trigger its `<input type="file">` instead.
   */
  async takePhoto(
    opts: { source?: 'camera' | 'photos' | 'prompt'; quality?: number } = {},
  ): Promise<File | null> {
    if (!this.platform.isNative) {
      return null;
    }

    const source =
      opts.source === 'camera'
        ? CameraSource.Camera
        : opts.source === 'photos'
          ? CameraSource.Photos
          : CameraSource.Prompt;

    const photo = await Camera.getPhoto({
      quality: opts.quality ?? 90,
      resultType: CameraResultType.Uri,
      correctOrientation: true,
      source,
    });

    if (!photo.webPath) {
      return null;
    }

    const blob = await (await fetch(photo.webPath)).blob();
    const format = (photo.format || 'jpeg').replace('jpg', 'jpeg');
    return new File([blob], `photo.${photo.format || 'jpg'}`, {
      type: blob.type || `image/${format}`,
    });
  }

  /** Current GPS position; rejects if unavailable or denied. */
  async getPosition(
    opts: { timeout?: number; highAccuracy?: boolean } = {},
  ): Promise<DevicePosition> {
    const timeout = opts.timeout ?? 12000;
    const enableHighAccuracy = opts.highAccuracy ?? true;

    if (this.platform.isNative) {
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy, timeout });
      return {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy ?? null,
        heading: p.coords.heading ?? null,
        speed: p.coords.speed ?? null,
      };
    }

    return new Promise<DevicePosition>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not available on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
          }),
        (err) => reject(err),
        { enableHighAccuracy, timeout, maximumAge: 0 },
      );
    });
  }
}
