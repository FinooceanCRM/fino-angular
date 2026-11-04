import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { BreadcrumbService } from './breadcrumb.service';
import { NavigationHistoryService } from './navigation-history.service';

@Component({ standalone: true, template: '' })
class PageComponent {}

const page = { component: PageComponent };

describe('Breadcrumbs and Back navigation', () => {
  let router: Router;
  let crumbs: BreadcrumbService;
  let nav: NavigationHistoryService;

  const labels = () => crumbs.trail().map((c) => c.label);
  const go = async (url: string) => {
    await router.navigateByUrl(url);
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', ...page },
          { path: 'auth/login', ...page },
          { path: 'account', ...page },
          { path: 'account/applications', ...page },
          { path: 'account/applications/:id', ...page },
          { path: 'account/profile', ...page },
          { path: 'account/profile/bank', ...page },
          { path: 'leads', ...page },
          { path: 'leads/:id', ...page },
          { path: 'leads/:id/edit', ...page },
          { path: 'manager/leads/:id/timeline', ...page },
          { path: 'tasks/calls', ...page },
          { path: 'billing/invoices/:id', data: { breadcrumb: 'Invoice', parentRoute: '/billing/invoices', fallbackRoute: '/billing' }, ...page },
          { path: 'billing/invoices', ...page },
          { path: 'dashboard', data: { fallbackRoute: '/leads' }, ...page },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    crumbs = TestBed.inject(BreadcrumbService);
    nav = TestBed.inject(NavigationHistoryService);
    // the router only listens to the browser's Back / Forward buttons once it has done its initial navigation
    router.initialNavigation();
  });

  describe('breadcrumb trail', () => {
    it('shows Dashboard > My Applications > Application Details for an application', async () => {
      await go('/account/applications/42');
      expect(labels()).toEqual(['Dashboard', 'My Applications', 'Application Details']);
      expect(crumbs.trail().map((c) => c.link)).toEqual(['/account', '/account/applications', '/account/applications/42']);
    });

    it('nests profile pages under Profile', async () => {
      await go('/account/profile/bank');
      expect(labels()).toEqual(['Dashboard', 'Profile', 'Bank Details']);
    });

    it('reads staff URLs level by level and fills route parameters into parents', async () => {
      await go('/leads/12/edit');
      expect(labels()).toEqual(['Dashboard', 'Leads', 'Lead Details', 'Edit Lead']);
      expect(crumbs.trail().map((c) => c.link)).toEqual(['/dashboard', '/leads', '/leads/12', '/leads/12/edit']);
    });

    it('drops the role workspace segment', async () => {
      await go('/manager/leads/7/timeline');
      expect(labels()).toEqual(['Dashboard', 'Leads', 'Lead Details', 'Timeline']);
      expect(crumbs.trail()[1].link).toBe('/manager/leads');
    });

    it('works for a page nobody mapped', async () => {
      await go('/tasks/calls');
      expect(labels()).toEqual(['Dashboard', 'Tasks', 'Calls']);
    });

    it('uses route data for a new module', async () => {
      await go('/billing/invoices/9');
      expect(labels()).toEqual(['Dashboard', 'Billing', 'Invoices', 'Invoice']);
      expect(crumbs.parent()?.link).toBe('/billing/invoices');
    });

    it('lets a page rename its own last crumb, and forgets it on the next navigation', async () => {
      await go('/account/applications/42');
      crumbs.setCurrentLabel('Application INQ-1');
      expect(labels().at(-1)).toBe('Application INQ-1');
      await go('/account/applications');
      expect(labels().at(-1)).toBe('My Applications');
    });
  });

  describe('Back', () => {
    it('goes to My Applications, not the Dashboard, when a detail page was opened from the Dashboard', async () => {
      await go('/account');
      await go('/account/applications/42');
      expect(nav.target()).toBe('/account/applications');
    });

    it('returns to the exact list the person left, filters included', async () => {
      await go('/account/applications?page=3&status=open');
      await go('/account/applications/42');
      expect(nav.target()).toBe('/account/applications?page=3&status=open');
    });

    it('uses the parent when a detail page is opened directly with no history', async () => {
      await go('/account/applications/42');
      expect(nav.previous()).toBeNull();
      expect(nav.target()).toBe('/account/applications');
    });

    it('moves one level up each time, ending at the Dashboard', async () => {
      await go('/account/profile/bank');
      expect(nav.target()).toBe('/account/profile');
      await go('/account/profile');
      expect(nav.target()).toBe('/account');
    });

    it('goes to the edited record, then its list', async () => {
      await go('/leads');
      await go('/leads/12');
      await go('/leads/12/edit');
      expect(nav.target()).toBe('/leads/12');
      await go('/leads/12');
      expect(nav.target()).toBe('/leads');
    });

    it('falls back to the area home when there is no parent and no history', async () => {
      await go('/account');
      expect(nav.canGoBack()).toBeFalse();
      expect(nav.target()).toBe('/account');
    });

    it('uses the route fallbackRoute for a page with no parent and no history', async () => {
      await go('/dashboard');
      expect(nav.target()).toBe('/leads');
    });

    it('never goes back to the sign-in page', async () => {
      await go('/auth/login');
      await go('/dashboard');
      expect(nav.previous()).toBe('/auth/login');
      expect(nav.target()).not.toContain('login');
    });

    it('does not loop: back from A to B then B to A ends where it started', async () => {
      await go('/leads');
      await go('/leads/12');
      await go(nav.target());
      expect(router.url).toBe('/leads');
      expect(nav.previous()).toBeNull();
    });
  });

  describe('the browser Back button', () => {
    const settle = async (url: string) => {
      for (let i = 0; i < 60 && router.url !== url; i++) await new Promise((r) => setTimeout(r, 25));
    };

    it('lands on My Applications when the detail page was opened from the Dashboard', async () => {
      await go('/account');
      await go('/account/applications/42');
      TestBed.inject(Location).back();
      await settle('/account/applications');
      expect(router.url).toBe('/account/applications');
    });

    it('lands on the parent even when the previous page was another module', async () => {
      await go('/leads');
      await go('/account/applications/42');
      TestBed.inject(Location).back();
      await settle('/account/applications');
      expect(router.url).toBe('/account/applications');
    });

    it('leaves a normal step back to the parent alone, filters included', async () => {
      await go('/account/applications?page=2');
      await go('/account/applications/42');
      TestBed.inject(Location).back();
      await settle('/account/applications?page=2');
      expect(router.url).toBe('/account/applications?page=2');
    });

    it('does not intercept a page with no parent', async () => {
      await go('/leads');
      await go('/dashboard');
      TestBed.inject(Location).back();
      await settle('/leads');
      expect(router.url).toBe('/leads');
    });
  });

  describe('history bookkeeping', () => {
    it('does not add an entry for the same page twice', async () => {
      await go('/leads');
      await go('/leads');
      await go('/leads/1');
      expect(nav.previous()).toBe('/leads');
    });

    it('drops what came after a page when it is visited again', async () => {
      await go('/leads');
      await go('/leads/1');
      await go('/leads/1/edit');
      await go('/leads');
      expect(nav.previous()).toBeNull();
    });

    it('keeps the history over a refresh', async () => {
      await go('/leads');
      await go('/leads/1');
      const saved = sessionStorage.getItem('fino.nav.history');
      expect(JSON.parse(saved ?? '[]')).toEqual(['/leads', '/leads/1']);
    });

    it('replaces the entry on a redirect instead of adding one', async () => {
      await go('/leads');
      await router.navigateByUrl('/leads/5', { replaceUrl: true });
      expect(nav.previous()).toBeNull();
    });
  });
});
