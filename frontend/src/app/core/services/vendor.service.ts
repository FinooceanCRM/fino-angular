import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { VendorDashboard } from '@core/models/vendor.model';

import { ApiService } from './api.service';

/** Transport for the Vendor module endpoints. */
@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<VendorDashboard> {
    return this.api.get<VendorDashboard>('vendors/dashboard');
  }
}
