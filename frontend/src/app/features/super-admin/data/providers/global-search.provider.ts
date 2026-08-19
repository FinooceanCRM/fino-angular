import { Injectable, computed, inject } from '@angular/core';

import { ManagedUser, UserRole } from '../models/user.model';
import { Lead, loanTypeLabel } from '../models/lead.model';
import { SearchResult, SearchResultType } from '../models/search.model';
import { LeadDataProvider } from './lead-data.provider';
import { UserDataProvider } from './user-data.provider';

const USER_ROLE_TYPE: Partial<Record<UserRole, SearchResultType>> = {
  manager: 'user',
  relationship_manager: 'user',
  employee: 'employee',
  connector: 'connector',
  banker: 'banker',
};

const USER_ROUTE_SEGMENT: Partial<Record<UserRole, string>> = {
  manager: 'managers',
  relationship_manager: 'relationship-managers',
  employee: 'employees',
  connector: 'connectors',
  banker: 'bankers',
};

const USER_ICON: Partial<Record<UserRole, string>> = {
  manager: 'supervisor_account',
  relationship_manager: 'support_agent',
  employee: 'badge',
  connector: 'hub',
  banker: 'account_balance',
};

function leadToResult(lead: Lead): SearchResult {
  return {
    id: `lead-${lead.id}`,
    type: 'lead',
    title: lead.applicant_name,
    subtitle: `${lead.reference} · ${loanTypeLabel(lead.loan_type)}`,
    meta: lead.status_label,
    icon: 'assignment',
    route: ['/super-admin/leads', String(lead.id)],
    keywords: [lead.applicant_name, lead.reference, lead.applicant_phone, lead.applicant_email]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  };
}

function userToResult(user: ManagedUser): SearchResult | null {
  const type = USER_ROLE_TYPE[user.role];
  const segment = USER_ROUTE_SEGMENT[user.role];
  if (!type || !segment) {
    return null;
  }

  return {
    id: `user-${user.id}`,
    type,
    title: user.name,
    subtitle: user.email,
    meta: user.is_active ? user.role_label : `${user.role_label} · Inactive`,
    icon: USER_ICON[user.role] ?? 'person',
    route: ['/super-admin/users', segment],
    queryParams: { search: user.email },
    keywords: [user.name, user.email, user.phone].filter(Boolean).join(' ').toLowerCase(),
  };
}

/** Ranks a title match ahead of a match found only in the subtitle/keywords. */
function rank(result: SearchResult, term: string): number {
  const title = result.title.toLowerCase();
  if (title.startsWith(term)) return 0;
  if (title.includes(term)) return 1;
  if (result.subtitle.toLowerCase().includes(term)) return 2;
  return 3;
}

/**
 * Global search index — derived, read-only, built fresh from
 * `UserDataProvider` and `LeadDataProvider` on every read so it always
 * reflects the latest mock state. No own signal state, no HTTP.
 */
@Injectable({ providedIn: 'root' })
export class GlobalSearchDataProvider {
  private readonly userData = inject(UserDataProvider);
  private readonly leadData = inject(LeadDataProvider);

  private readonly index = computed<SearchResult[]>(() => [
    ...this.leadData.leads().map(leadToResult),
    ...this.userData.users().map(userToResult).filter((r): r is SearchResult => r !== null),
  ]);

  search(term: string, types?: SearchResultType[]): SearchResult[] {
    const query = term.trim().toLowerCase();
    if (!query) {
      return [];
    }

    let results = this.index().filter(
      (r) => r.title.toLowerCase().includes(query) || r.subtitle.toLowerCase().includes(query) || r.keywords.includes(query),
    );

    if (types && types.length > 0) {
      results = results.filter((r) => types.includes(r.type));
    }

    return results.sort((a, b) => rank(a, query) - rank(b, query) || a.title.localeCompare(b.title));
  }

  countsByType(term: string): Record<SearchResultType, number> {
    const results = this.search(term);
    return {
      lead: results.filter((r) => r.type === 'lead').length,
      user: results.filter((r) => r.type === 'user').length,
      employee: results.filter((r) => r.type === 'employee').length,
      connector: results.filter((r) => r.type === 'connector').length,
      banker: results.filter((r) => r.type === 'banker').length,
    };
  }
}
