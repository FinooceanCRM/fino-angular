import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TESTIMONIALS } from '../site-content.data';
import { PageHeroComponent } from '../shared/page-hero.component';
import { HScrollDirective } from '../shared/h-scroll.directive';

/** Testimonials — layout and wording follow images/09_Testimonials.png. Quotes are business-supplied; confirm consent/approval before launch. */
@Component({
  selector: 'app-website-testimonials',
  standalone: true,
  imports: [HScrollDirective, RouterLink, PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [crumbs]="[{ label: 'Testimonials' }]" [title]="t.title" [sub]="t.sub" [text]="t.text" [script]="t.script">
      <a class="fw-btn fw-btn--primary" routerLink="/apply">Start Your Journey <span class="material-icons">arrow_forward</span></a>
      <div hero-aside class="stats">
        @for (s of t.heroStats; track s.label) { <div><span class="material-icons">{{ s.icon }}</span><span><b>{{ s.value }}</b><small>{{ s.label }}</small></span></div> }
      </div>
    </app-page-hero>

    <div class="fw-container">
      <div class="tabs" role="tablist" aria-label="Loan type">
        @for (x of t.tabs; track x.key) { <button type="button" role="tab" [attr.aria-selected]="cat() === x.key" [class.on]="cat() === x.key" (click)="cat.set(x.key)">{{ x.label }}</button> }
      </div>

      @if (stories().length) {
        <h2 class="fw-h2">Success Stories</h2>
        <div class="stories m-hscroll" appHScroll style="--m-card-w: 78%">
          @for (s of stories(); track s.title) {
            <article class="story"><span class="av" aria-hidden="true">{{ initials(s.name) }}</span><div><strong>{{ s.title }}</strong><span class="who">{{ s.name }}</span><small>{{ s.place }}</small></div></article>
          }
          <div class="share"><p class="script" aria-hidden="true">Real People Real Stories</p><a class="fw-btn fw-btn--primary fw-btn--sm" routerLink="/contact">Share Your Story <span class="material-icons">arrow_forward</span></a></div>
        </div>
      }

      <h2 class="fw-h2">Customer Reviews</h2>
      @if (reviews().length) {
        <div class="reviews m-hscroll" appHScroll style="--m-card-w: 82%">
          @for (r of reviews(); track r.name) {
            <article class="rev">
              <header><span class="av" aria-hidden="true">{{ initials(r.name) }}</span><div><strong>{{ r.name }}</strong><span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span></div></header>
              <p>“{{ r.text }}”</p><small>{{ r.place }}</small>
            </article>
          }
        </div>
      } @else {
        <div class="fw-alert fw-alert--info">No reviews to show for this loan type yet. <button type="button" class="link" (click)="cat.set('all')">View all testimonials</button></div>
      }

      <div class="strip">@for (s of t.strip; track s.label) { <div><span class="ic material-icons">{{ s.icon }}</span><span><b>{{ s.value }}</b><small>{{ s.label }}</small></span></div> }</div>
    </div>

    <section class="band">
      <div class="fw-container band__inner">
        <div><h2>{{ t.band.title }}</h2><p>{{ t.band.text }}</p></div>
        <a class="fw-btn fw-btn--light" routerLink="/apply">{{ t.band.cta }} <span class="material-icons">arrow_forward</span></a>
        <ul class="feats">@for (f of t.band.feats; track f) { <li>{{ f }}</li> }</ul>
      </div>
    </section>
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .fw-btn--light { color: var(--fw-navy); } .material-icons { font-size: 22px; }
      .stats { background: rgba(255, 255, 255, 0.96); color: var(--fw-ink); border-radius: 12px; padding: 14px 18px; display: grid; gap: 12px; min-width: 260px; } .stats > div { display: flex; gap: 12px; align-items: center; } .stats .material-icons { color: var(--fw-blue); font-size: 32px; } .stats span:last-child { display: grid; line-height: 1.25; } .stats b { font-size: 1.05rem; } .stats small { color: var(--fw-muted); }
      .tabs { display: flex; gap: 8px; margin: -16px 0 22px; position: relative; z-index: 2; overflow-x: auto; padding: 4px 2px 8px; }
      .tabs button { flex: 1 0 auto; padding: 12px 16px; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; font: 600 0.8rem Poppins, sans-serif; color: var(--fw-ink); cursor: pointer; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.08); white-space: nowrap; } .tabs button.on { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; }
      h2 { margin: 0 0 12px; }
      .stories { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 26px; }
      .story { display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; padding: 14px; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); } .story div { display: grid; gap: 2px; } .story strong { font-size: 0.9rem; } .who { font-size: 0.82rem; font-weight: 600; color: var(--fw-navy); } .story small { color: var(--fw-muted); }
      .av { width: 44px; height: 44px; flex: none; border-radius: 50%; background: linear-gradient(135deg, #1c6df0, #0a3a8a); color: #fff; display: grid; place-items: center; font-weight: 600; }
      .share { background: linear-gradient(135deg, #e6f1ff, #cfe2ff); border-radius: 12px; padding: 16px; display: grid; gap: 10px; align-content: center; justify-items: start; } .script { font-family: Lora, serif; font-style: italic; font-size: 1.35rem; line-height: 1.25; color: var(--fw-navy); margin: 0; }
      .reviews { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-bottom: 22px; }
      .rev { background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; padding: 16px; display: grid; gap: 8px; align-content: start; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); } .rev header { display: flex; gap: 10px; align-items: center; } .rev header div { display: grid; } .stars { color: #f59e0b; letter-spacing: 2px; font-size: 0.9rem; }
      .rev p { margin: 0; font-size: 0.85rem; line-height: 1.6; color: #3d4a5f; } .rev small { color: var(--fw-muted); }
      .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 8px 0 24px; } .strip > div { display: flex; gap: 12px; align-items: center; } .strip span:last-child { display: grid; line-height: 1.25; } .strip b { font-size: 1.15rem; color: var(--fw-navy); } .strip small { color: var(--fw-muted); } .ic { color: var(--fw-blue); font-size: 40px; }
      .band { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 24px 0; } .band__inner { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; } .band h2 { margin: 0 0 4px; font-size: 1.25rem; } .band p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      .feats { display: flex; gap: 22px; list-style: none; margin: 0; padding: 0; font-size: 0.82rem; color: #cfe0ff; }
      .link { background: none; border: 0; color: var(--fw-blue); text-decoration: underline; cursor: pointer; font: inherit; }
      @media (max-width: 640px) { .strip { grid-template-columns: 1fr 1fr; } .stats { min-width: 0; width: 100%; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteTestimonialsComponent {
  protected readonly t = TESTIMONIALS;
  protected readonly cat = signal('all');

  protected readonly stories = computed(() => TESTIMONIALS.stories.filter((s) => this.cat() === 'all' || s.cat === this.cat()));
  protected readonly reviews = computed(() => TESTIMONIALS.reviews.filter((r) => this.cat() === 'all' || r.cat === this.cat()));

  protected initials(name: string): string {
    return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
