import { AuthService } from '@core/services/auth.service';

import { mobileNavItems, primaryMobileNavItems } from './nav-items';

function fakeAuth(role: string, can = false): AuthService {
  return {
    hasRole: (...roles: string[]) => roles.includes(role),
    can: () => can,
  } as unknown as AuthService;
}

describe('primaryMobileNavItems', () => {
  it('returns at most four destinations', () => {
    for (const role of ['telecaller', 'employee', 'manager', 'super_admin', 'connector']) {
      expect(primaryMobileNavItems(fakeAuth(role)).length).toBeLessThanOrEqual(4);
    }
  });

  it('never includes the Profile link (it lives in the account menu)', () => {
    const links = primaryMobileNavItems(fakeAuth('telecaller')).map((i) => i.link);
    expect(links.some((l) => l.endsWith('/profile'))).toBe(false);
  });

  it('leads with the role dashboard', () => {
    expect(primaryMobileNavItems(fakeAuth('telecaller'))[0].link).toBe('/telecaller/dashboard');
  });

  it('produces no duplicate links', () => {
    const links = mobileNavItems(fakeAuth('manager', true)).map((i) => i.link);
    expect(new Set(links).size).toBe(links.length);
  });

  it('falls back to the generic Dashboard for an unknown role', () => {
    const items = primaryMobileNavItems(fakeAuth('nobody'));
    expect(items[0]).toEqual({ label: 'Dashboard', link: '/dashboard', icon: 'dashboard' });
  });
});
