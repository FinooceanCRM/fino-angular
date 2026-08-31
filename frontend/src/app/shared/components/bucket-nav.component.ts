import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface BucketNavLink {
  label: string;
  route: string;
  /** Optional item count shown as a badge chip beside the label — omit when no real count is available (never fabricate one). */
  count?: number;
}

/**
 * Status-bucket navigation strip shown at the top of a workflow-stage page
 * (e.g. a lead's New/Assigned/Approved buckets), so the user can move
 * between stages without going back through the sidebar. Config-driven —
 * pass the ordered list of stage links via `links`. A link's `count`, when
 * provided, renders as a pill badge (Tidewater task-bucket-nav mock) —
 * callers that have no real per-bucket count simply omit it.
 */
@Component({
  selector: 'app-bucket-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bucket-nav" [attr.aria-label]="ariaLabel()">
      @for (link of links(); track link.route) {
        <a
          class="bucket-nav__link"
          [routerLink]="link.route"
          routerLinkActive="bucket-nav__link--active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          {{ link.label }}
          @if (link.count !== undefined) {
            <span class="bucket-nav__count">{{ link.count }}</span>
          }
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .bucket-nav {
        display: flex;
        flex-wrap: wrap;
        gap: var(--app-space-2);
        margin-bottom: var(--app-space-4);
      }
      .bucket-nav__link {
        display: inline-flex;
        align-items: center;
        gap: var(--app-space-2);
        padding: 6px 14px;
        border-radius: var(--app-radius-pill);
        border: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container);
        color: var(--app-status-default-fg);
        font-size: 0.8rem;
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
      }
      .bucket-nav__link:hover {
        background: var(--mat-sys-surface-container-high);
      }
      .bucket-nav__link--active {
        background: var(--mat-sys-primary-container);
        border-color: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container, var(--mat-sys-primary));
      }
      .bucket-nav__count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        padding: 1px 7px;
        border-radius: var(--app-radius-pill);
        font-size: 0.72rem;
        font-weight: 700;
        background: var(--mat-sys-surface-container-high);
        color: var(--app-status-default-fg);
      }
      .bucket-nav__link--active .bucket-nav__count {
        background: rgba(255, 255, 255, 0.35);
        color: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BucketNavComponent {
  readonly links = input.required<BucketNavLink[]>();
  readonly ariaLabel = input('Workflow stage');
}
