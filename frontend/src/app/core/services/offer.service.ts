import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';
import {
  CallbackForm,
  AdminOffer,
  OfferAnalytics,
  OfferEventType,
  OfferInput,
  OfferLeadForm,
  OfferMeta,
  OfferSettings,
  PopupConfig,
  PublicOffer,
} from '@core/models/offer.model';

import { ApiService } from './api.service';

/** Offer lead generation: the public popup / landing page API and the super-admin management API. */
@Injectable({ providedIn: 'root' })
export class OfferService {
  private readonly api = inject(ApiService);

  // ── public ──

  popupConfig(visitorId?: string | null): Observable<PopupConfig> {
    return this.api.get<PopupConfig>('public/offers/popup', visitorId ? { visitor_id: visitorId } : undefined);
  }

  offer(slug: string): Observable<PublicOffer> {
    return this.api.get<PublicOffer>(`public/offers/${encodeURIComponent(slug)}`);
  }

  /** Anonymous funnel step. Failures are ignored: tracking must never get in the visitor's way. */
  track(type: OfferEventType, offerId: number, visitorId: string | null, page: string): void {
    this.api.post('public/offers/events', { type, offer_id: offerId, visitor_id: visitorId, page }).subscribe({ error: () => undefined });
  }

  callback(body: CallbackForm): Observable<null> {
    return this.api.post<null>('public/offers/callback', body);
  }

  claim(slug: string, body: OfferLeadForm): Observable<{ reference: string | null }> {
    return this.api.post<{ reference: string | null }>(`public/offers/${encodeURIComponent(slug)}/leads`, body);
  }

  imageUrl(o: { image_url: string | null }): string | null {
    return o.image_url ? `${environment.apiBaseUrl}/${o.image_url}` : null;
  }

  // ── super admin ──

  meta(): Observable<OfferMeta> {
    return this.api.get<OfferMeta>('super-admin/offers/meta');
  }

  list(): Observable<AdminOffer[]> {
    return this.api.get<AdminOffer[]>('super-admin/offers');
  }

  create(body: Partial<OfferInput>): Observable<AdminOffer> {
    return this.api.post<AdminOffer>('super-admin/offers', body);
  }

  update(id: number, body: Partial<OfferInput>): Observable<AdminOffer> {
    return this.api.put<AdminOffer>(`super-admin/offers/${id}`, body);
  }

  remove(id: number): Observable<unknown> {
    return this.api.delete(`super-admin/offers/${id}`);
  }

  uploadImage(id: number, file: File): Observable<AdminOffer> {
    const form = new FormData();
    form.append('file', file);

    return this.api.upload<AdminOffer>(`super-admin/offers/${id}/image`, form);
  }

  removeImage(id: number): Observable<AdminOffer> {
    return this.api.delete<AdminOffer>(`super-admin/offers/${id}/image`);
  }

  settings(): Observable<OfferSettings> {
    return this.api.get<OfferSettings>('super-admin/offers/settings');
  }

  saveSettings(body: Partial<Pick<OfferSettings, 'popup_enabled' | 'callback_enabled' | 'first_delay_seconds' | 'second_delay_seconds' | 'repeat_gap_seconds' | 'pages'>>): Observable<OfferSettings> {
    return this.api.put<OfferSettings>('super-admin/offers/settings', body);
  }

  analytics(params: { from?: string; to?: string; offer_id?: number }): Observable<OfferAnalytics> {
    const q: Record<string, string | number> = {};
    if (params.from) q['from'] = params.from;
    if (params.to) q['to'] = params.to;
    if (params.offer_id) q['offer_id'] = params.offer_id;

    return this.api.get<OfferAnalytics>('super-admin/offers/analytics', q);
  }
}
