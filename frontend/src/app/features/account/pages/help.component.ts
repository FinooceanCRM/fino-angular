import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FAQS, WEBSITE } from '../../website/website.config';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

/** Support: contact channels + FAQs. Ticketing is not built (no backend); see docs. */
@Component({
  selector: 'app-account-help',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [withBack]="true" />
    <h1 class="fw-h2">Support</h1>
    <p class="fw-muted">Talk to a FINOOCEAN advisor about your application.</p>
    <div class="fw-grid fw-grid--3">
      <div class="fw-card"><span class="material-icons ic">phone_in_talk</span><h2 class="fw-h3">Call us</h2><a [href]="site.phoneHref">{{ site.phone }}</a><p class="fw-small fw-muted">{{ site.hours }}</p></div>
      <div class="fw-card"><span class="material-icons ic">mail_outline</span><h2 class="fw-h3">Email</h2><a [href]="'mailto:' + site.email">{{ site.email }}</a></div>
      <div class="fw-card"><span class="material-icons ic">chat</span><h2 class="fw-h3">WhatsApp</h2><a [href]="site.whatsappHref" target="_blank" rel="noopener">Chat with us</a></div>
    </div>
    <h2 class="fw-h2 gap">Frequently asked questions</h2>
    @for (f of faqs; track f.q) { <details class="faq"><summary>{{ f.q }}</summary><p>{{ f.a }}</p></details> }
    <a routerLink="/account/help" class="more">Visit the contact page →</a>
  `,
  styles: [
    `
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; } .crumbs a { color: inherit; text-decoration: none; } .crumbs a:hover { text-decoration: underline; }
      .ic { color: var(--fw-blue); font-size: 28px; } a { color: var(--fw-blue); } .gap { margin-top: 26px; }
      .faq { border: 1px solid var(--fw-line); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; background: #fff; }
      .faq summary { cursor: pointer; font-weight: 600; } .faq p { margin: 10px 0 0; color: var(--fw-muted); line-height: 1.6; }
      .more { font-weight: 600; text-decoration: none; }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class AccountHelpComponent {
  protected readonly site = WEBSITE;
  protected readonly faqs = FAQS.slice(0, 5);
}
