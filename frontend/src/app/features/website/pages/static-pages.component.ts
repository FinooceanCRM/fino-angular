import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WEBSITE } from '../website.config';

const BANNER = `
  .banner { background: linear-gradient(135deg, #061f45, var(--fw-navy-2)); color: #fff; padding: 44px 0; }
  .banner .fw-eyebrow { color: #8fb7ff; } .light { color: #d5e3fb; margin: 0; }
  .narrow { max-width: 820px; }
  a { color: var(--fw-blue); }
  .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; }
`;

@Component({
  selector: 'app-website-terms',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="banner"><div class="fw-container"><span class="fw-eyebrow">Legal</span><h1 class="fw-h1">Terms &amp; Conditions</h1></div></section>
    <section class="fw-section">
      <div class="fw-container narrow">
        <div class="fw-alert fw-alert--warn">Draft wording for the business and legal team to review and replace before launch.</div>
        <h2 class="fw-h3">1. Our role</h2>
        <p class="fw-muted">{{ site.legalName }} (“{{ site.brand }}”) facilitates loan applications between customers and lending partners. We are not a lender.</p>
        <h2 class="fw-h3">2. No guarantee of approval</h2>
        <p class="fw-muted">Eligibility results, EMI figures and any indicative amounts shown on this website are estimates. Approval, rates, charges and terms are decided solely by the lender.</p>
        <h2 class="fw-h3">3. Your information</h2>
        <p class="fw-muted">You agree the information you submit is accurate. We use it as described in our <a routerLink="/privacy-policy">Privacy Policy</a>.</p>
        <h2 class="fw-h3">4. Your account</h2>
        <p class="fw-muted">You are responsible for keeping your login details confidential and for activity under your account.</p>
      </div>
    </section>
  `,
  styles: [BANNER, `h2 { margin-top: 22px; }`],
  styleUrl: '../website-ui.scss',
})
export class WebsiteTermsComponent {
  protected readonly site = WEBSITE;
}
