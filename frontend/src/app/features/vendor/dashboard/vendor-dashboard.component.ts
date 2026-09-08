import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { Lead } from '@core/models/lead.model';
import { VendorCertification } from '@core/models/vendor-certification.model';
import { VendorDashboard } from '@core/models/vendor.model';
import { LeadService } from '@core/services/lead.service';
import { VendorCertificationService } from '@core/services/vendor-certification.service';
import { VendorService } from '@core/services/vendor.service';
import { DashboardHeroComponent } from '@shared/components/dashboard-hero.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

interface VendorAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  cta: string;
  primary: boolean;
}

/**
 * Vendor workspace home. Built entirely from the shared Fino dashboard
 * language — `app-dashboard-hero` plus `mat-card` action tiles — so it
 * reads as the same product as every other role dashboard.
 *
 * Two primary actions: "Create Your Vendor Certification" (Phase 3 wizard)
 * and "Request a Loan" (Phase 4 — the existing Fino lead-creation form).
 * Below them, the vendor's own certifications and loan requests.
 */
@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink,
    DashboardHeroComponent,
    StatusPillComponent,
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboardComponent implements OnInit {
  private readonly vendors = inject(VendorService);
  private readonly certs = inject(VendorCertificationService);
  private readonly leads = inject(LeadService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<VendorDashboard | null>(null);
  protected readonly certifications = signal<VendorCertification[]>([]);
  protected readonly loanRequests = signal<Lead[]>([]);

  protected readonly actions: readonly VendorAction[] = [
    {
      title: 'Create Your Vendor Certification',
      description:
        'Complete the survey — business details, location and photos — to generate your official Vendor Certification.',
      icon: 'workspace_premium',
      route: '/vendor/certification',
      cta: 'Start certification',
      primary: true,
    },
    {
      title: 'Request a Loan',
      description:
        'Apply for a loan against your certified business using the standard Fino loan options.',
      icon: 'request_quote',
      route: '/vendor/loan-request',
      cta: 'Request a loan',
      primary: false,
    },
  ];

  ngOnInit(): void {
    forkJoin({
      dashboard: this.vendors.dashboard(),
      certifications: this.certs.list().pipe(catchError(() => of([] as VendorCertification[]))),
      // Row-scoped by the API to this vendor's own loan requests.
      loans: this.leads.list({ per_page: 5 }).pipe(catchError(() => of({ items: [], meta: {} as never }))),
    }).subscribe({
      next: ({ dashboard, certifications, loans }) => {
        this.data.set(dashboard);
        this.certifications.set(certifications.filter((c) => c.status !== 'draft'));
        this.loanRequests.set(loans.items);
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Could not load your dashboard.');
        this.loading.set(false);
      },
    });
  }
}
