import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserListFilters,
} from '@core/models/user.model';

import { ApiService } from './api.service';

export interface AssignableRole {
  value: string;
  label: string;
}

export interface UserListMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const EMPTY_META: UserListMeta = { current_page: 1, per_page: 15, total: 0, last_page: 1 };

/**
 * Talks to /api/v1/users. The backend already scopes every response to the
 * signed-in user's slice of the hierarchy.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  private readonly usersState = signal<ManagedUser[]>([]);
  private readonly loadingState = signal(false);
  private readonly metaState = signal<UserListMeta>(EMPTY_META);
  private readonly assignableRolesState = signal<AssignableRole[]>([]);

  readonly users = this.usersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** Pagination meta from the last list() call. */
  readonly meta = this.metaState.asReadonly();
  /**
   * Roles the signed-in user is allowed to assign when creating/editing a
   * user, as computed server-side. Populated by list(); drives the role
   * `<select>` on the create/edit form instead of a hardcoded option list.
   */
  readonly assignableRoles = this.assignableRolesState.asReadonly();

  list(filters: UserListFilters = {}): Observable<ManagedUser[]> {
    this.loadingState.set(true);

    const params: Record<string, string | number> = {};
    if (filters.role) params['role'] = filters.role;
    if (filters.search) params['search'] = filters.search;
    if (filters.isActive !== undefined) {
      params['is_active'] = filters.isActive ? 1 : 0;
    }
    if (filters.page) params['page'] = filters.page;
    if (filters.perPage) params['per_page'] = filters.perPage;

    return this.api.getEnvelope<ManagedUser[]>('users', params).pipe(
      tap({
        next: (response) => {
          this.usersState.set(response.data);
          this.metaState.set({
            current_page: Number(response.meta?.['current_page'] ?? 1),
            per_page: Number(response.meta?.['per_page'] ?? filters.perPage ?? 15),
            total: Number(response.meta?.['total'] ?? response.data.length),
            last_page: Number(response.meta?.['last_page'] ?? 1),
          });
          this.assignableRolesState.set(
            (response.meta?.['assignable_roles'] as AssignableRole[] | undefined) ?? [],
          );
          this.loadingState.set(false);
        },
        error: () => this.loadingState.set(false),
      }),
      map((response) => response.data),
    );
  }

  get(id: number): Observable<ManagedUser> {
    return this.api.get<ManagedUser>(`users/${id}`);
  }

  create(payload: CreateUserPayload): Observable<ManagedUser> {
    return this.api.post<ManagedUser>('users', payload);
  }

  update(id: number, payload: UpdateUserPayload): Observable<ManagedUser> {
    return this.api.put<ManagedUser>(`users/${id}`, payload);
  }

  remove(id: number): Observable<unknown> {
    return this.api.delete(`users/${id}`);
  }
}
