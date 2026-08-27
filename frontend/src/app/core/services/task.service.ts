import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Paginated, PaginationMeta, Task, TaskCounts, TaskDraft, TaskFilters } from '@core/models/task.model';

import { ApiService } from './api.service';

/**
 * Transport for the Tasks endpoints (Phase 4). Backs both the Tasks module
 * (every role) and — via `assigned_to: 'team'` — the Relationship Manager
 * module's Activities tabs, which are a filtered view over this same API.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = inject(ApiService);
  private readonly base = 'tasks';

  list(filters: TaskFilters = {}): Observable<Paginated<Task>> {
    return this.api
      .getEnvelope<Task[]>(this.base, filters as Record<string, string | number>)
      .pipe(
        map((response) => ({
          items: response.data ?? [],
          meta: (response.meta ?? {}) as unknown as PaginationMeta,
        })),
      );
  }

  counts(type?: Task['type']): Observable<TaskCounts> {
    return this.api.get<TaskCounts>(`${this.base}/counts`, type ? { type } : undefined);
  }

  getById(id: number): Observable<Task> {
    return this.api.get<Task>(`${this.base}/${id}`);
  }

  create(draft: TaskDraft): Observable<Task> {
    return this.api.post<Task>(this.base, draft);
  }

  update(id: number, draft: Partial<TaskDraft>): Observable<Task> {
    return this.api.put<Task>(`${this.base}/${id}`, draft);
  }

  remove(id: number): Observable<null> {
    return this.api.delete<null>(`${this.base}/${id}`);
  }

  complete(id: number): Observable<Task> {
    return this.api.post<Task>(`${this.base}/${id}/complete`);
  }

  cancel(id: number): Observable<Task> {
    return this.api.post<Task>(`${this.base}/${id}/cancel`);
  }

  reschedule(id: number, dueAt: string): Observable<Task> {
    return this.api.post<Task>(`${this.base}/${id}/reschedule`, { due_at: dueAt });
  }
}
