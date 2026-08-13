import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { AppNotification } from '@core/models/notification.model';

import { ApiService } from './api.service';

/** Transport plus unread-count state for in-app notifications (Phase 9). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);
  private readonly base = 'notifications';

  readonly unreadCount = signal(0);

  list(unreadOnly = false): Observable<AppNotification[]> {
    return this.api
      .getEnvelope<AppNotification[]>(this.base, unreadOnly ? { unread: 1 } : {})
      .pipe(
        tap((response) =>
          this.unreadCount.set(Number(response.meta?.['unread_count'] ?? 0)),
        ),
        map((response) => response.data ?? []),
      );
  }

  markRead(id: number): Observable<null> {
    return this.api
      .post<null>(`${this.base}/${id}/read`)
      .pipe(tap(() => this.unreadCount.update((n) => Math.max(0, n - 1))));
  }

  markAllRead(): Observable<{ updated: number }> {
    return this.api
      .post<{ updated: number }>(`${this.base}/read-all`)
      .pipe(tap(() => this.unreadCount.set(0)));
  }
}
