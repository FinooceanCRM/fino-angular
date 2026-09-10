import { Injectable, inject } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { PlatformService } from './platform.service';

/**
 * Hands a generated / fetched file to the user.
 *
 * Web: the classic `<a download>` click.
 * Native (Capacitor): anchor/blob downloads are inert in the WebView, so
 * the file is written to the app cache and offered through the OS share
 * sheet ("Save to Files", "Share…", AirDrop, etc.).
 *
 * Used for authenticated document downloads (the API streams a blob behind
 * a bearer token, so the browser can't be handed a URL) and the generated
 * vendor certificate PDF.
 */
@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly platform = inject(PlatformService);

  async save(blob: Blob, filename: string): Promise<void> {
    if (!this.platform.isNative) {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const base64 = await this.toBase64(blob);
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({ title: filename, url: written.uri });
  }

  private toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('Could not read file.'));
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the `data:<mime>;base64,` prefix — Filesystem wants raw base64.
        resolve(result.slice(result.indexOf(',') + 1));
      };
      reader.readAsDataURL(blob);
    });
  }
}
