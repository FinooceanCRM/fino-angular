import { Routes } from '@angular/router';

import { customerGuard } from '@core/guards/auth.guard';

import { AccountLayoutComponent } from './layout/account-layout.component';

/**
 * Customer portal (/account). Every route requires a signed-in `customer`;
 * staff are redirected to the customer login, never shown these pages. The
 * backend enforces the same boundary (`role:customer`), this is only UX.
 */
export const accountRoutes: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    canActivate: [customerGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'My account — FINOOCEAN',
        loadComponent: () => import('./pages/dashboard.component').then((m) => m.AccountDashboardComponent),
      },
      {
        path: 'applications',
        title: 'My applications — FINOOCEAN',
        loadComponent: () => import('./pages/applications.component').then((m) => m.AccountApplicationsComponent),
      },
      {
        path: 'applications/:id',
        title: 'Application details — FINOOCEAN',
        loadComponent: () => import('./pages/application-detail.component').then((m) => m.AccountApplicationDetailComponent),
      },
      {
        path: 'apply',
        title: 'Apply for a loan — FINOOCEAN',
        loadComponent: () => import('./pages/apply.component').then((m) => m.AccountApplyComponent),
      },
      {
        path: 'calculator',
        title: 'EMI calculator — FINOOCEAN',
        loadComponent: () => import('../website/pages/calculator.component').then((m) => m.WebsiteCalculatorComponent),
      },
      {
        path: 'documents',
        title: 'My documents — FINOOCEAN',
        loadComponent: () => import('./pages/documents.component').then((m) => m.AccountDocumentsComponent),
      },
      {
        path: 'profile',
        title: 'My profile — FINOOCEAN',
        loadComponent: () => import('./profile/profile-info.component').then((m) => m.ProfileInfoComponent),
      },
      {
        path: 'profile/overview',
        title: 'KYC & profile — FINOOCEAN',
        loadComponent: () => import('./profile/kyc-overview.component').then((m) => m.ProfileKycOverviewComponent),
      },
      {
        path: 'profile/kyc',
        title: 'KYC verification — FINOOCEAN',
        loadComponent: () => import('./profile/kyc.component').then((m) => m.ProfileKycComponent),
      },
      {
        path: 'profile/bank',
        title: 'Bank details — FINOOCEAN',
        loadComponent: () => import('./profile/bank.component').then((m) => m.ProfileBankComponent),
      },
      {
        path: 'profile/payments',
        title: 'UPI & payment methods — FINOOCEAN',
        loadComponent: () => import('./profile/payments.component').then((m) => m.ProfilePaymentsComponent),
      },
      {
        path: 'profile/communication',
        title: 'Communication preferences — FINOOCEAN',
        loadComponent: () => import('./profile/communication.component').then((m) => m.ProfileCommunicationComponent),
      },
      {
        path: 'profile/security',
        title: 'Change password & security — FINOOCEAN',
        loadComponent: () => import('./profile/security.component').then((m) => m.ProfileSecurityComponent),
      },
      {
        path: 'profile/delete',
        title: 'Delete account — FINOOCEAN',
        loadComponent: () => import('./profile/delete-account.component').then((m) => m.ProfileDeleteComponent),
      },
      {
        path: 'logout',
        title: 'Logout — FINOOCEAN',
        loadComponent: () => import('./profile/logout.component').then((m) => m.ProfileLogoutComponent),
      },
      {
        path: 'notifications',
        title: 'Notifications — FINOOCEAN',
        loadComponent: () => import('./pages/notifications.component').then((m) => m.AccountNotificationsComponent),
      },
      {
        path: 'offers',
        title: 'Offers for me — FINOOCEAN',
        loadComponent: () => import('./pages/offers.component').then((m) => m.AccountOffersComponent),
      },
      {
        path: 'settings',
        title: 'Account settings — FINOOCEAN',
        loadComponent: () => import('./pages/settings.component').then((m) => m.AccountSettingsComponent),
      },
      {
        path: 'help',
        title: 'Support — FINOOCEAN',
        loadComponent: () => import('./pages/help.component').then((m) => m.AccountHelpComponent),
      },
    ],
  },
];
