import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  TelecallerDashboard,
  TelecallerProfile,
  UpdateTelecallerProfilePayload,
} from '@core/models/telecaller.model';

import { ApiService } from './api.service';

/** Transport for the Telecaller module endpoints. */
@Injectable({ providedIn: 'root' })
export class TelecallerService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<TelecallerDashboard> {
    return this.api.get<TelecallerDashboard>('telecallers/dashboard');
  }

  profile(): Observable<TelecallerProfile> {
    return this.api.get<TelecallerProfile>('telecallers/profile');
  }

  updateProfile(
    payload: UpdateTelecallerProfilePayload,
  ): Observable<TelecallerProfile> {
    return this.api.put<TelecallerProfile>('telecallers/profile', payload);
  }
}
