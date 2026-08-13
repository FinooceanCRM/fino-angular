import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserListFilters,
} from '@core/models/user.model';

import { ApiService } from './api.service';

/**
 * Talks to /api/v1/users. The backend already scopes every response to the
 * signed-in user's slice of the hierarchy.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  private readonly usersState = signal<ManagedUser[]>([]);
  private readonly loadingState = signal(false);

  readonly users = this.usersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

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

    return this.api.get<ManagedUser[]>('users', params).pipe(
      tap({
        next: (users) => {
          this.usersState.set(users);
          this.loadingState.set(false);
        },
        error: () => this.loadingState.set(false),
      }),
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
