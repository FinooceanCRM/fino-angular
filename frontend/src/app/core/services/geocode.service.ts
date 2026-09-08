import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { GeocodeAddress, GeocodeSuggestion } from '@core/models/vendor-certification.model';

import { ApiService } from './api.service';

/**
 * Thin wrapper for the Vendor Certification map step's geocoding proxy
 * (GET vendors/geocode). Mirrors the reference app's `SVMap.Geo`.
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly api = inject(ApiService);

  reverse(lat: number, lng: number): Observable<GeocodeAddress | null> {
    return this.api.get<GeocodeAddress | null>('vendors/geocode', {
      mode: 'reverse',
      lat,
      lng,
    });
  }

  forward(q: string): Observable<GeocodeAddress | null> {
    return this.api.get<GeocodeAddress | null>('vendors/geocode', { mode: 'forward', q });
  }

  suggest(q: string): Observable<GeocodeSuggestion[]> {
    return this.api.get<GeocodeSuggestion[]>('vendors/geocode', { mode: 'suggest', q });
  }
}
