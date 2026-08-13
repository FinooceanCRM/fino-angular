import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { AuthenticatedUser } from '@core/models/user.model';

import { AuthService } from './auth.service';
import { SessionService } from './session.service';

const user: AuthenticatedUser = {
  id: 1,
  name: 'Super Admin',
  email: 'superadmin@finoocean.test',
  role: 'super_admin',
  role_label: 'Super Admin',
  manager_id: null,
  relationship_manager_id: null,
  employee_id: null,
  phone: null,
  is_active: true,
  created_at: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('stores user and token on login', () => {
    service.login({ email: user.email, password: 'Password123!' }).subscribe();

    const request = http.expectOne((r) => r.url.endsWith('/auth/login'));
    request.flush({
      success: true,
      data: { user, token: 'token-123', token_type: 'Bearer' },
      message: null,
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('super_admin');
    expect(session.token).toBe('token-123');
  });

  it('clears the session on logout', () => {
    session.persist('token-123', user);
    service.logout().subscribe();

    http.expectOne((r) => r.url.endsWith('/auth/logout')).flush({
      success: true,
      data: null,
      message: null,
    });

    expect(session.token).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('matches roles', () => {
    session.persist('token-123', user);
    service.login({ email: user.email, password: 'Password123!' }).subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush({
      success: true,
      data: { user, token: 'token-123', token_type: 'Bearer' },
      message: null,
    });

    expect(service.hasRole('super_admin', 'manager')).toBe(true);
    expect(service.hasRole('employee')).toBe(false);
  });
});
