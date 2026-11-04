import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

import {
  AppPermission,
  ASSIGNABLE_ROLES,
  permissionsForRole,
} from '@core/auth/permissions';
import {
  AuthenticatedUser,
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterCustomerPayload,
  UpdatePreferencesPayload,
  UserRole,
} from '@core/models/user.model';

import { ApiService } from './api.service';
import { PushService } from './push.service';
import { SessionService } from './session.service';

/**
 * Signal-based authentication state, backed by Sanctum bearer tokens.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly push = inject(PushService);

  private readonly userState = signal<AuthenticatedUser | null>(
    this.session.user,
  );
  private readonly loadingState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly role = computed<UserRole | null>(() => this.userState()?.role ?? null);
  readonly permissions = computed<AppPermission[]>(() =>
    permissionsForRole(this.role()),
  );
  readonly assignableRoles = computed<UserRole[]>(() => {
    const role = this.role();
    return role ? ASSIGNABLE_ROLES[role] ?? [] : [];
  });
  readonly canManageUsers = computed(() => this.permissions().length > 0);

  get token(): string | null {
    return this.session.token;
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    this.loadingState.set(true);

    return this.api.post<LoginResponse>('auth/login', payload).pipe(
      tap({
        next: (response) => {
          this.session.persist(response.token, response.user);
          this.userState.set(response.user);
          this.loadingState.set(false);
          if (response.user.role !== 'customer') {
            void this.push.register();
          }
        },
        error: () => this.loadingState.set(false),
      }),
    );
  }

  /**
   * Customer-portal sign-in. A separate API door from {@link login}: it only
   * authenticates `customer` accounts, so it can never open a CRM workspace.
   */
  loginCustomer(payload: LoginPayload): Observable<LoginResponse> {
    return this.startCustomerSession(this.api.post<LoginResponse>('customer/auth/login', payload));
  }

  registerCustomer(payload: RegisterCustomerPayload): Observable<LoginResponse> {
    return this.startCustomerSession(this.api.post<LoginResponse>('customer/auth/register', payload));
  }

  private startCustomerSession(request: Observable<LoginResponse>): Observable<LoginResponse> {
    this.loadingState.set(true);

    return request.pipe(
      tap({
        next: (response) => {
          this.session.persist(response.token, response.user);
          this.userState.set(response.user);
          this.loadingState.set(false);
        },
        error: () => this.loadingState.set(false),
      }),
    );
  }

  /** Re-validates the persisted session against the API. */
  loadCurrentUser(): Observable<AuthenticatedUser | null> {
    if (!this.session.token) {
      this.clear();
      return of(null);
    }

    return this.api.get<AuthenticatedUser>('auth/me').pipe(
      tap((user) => {
        this.session.persistUser(user);
        this.userState.set(user);
        if (user.role !== 'customer') {
          void this.push.register();
        }
      }),
      catchError(() => {
        this.clear();
        return of(null);
      }),
    );
  }

  logout(): Observable<unknown> {
    // Detach this device from push before the token is invalidated, so the
    // DELETE call still carries a valid bearer token. Customers never
    // register a device (their token cannot reach the staff endpoint).
    if (this.role() !== 'customer') {
      void this.push.unregister();
    }

    return this.api.post('auth/logout').pipe(
      tap({
        next: () => this.clear(),
        error: () => this.clear(),
      }),
      catchError(() => of(null)),
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<null> {
    return this.api.post<null>('auth/password', payload);
  }

  updatePreferences(payload: UpdatePreferencesPayload): Observable<AuthenticatedUser> {
    return this.api.put<AuthenticatedUser>('auth/preferences', payload).pipe(
      tap((user) => {
        this.session.persistUser(user);
        this.userState.set(user);
      }),
    );
  }

  /** Permission check mirroring the backend policy matrix. */
  can(...permissions: AppPermission[]): boolean {
    const granted = this.permissions();
    return permissions.every((permission) => granted.includes(permission));
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.role();
    return current !== null && roles.includes(current);
  }

  clear(): void {
    this.session.clear();
    this.userState.set(null);
  }
}
