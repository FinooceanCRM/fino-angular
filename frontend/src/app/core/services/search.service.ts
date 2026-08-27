import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { SearchResponse, SearchResultType } from '@core/models/search.model';

import { ApiService } from './api.service';

/** Transport for global search (Phase 1) — scoped server-side to the caller's own visibility. */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly api = inject(ApiService);
  private readonly base = 'search';

  search(term: string, types?: SearchResultType[]): Observable<SearchResponse> {
    const params: Record<string, string | number> = { q: term };
    if (types && types.length > 0) {
      params['type'] = types.join(',');
    }

    return this.api.get<SearchResponse>(this.base, params);
  }
}
