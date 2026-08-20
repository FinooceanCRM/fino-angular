import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  TelecallerFollowUp,
  TelecallerFollowUpPayload,
} from '@core/models/telecaller-follow-up.model';

import { ApiService } from './api.service';

/** Transport for the Telecaller follow-up/note log — a separate table and endpoints from the Banker-only follow-up log. */
@Injectable({ providedIn: 'root' })
export class TelecallerFollowUpService {
  private readonly api = inject(ApiService);

  forLead(leadId: number): Observable<TelecallerFollowUp[]> {
    return this.api.get<TelecallerFollowUp[]>(`leads/${leadId}/telecaller-follow-ups`);
  }

  create(leadId: number, payload: TelecallerFollowUpPayload): Observable<TelecallerFollowUp> {
    return this.api.post<TelecallerFollowUp>(`leads/${leadId}/telecaller-follow-ups`, payload);
  }

  complete(id: number): Observable<TelecallerFollowUp> {
    return this.api.post<TelecallerFollowUp>(`telecaller-follow-ups/${id}/complete`, {});
  }

  reschedule(id: number, nextFollowUpAt: string): Observable<TelecallerFollowUp> {
    return this.api.post<TelecallerFollowUp>(`telecaller-follow-ups/${id}/reschedule`, {
      next_follow_up_at: nextFollowUpAt,
    });
  }

  pending(): Observable<TelecallerFollowUp[]> {
    return this.api.get<TelecallerFollowUp[]>('telecallers/follow-ups');
  }
}
