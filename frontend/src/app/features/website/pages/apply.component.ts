import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

/**
 * Public "Apply" entry point (header button, product pages, calculator).
 * Applying needs an account so the application always lands on the
 * customer's own dashboard: signed-in customers go straight to the portal
 * form, everyone else to sign-up — with the chosen product / amount / tenure
 * carried through so nothing has to be typed twice.
 */
@Component({
  selector: 'app-website-apply',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fw-section">
      <div class="fw-container narrow">
        <div class="fw-card box" role="status">
          <span class="material-icons">lock_open</span>
          <h1 class="fw-h2">Create a free account to apply</h1>
          <p class="fw-muted">Taking you to sign-up… If nothing happens, use the buttons below.</p>
          <div class="cta">
            <a class="fw-btn fw-btn--primary" routerLink="/register" [queryParams]="{ redirectTo: target }">Create account</a>
            <a class="fw-btn fw-btn--ghost" routerLink="/login" [queryParams]="{ redirectTo: target }">Log in</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .narrow { max-width: 560px; }
      .box { text-align: center; display: grid; gap: 8px; justify-items: center; }
      .box .material-icons { font-size: 44px; color: var(--fw-blue); }
      .cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
      .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteApplyComponent {
  private readonly router = inject(Router);

  /** /account/apply with whatever the visitor had already chosen. */
  protected readonly target: string;

  constructor() {
    const q = inject(ActivatedRoute).snapshot.queryParams;
    const keep = new URLSearchParams();
    for (const key of ['product', 'amount', 'years']) {
      if (q[key] !== undefined && q[key] !== '') keep.set(key, String(q[key]));
    }
    const qs = keep.toString();
    this.target = `/account/apply${qs ? `?${qs}` : ''}`;

    if (inject(AuthService).role() === 'customer') {
      void this.router.navigateByUrl(this.target, { replaceUrl: true });
    } else {
      void this.router.navigate(['/register'], { queryParams: { redirectTo: this.target }, replaceUrl: true });
    }
  }
}
