import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  GeneralSettings,
  MatchingEngineSettings,
  NotificationSettings,
  SecuritySettings,
  SettingsState,
} from '@core/models/settings.model';

import { ApiService } from './api.service';

/** Transport for the singleton platform settings document (Phase 1). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);
  private readonly base = 'settings';

  get(): Observable<SettingsState> {
    return this.api.get<SettingsState>(this.base);
  }

  updateGeneral(payload: GeneralSettings): Observable<SettingsState> {
    return this.api.put<SettingsState>(`${this.base}/general`, payload);
  }

  updateMatchingEngine(payload: MatchingEngineSettings): Observable<SettingsState> {
    return this.api.put<SettingsState>(`${this.base}/matching-engine`, payload);
  }

  updateNotifications(payload: NotificationSettings): Observable<SettingsState> {
    return this.api.put<SettingsState>(`${this.base}/notifications`, payload);
  }

  updateSecurity(payload: SecuritySettings): Observable<SettingsState> {
    return this.api.put<SettingsState>(`${this.base}/security`, payload);
  }
}
