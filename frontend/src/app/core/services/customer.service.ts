import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  Customer,
  CustomerDraft,
  CustomerFilters,
  CustomerInteraction,
  CustomerNote,
  Paginated,
  PaginationMeta,
} from '@core/models/customer.model';

import { ApiService } from './api.service';

/** Transport for the Customer Management endpoints (Phase 3). */
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);
  private readonly base = 'customers';

  list(filters: CustomerFilters = {}): Observable<Paginated<Customer>> {
    return this.api
      .getEnvelope<Customer[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  getById(id: number): Observable<Customer> {
    return this.api.get<Customer>(`${this.base}/${id}`);
  }

  create(draft: CustomerDraft): Observable<Customer> {
    return this.api.post<Customer>(this.base, draft);
  }

  update(id: number, draft: Partial<CustomerDraft>): Observable<Customer> {
    return this.api.put<Customer>(`${this.base}/${id}`, draft);
  }

  remove(id: number): Observable<null> {
    return this.api.delete<null>(`${this.base}/${id}`);
  }

  linkLead(id: number, leadId: number): Observable<Customer> {
    return this.api.post<Customer>(`${this.base}/${id}/link-lead`, { lead_id: leadId });
  }

  unlinkLead(id: number, leadId: number): Observable<Customer> {
    return this.api.post<Customer>(`${this.base}/${id}/unlink-lead`, { lead_id: leadId });
  }

  notesFor(id: number): Observable<CustomerNote[]> {
    return this.api.get<CustomerNote[]>(`${this.base}/${id}/notes`);
  }

  addNote(id: number, body: string): Observable<CustomerNote> {
    return this.api.post<CustomerNote>(`${this.base}/${id}/notes`, { body });
  }

  interactionsFor(id: number): Observable<CustomerInteraction[]> {
    return this.api.get<CustomerInteraction[]>(`${this.base}/${id}/interactions`);
  }
}
