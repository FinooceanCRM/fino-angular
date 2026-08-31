import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Avatar-initials + name + "{role} · {meta}" subtitle row shown at the top
 * of a self-service profile card (Tidewater mockup 12-profile). Purely
 * presentational — every role's profile page supplies its own name/subtitle
 * from its own real profile data; this component fabricates nothing.
 *
 * Visually mirrors `EntityHeaderComponent`'s avatar treatment (same
 * primary-container tint) but is sized and spaced for sitting inside a
 * profile card above a field grid, rather than as a full page header.
 */
@Component({
  selector: 'app-profile-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile-header">
      <span class="profile-header__avatar">{{ initials() }}</span>
      <div class="profile-header__text">
        <h3 class="profile-header__name">{{ name() || '—' }}</h3>
        @if (subtitle()) {
          <p class="profile-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--app-space-4);
        margin-bottom: var(--app-space-5);
        padding-bottom: var(--app-space-4);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      .profile-header__avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-primary);
        font-size: 1.35rem;
        font-weight: 700;
      }
      .profile-header__text {
        min-width: 0;
      }
      .profile-header__name {
        margin: 0;
        font-family: var(--tide-font-display);
        font-size: 1.3rem;
        font-weight: 600;
        line-height: 1.25;
        color: var(--mat-sys-on-surface);
      }
      .profile-header__subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
        color: var(--app-status-default-fg);
      }
    `,
  ],
})
export class ProfileHeaderComponent {
  readonly name = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);

  protected readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  });
}
