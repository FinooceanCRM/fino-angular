import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

/** Dark hero used by the inner pages: breadcrumb, two-tone title, text, handwriting line, optional checklist. */
@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" [style.background-image]="bg() ? 'linear-gradient(100deg, rgba(6, 26, 61, 0.94) 0%, rgba(10, 47, 102, 0.82) 55%, rgba(13, 74, 154, 0.45) 100%), url(&quot;' + bg() + '&quot;)' : null">
      <div class="fw-container hero__inner">
        <div class="hero__copy">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a [routerLink]="inPortal ? '/account' : '/'">{{ inPortal ? 'Dashboard' : 'Home' }}</a>
            @for (c of crumbs(); track c.label) {
              <span aria-hidden="true">›</span>
              @if (c.link) { <a [routerLink]="c.link">{{ c.label }}</a> } @else { <span aria-current="page">{{ c.label }}</span> }
            }
          </nav>
          <h1>{{ title()[0] }}@if (title()[1]) { <br /><span>{{ title()[1] }}</span> }</h1>
          @if (sub()) { <h2>{{ sub() }}</h2> }
          @if (text()) { <p>{{ text() }}</p> }
          <ng-content />
        </div>
        <div class="hero__aside">
          @if (script()) { <p class="script" aria-hidden="true">{{ script() }}</p> }
          @if (checks().length) {
            <ul class="checks">@for (c of checks(); track c) { <li><span class="material-icons">check_circle</span>{{ c }}</li> }</ul>
          }
          <ng-content select="[hero-aside]" />
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); background-size: cover; background-position: center; color: #fff; padding: 22px 0 36px; position: relative; overflow: hidden; }
      .hero::after { content: ''; position: absolute; right: -8%; top: -40%; width: 55%; height: 170%; background: radial-gradient(closest-side, rgba(77, 163, 255, 0.3), transparent 70%); pointer-events: none; }
      .hero__inner { position: relative; z-index: 1; display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; align-items: center; }
      .crumbs { display: flex; gap: 8px; font-size: 0.76rem; color: #cfe0ff; margin-bottom: 14px; flex-wrap: wrap; } .crumbs a { color: inherit; text-decoration: none; } .crumbs a:hover { text-decoration: underline; }
      h1 { font-size: clamp(2.1rem, 4.6vw, 3.3rem); line-height: 1.06; margin: 0 0 8px; font-weight: 700; } h1 span { color: #4dc4ff; }
      h2 { font-size: clamp(1.05rem, 1.9vw, 1.4rem); margin: 0 0 8px; font-weight: 500; line-height: 1.3; }
      p { font-size: 0.92rem; line-height: 1.6; color: #dbe8ff; margin: 0 0 16px; max-width: 520px; }
      .hero__aside { display: grid; gap: 14px; justify-items: start; align-content: center; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.5rem; line-height: 1.25; color: #e6f0ff; margin: 0; max-width: 220px; }
      .checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: 1.05rem; } .checks .material-icons { color: #22c55e; margin-right: 10px; vertical-align: -5px; }
      .material-icons { font-size: 22px; }
      @media (max-width: 860px) { .hero__inner { grid-template-columns: 1fr; } .script { max-width: none; } }
      /* Phones: a shorter banner - tighter spacing, smaller type and the tick-list as a 2 x 2 grid. */
      @media (max-width: 600px) {
        .hero { padding: 14px 0 20px; }
        .hero__inner { gap: 12px; }
        .crumbs { margin-bottom: 8px; }
        h1 { font-size: 1.85rem; margin-bottom: 4px; }
        h2 { font-size: 1rem; margin-bottom: 6px; }
        p { font-size: 0.84rem; line-height: 1.5; margin-bottom: 0; }
        .hero__aside { gap: 10px; }
        .script { font-size: 1.1rem; line-height: 1.2; }
        .checks { grid-template-columns: 1fr 1fr; gap: 6px 10px; font-size: 0.82rem; }
        .checks .material-icons { font-size: 18px; margin-right: 5px; vertical-align: -4px; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class PageHeroComponent {
  /** Inside the customer dashboard (/account) links stay in the dashboard instead of going to the public site. */
  protected readonly inPortal = inject(Router).url.startsWith('/account');
  readonly crumbs = input<{ label: string; link?: string }[]>([]);
  readonly title = input.required<string[]>();
  readonly sub = input('');
  readonly text = input('');
  readonly script = input('');
  readonly checks = input<string[]>([]);
  /** Optional background photo, laid under a navy overlay so the text stays readable. */
  readonly bg = input('');
}
