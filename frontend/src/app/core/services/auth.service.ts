import { Injectable, computed, inject, signal } from '@angular/core';

import { ApiService } from './api.service';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

/**
 * Signal-based authentication state holder.
 * Phase 1 placeholder — no requests are performed yet.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly userState = signal<AuthenticatedUser | null>(null);
  private readonly loadingState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  setUser(user: AuthenticatedUser | null): void {
    this.userState.set(user);
  }

  setLoading(loading: boolean): void {
    this.loadingState.set(loading);
  }

  clear(): void {
    this.userState.set(null);
  }
}
