/** Global search (Phase 1) — indexes Users, Leads, Bankers, Connectors and Employees, served by `GET /search`. */

export type SearchResultType = 'lead' | 'user' | 'employee' | 'connector' | 'banker';

/** "Users" covers Managers and Relationship Managers; Employees, Connectors and Bankers are their own category. */
export const SEARCH_TYPE_LABEL: Record<SearchResultType, string> = {
  lead: 'Leads',
  user: 'Users',
  employee: 'Employees',
  connector: 'Connectors',
  banker: 'Bankers',
};

export const SEARCH_TYPE_ORDER: SearchResultType[] = ['lead', 'user', 'employee', 'connector', 'banker'];

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  meta: string;
  icon: string;
  route: string[];
  query_params?: Record<string, string> | null;
}

export interface SearchResponse {
  results: SearchResult[];
  counts: Record<SearchResultType, number>;
}
