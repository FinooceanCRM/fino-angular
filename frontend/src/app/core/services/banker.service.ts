import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BankerDashboard, BankerProfile, UpdateBankerProfilePayload } from '@core/models/banker.model';

import { ApiService } from './api.service';

/** Transport for the Banker module endpoints. */
@Injectable({ providedIn: 'root' })
export class BankerService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<BankerDashboard> {
    return this.api.get<BankerDashboard>('bankers/dashboard');
  }

  profile(): Observable<BankerProfile> {
    return this.api.get<BankerProfile>('bankers/profile');
  }

  updateProfile(payload: UpdateBankerProfilePayload): Observable<BankerProfile> {
    return this.api.put<BankerProfile>('bankers/profile', payload);
  }
}
