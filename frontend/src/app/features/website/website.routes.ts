import { Routes } from '@angular/router';

import { customerGuestGuard, homeGuard } from '@core/guards/auth.guard';

import { WebsiteLayoutComponent } from './layout/website-layout.component';

/**
 * Public marketing site. Mounted at '' ahead of the authenticated CRM shell
 * (see app.routes.ts); any URL not listed here falls through to the shell.
 */
export const websiteRoutes: Routes = [
  {
    path: '',
    component: WebsiteLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'FINOOCEAN — Finance that moves your life forward',
        // Signed-in staff/customers are sent to their own workspace instead.
        canActivate: [homeGuard],
        loadComponent: () => import('./pages/home.component').then((m) => m.WebsiteHomeComponent),
      },
      {
        path: 'offers/:slug',
        title: 'Special offer — FINOOCEAN',
        loadComponent: () => import('./offers/offer-landing.component').then((m) => m.OfferLandingComponent),
      },
      {
        path: 'about',
        title: 'About us — FINOOCEAN',
        loadComponent: () => import('./pages/about.component').then((m) => m.WebsiteAboutComponent),
      },
      {
        path: 'services',
        title: 'Loan services — FINOOCEAN',
        loadComponent: () => import('./pages/services.component').then((m) => m.WebsiteServicesComponent),
      },
      {
        path: 'services/:slug',
        title: 'Loan product — FINOOCEAN',
        loadComponent: () => import('./pages/service-detail.component').then((m) => m.WebsiteServiceDetailComponent),
      },
      {
        path: 'calculator',
        title: 'EMI calculator — FINOOCEAN',
        loadComponent: () => import('./pages/calculator.component').then((m) => m.WebsiteCalculatorComponent),
      },
      {
        path: 'eligibility',
        title: 'Check eligibility — FINOOCEAN',
        loadComponent: () => import('./pages/eligibility.component').then((m) => m.WebsiteEligibilityComponent),
      },
      {
        path: 'apply',
        title: 'Apply for a loan — FINOOCEAN',
        loadComponent: () => import('./pages/apply.component').then((m) => m.WebsiteApplyComponent),
      },
      {
        path: 'login',
        title: 'Customer login — FINOOCEAN',
        canActivate: [customerGuestGuard],
        data: { mode: 'login' },
        loadComponent: () => import('./pages/customer-auth.component').then((m) => m.CustomerAuthComponent),
      },
      {
        path: 'register',
        title: 'Create your account — FINOOCEAN',
        canActivate: [customerGuestGuard],
        data: { mode: 'register' },
        loadComponent: () => import('./pages/customer-auth.component').then((m) => m.CustomerAuthComponent),
      },
      {
        path: 'testimonials',
        title: 'Testimonials — FINOOCEAN',
        loadComponent: () => import('./pages/testimonials.component').then((m) => m.WebsiteTestimonialsComponent),
      },
      {
        path: 'blog',
        title: 'News & Blog — FINOOCEAN',
        loadComponent: () => import('./pages/blog.component').then((m) => m.WebsiteBlogComponent),
      },
      {
        path: 'blog/:slug',
        title: 'Article — FINOOCEAN',
        loadComponent: () => import('./pages/blog-article.component').then((m) => m.WebsiteBlogArticleComponent),
      },
      {
        path: 'faq',
        title: 'FAQs — FINOOCEAN',
        loadComponent: () => import('./pages/faq.component').then((m) => m.WebsiteFaqComponent),
      },
      {
        path: 'contact',
        title: 'Contact us — FINOOCEAN',
        loadComponent: () => import('./pages/contact.component').then((m) => m.WebsiteContactComponent),
      },
      {
        path: 'terms',
        title: 'Terms & conditions — FINOOCEAN',
        loadComponent: () => import('./pages/static-pages.component').then((m) => m.WebsiteTermsComponent),
      },
    ],
  },
];
