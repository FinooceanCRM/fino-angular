import { OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';

import { ApiService } from '@core/services/api.service';

/**
 * Renders a bearer-gated API image path as a browser object URL.
 *
 * The Vendor Certification image routes require the Sanctum bearer token,
 * which a plain `<img src>` cannot send — so instead of exposing the bytes
 * through a guessable query-string token, this pipe fetches the blob through
 * ApiService (auth header attached) and hands back a `blob:` URL. That URL
 * is same-origin, so it also keeps html2canvas from tainting the PDF
 * canvas.
 *
 *   <img [src]="image.path | authImage | async" />
 */
@Pipe({ name: 'authImage', standalone: true, pure: true })
export class AuthImagePipe implements PipeTransform, OnDestroy {
  private readonly api = inject(ApiService);

  private objectUrl?: string;
  private cachedPath?: string;
  private stream?: Observable<string>;

  transform(path: string | null | undefined): Observable<string> | null {
    if (!path) {
      this.revoke();
      return null;
    }
    if (path !== this.cachedPath) {
      this.revoke();
      this.cachedPath = path;
      this.stream = this.api.download(path).pipe(
        map((blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          return this.objectUrl;
        }),
        shareReplay(1),
      );
    }
    return this.stream ?? of('');
  }

  private revoke(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }

  ngOnDestroy(): void {
    this.revoke();
  }
}
