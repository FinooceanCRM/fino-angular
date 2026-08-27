import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LeadReferralLink, LeadReferralService } from '@core/services/lead-referral.service';

/**
 * "Your lead link" card — a personal, shareable lead-capture link. Anyone
 * who submits a lead through it lands in this user's "My Submitted Leads"
 * page. Drop into any Manager/RM/Employee/Connector/Banker dashboard.
 */
@Component({
  selector: 'app-lead-link-card',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="lead-link-card">
      <mat-card-header>
        <mat-card-title>Your lead link</mat-card-title>
        <mat-card-subtitle>
          Share this link with anyone — leads submitted through it land directly in your "My Submitted
          Leads" list.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content class="lead-link-card__content">
        @if (link(); as data) {
          <div class="lead-link-card__row">
            <span class="lead-link-card__label">Referral code</span>
            <code>{{ data.code }}</code>
          </div>
          <div class="lead-link-card__row">
            <span class="lead-link-card__label">Lead link</span>
            <code class="lead-link-card__link">{{ data.link }}</code>
            <button
              mat-icon-button
              type="button"
              matTooltip="Copy link"
              aria-label="Copy lead link"
              (click)="copyLink(data.link)"
            >
              <mat-icon>content_copy</mat-icon>
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .lead-link-card__content {
        display: flex;
        flex-direction: column;
        gap: var(--app-space-2, 8px);
      }

      .lead-link-card__row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--app-space-2, 8px);

        code {
          padding: 0.25rem 0.6rem;
          border-radius: var(--app-radius-sm, 8px);
          background: var(--mat-sys-surface-container);
          font-size: 0.85rem;
        }
      }

      .lead-link-card__label {
        min-width: 100px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--app-status-default-fg);
      }

      .lead-link-card__link {
        overflow-wrap: anywhere;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadLinkCardComponent implements OnInit {
  private readonly leadReferral = inject(LeadReferralService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly link = signal<LeadReferralLink | null>(null);

  ngOnInit(): void {
    this.leadReferral.get().subscribe({
      next: (data) => this.link.set(data),
      error: () => this.link.set(null),
    });
  }

  protected copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open('Lead link copied to clipboard.', 'Dismiss', { duration: 3000 });
    });
  }
}
