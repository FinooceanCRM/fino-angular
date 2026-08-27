import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface LeadReferralLink {
  code: string;
  link: string;
}

/**
 * Personal lead-capture referral link — Manager/Relationship Manager/
 * Employee/Connector/Banker. Backed by `LeadReferralService` on the
 * backend; leads submitted through the link land in the owner's "My
 * Submitted Leads" list (see `ManagerLeadStatusTableComponent`'s
 * `scopeToCreatedBy`/`scopeToConnectorId` inputs).
 */
@Injectable({ providedIn: 'root' })
export class LeadReferralService {
  private readonly api = inject(ApiService);

  get(): Observable<LeadReferralLink> {
    return this.api.get<LeadReferralLink>('me/lead-referral-link');
  }
}
