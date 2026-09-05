import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AccountsDashboard,
  AccountsProfile,
  UpdateAccountsProfilePayload,
} from '@core/models/accounts.model';

import { ApiService } from './api.service';

/** Transport for the Accounts module endpoints. */
@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<AccountsDashboard> {
    return this.api.get<AccountsDashboard>('accounts/dashboard');
  }

  profile(): Observable<AccountsProfile> {
    return this.api.get<AccountsProfile>('accounts/profile');
  }

  updateProfile(payload: UpdateAccountsProfilePayload): Observable<AccountsProfile> {
    return this.api.put<AccountsProfile>('accounts/profile', payload);
  }
}
