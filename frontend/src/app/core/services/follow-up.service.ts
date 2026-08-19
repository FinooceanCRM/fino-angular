import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { LeadFollowUp, LeadFollowUpPayload } from '@core/models/follow-up.model';

import { ApiService } from './api.service';

/** Transport for the Banker-only follow-up log (§11 of the Banker workflow). */
@Injectable({ providedIn: 'root' })
export class FollowUpService {
  private readonly api = inject(ApiService);

  forLead(leadId: number): Observable<LeadFollowUp[]> {
    return this.api.get<LeadFollowUp[]>(`leads/${leadId}/follow-ups`);
  }

  create(leadId: number, payload: LeadFollowUpPayload): Observable<LeadFollowUp> {
    return this.api.post<LeadFollowUp>(`leads/${leadId}/follow-ups`, payload);
  }

  complete(id: number): Observable<LeadFollowUp> {
    return this.api.post<LeadFollowUp>(`follow-ups/${id}/complete`, {});
  }
}
