import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { VendorCertification } from '@core/models/vendor-certification.model';
import { VendorCertificationService } from '@core/services/vendor-certification.service';

/**
 * Post-submit success screen — the Fino equivalent of the source app's
 * success popup (`#success-modal` in pages/survey.php). Shows the new
 * certificate number and the clear "Download Certification" action.
 */
@Component({
  selector: 'app-vendor-certification-success',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @if (cert(); as c) {
      <mat-card class="vcs app-animate-in" appearance="outlined">
        <mat-card-content>
          <span class="vcs__ring"><mat-icon>check</mat-icon></span>
          <h1>Vendor Certification submitted</h1>
          <p>Your certification has been generated and is ready to download.</p>
          <p class="vcs__number">{{ c.certificate_number }}</p>
        </mat-card-content>
        <mat-card-actions class="vcs__actions">
          <a
            mat-flat-button
            color="primary"
            class="tide-cta-pill"
            [routerLink]="['/vendor/certificate', c.id]"
            [queryParams]="{ download: 1 }"
          >
            <mat-icon>download</mat-icon> Download Certification
          </a>
          <a mat-stroked-button [routerLink]="['/vendor/certificate', c.id]">
            <mat-icon>visibility</mat-icon> View certificate
          </a>
          <a mat-stroked-button routerLink="/vendor/dashboard">
            <mat-icon>home</mat-icon> Back to dashboard
          </a>
        </mat-card-actions>
      </mat-card>
    }
    @if (error(); as message) {
      <p class="vcs__error" role="alert">{{ message }}</p>
    }
  `,
  styles: [
    `
      .vcs {
        max-width: 520px;
        margin: 0 auto;
        text-align: center;
      }
      .vcs__ring {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--tide-color-success, #12a058);
        color: #fff;
        margin-bottom: var(--app-space-3);
      }
      .vcs__ring mat-icon {
        font-size: 34px;
        width: 34px;
        height: 34px;
      }
      .vcs h1 {
        margin: 0 0 var(--app-space-1);
        font-size: 1.3rem;
        font-weight: 700;
      }
      .vcs p {
        margin: 0;
        color: var(--tide-color-text-secondary);
      }
      .vcs__number {
        margin-top: var(--app-space-2) !important;
        font-size: 1.4rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--tide-color-text-primary) !important;
      }
      .vcs__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2);
        justify-content: center;
        padding: var(--app-space-3);
      }
      .vcs__error {
        color: var(--tide-color-error);
        text-align: center;
      }
    `,
  ],
})
export class VendorCertificationSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly certs = inject(VendorCertificationService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cert = signal<VendorCertification | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.certs.get(id).subscribe({
      next: (c) => {
        this.cert.set(c);
        this.loading.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Could not load the certification.');
        this.loading.set(false);
      },
    });
  }
}
