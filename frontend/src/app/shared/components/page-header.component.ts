import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header app-animate-in">
      @if (icon()) {
        <span class="page-header__icon">
          <mat-icon>{{ icon() }}</mat-icon>
        </span>
      }
      <span class="page-header__text">
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p>{{ subtitle() }}</p>
        }
      </span>
      <span class="page-header__actions">
        <ng-content select="[page-header-actions]" />
      </span>
    </header>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-3);
        margin-bottom: 1.5rem;
      }
      /* Optional icon badge — matches the coloured rounded-square icon shown
         beside every page title in the Tidewater mockups. Only renders when
         a page passes an [icon] input; existing callers are unaffected. */
      .page-header__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: var(--app-radius-sm);
        background: var(--tide-color-secondary);
        color: var(--tide-color-text-inverse);
      }
      .page-header__text {
        min-width: 0;
      }
      /* Optional inline action slot (e.g. "+ Add X") beside the title —
         see ModalComponent's [modal-actions] for the same named-projection
         convention. Empty and full-width-inert when unused, so existing
         callers that don't project anything here are unaffected. */
      .page-header__actions {
        display: flex;
        align-items: center;
        gap: var(--app-space-2);
        margin-left: auto;
        flex-shrink: 0;
      }
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--mat-sys-on-surface);
      }
      p {
        margin: 0.3rem 0 0;
        font-size: 0.95rem;
        color: var(--app-status-default-fg);
      }
    `,
  ],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  /** Optional Material icon name shown in a rounded-square badge beside the title. */
  readonly icon = input<string | undefined>(undefined);
}
