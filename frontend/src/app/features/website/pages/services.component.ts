import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { PRODUCT_PAGES, SERVICES_PAGE } from '../product-pages.data';
import { loanSquare } from '../loan-images';
import { searchProducts } from '../loan-search';
import { HScrollDirective } from '../shared/h-scroll.directive';

/** Services overview — wording and cards follow images/03_Services/01_All_Services.png. */
@Component({
  selector: 'app-website-services',
  standalone: true,
  imports: [HScrollDirective, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="fw-container hero__inner">
        <div>
          <h1>{{ page.heroTitle[0] }} <span>{{ page.heroTitle[1] }}</span></h1>
          <h2>{{ page.heroSub }}</h2>
          <p>{{ page.heroText }}</p>
          <ul class="feats">
            @for (f of page.heroFeatures; track f.label) { <li><span class="feats__ic material-icons">{{ f.icon }}</span>{{ f.label }}</li> }
          </ul>
        </div>
        <p class="script" aria-hidden="true">{{ page.heroScript }}</p>
      </div>
    </section>

    <section class="fw-section choose">
      <div class="fw-container">
        <div class="choose__head">
          <div>
            <span class="label">{{ page.eyebrow }} <i></i></span>
            <h2 class="fw-h2 big">{{ page.heading[0] }}<span>{{ page.heading[1] }}</span>{{ page.heading[2] }}</h2>
            <p class="fw-muted">{{ page.sub }}</p>
          </div>
          <form class="search" role="search" (submit)="search($event, box.value)">
            <input #box type="search" placeholder="Search loan services..." aria-label="Search loan services" [value]="q()" autocomplete="off" (input)="live(box.value)" />
            <button type="submit" aria-label="Search"><span class="material-icons">search</span></button>
          </form>
        </div>

        @if (q()) {
          <p class="fw-muted found" role="status">{{ items().length }} result{{ items().length === 1 ? '' : 's' }} for “{{ q() }}” · <a routerLink="/services">Show all</a></p>
        }
        @if (items().length === 0) {
          <div class="fw-alert fw-alert--info">No loan service matches “{{ q() }}”. Try “home”, “business” or “education”, or <a routerLink="/services">view all services</a>.</div>
        }

        <div class="cards m-hscroll" appHScroll style="--m-card-w: 44%">
          @for (p of items(); track p.slug) {
            <a class="card" [routerLink]="['/services', p.slug]">
              <span class="card__ic">@if (img(p.slug); as src) { <img [src]="src" [alt]="p.name" width="56" height="56" /> } @else { <span class="material-icons">{{ p.icon }}</span> }</span>
              <strong>{{ p.name }}</strong>
              <span class="card__t">{{ p.cardText }}</span>
              <span class="card__go">Know More <span class="material-icons">arrow_forward</span></span>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="fw-container proc">
      <div class="proc__steps">
        <h2 class="fw-h2">{{ page.processTitle }}</h2>
        <p class="fw-muted">{{ page.processSub }}</p>
        <ol>
          @for (s of page.process; track s.title; let i = $index) {
            <li><span class="n">{{ i + 1 }}</span><div><strong>{{ s.title }}</strong><span>{{ s.text }}</span></div></li>
          }
        </ol>
      </div>
      <div class="proc__help">
        <h2>{{ page.helpTitle[0] }}<br />{{ page.helpTitle[1] }}</h2>
        <p>{{ page.helpText }}</p>
        <a class="fw-btn fw-btn--light fw-btn--sm" routerLink="/contact">Talk to an Expert <span class="material-icons">arrow_forward</span></a>
      </div>
    </section>

    <section class="band">
      <div class="fw-container band__inner">
        <div><h2>{{ page.band.title }}</h2><p>{{ page.band.text }}</p></div>
        <a class="fw-btn fw-btn--primary" routerLink="/apply">{{ page.band.cta }} <span class="material-icons">arrow_forward</span></a>
      </div>
    </section>
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .fw-btn--light { color: var(--fw-navy); }
      .material-icons { font-size: 20px; }
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 55%, #0d4a9a 100%); color: #fff; padding: 44px 0 40px; position: relative; overflow: hidden; }
      .hero::after { content: ''; position: absolute; right: -8%; top: -30%; width: 55%; height: 160%; background: radial-gradient(closest-side, rgba(77, 163, 255, 0.3), transparent 70%); pointer-events: none; }
      .hero__inner { position: relative; z-index: 1; display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
      .hero h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); line-height: 1.05; margin: 0 0 8px; font-weight: 700; } .hero h1 span { color: #4dc4ff; }
      .hero h2 { font-size: clamp(1.15rem, 2vw, 1.5rem); margin: 0 0 8px; font-weight: 600; }
      .hero p { max-width: 520px; line-height: 1.6; color: #dbe8ff; margin: 0 0 18px; font-size: 0.92rem; }
      .feats { display: flex; gap: 8px 24px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; font-size: 0.85rem; }
      .feats li { display: flex; align-items: center; gap: 8px; }
      .feats__ic { width: 34px; height: 34px; border: 1.5px solid #4da3ff; border-radius: 50%; display: grid; place-items: center; font-size: 18px; color: #7db4ff; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.6rem; line-height: 1.25; color: #e6f0ff; max-width: 190px; margin: 4px 24px 0 0; text-align: right; }
      .label { display: inline-flex; align-items: center; gap: 10px; font-size: 0.72rem; font-weight: 600; letter-spacing: 1px; color: var(--fw-navy); }
      .label i { width: 28px; height: 2px; background: var(--fw-blue); display: inline-block; }
      .choose { padding-bottom: 20px; }
      .choose__head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
      .big { margin: 6px 0; font-size: clamp(1.5rem, 2.8vw, 2rem); color: var(--fw-navy); } .big span { color: var(--fw-blue); }
      .choose__head p { margin: 0; font-size: 0.88rem; }
      .search { display: flex; width: 100%; max-width: 330px; border: 1.5px solid var(--fw-line-strong); border-radius: 8px; overflow: hidden; background: #fff; }
      .search input { flex: 1; min-width: 0; border: 0; outline: 0; padding: 0 12px; height: 40px; font: 400 0.85rem Poppins, sans-serif; }
      .search button { border: 0; background: var(--fw-blue); color: #fff; width: 44px; cursor: pointer; }
      .found { margin: 0 0 12px; }
      .cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
      .card { display: grid; gap: 6px; align-content: start; padding: 16px; background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; text-decoration: none; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s; min-height: 150px; }
      .card:hover { box-shadow: 0 12px 28px rgba(16, 33, 58, 0.14); transform: translateY(-2px); border-color: var(--fw-blue); }
      .card__ic img { width: 56px; height: 56px; object-fit: contain; border-radius: 12px; }
      .card__ic { width: 56px; height: 56px; border-radius: 12px; background: var(--fw-blue-soft); color: var(--fw-blue); display: grid; place-items: center; font-size: 26px; }
      .card strong { font-size: 0.92rem; color: var(--fw-ink); } .card__t { font-size: 0.78rem; color: var(--fw-muted); line-height: 1.4; }
      .card__go { margin-top: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 600; color: var(--fw-blue); } .card__go .material-icons { font-size: 15px; }
      .proc { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; padding-bottom: 28px; }
      .proc__steps { background: var(--fw-blue-soft); border-radius: 14px; padding: 20px; } .proc__steps p { margin: 0 0 12px; font-size: 0.86rem; }
      .proc ol { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .proc li { display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 10px; padding: 10px; }
      .n { width: 32px; height: 32px; flex: none; border-radius: 50%; background: var(--fw-blue); color: #fff; display: grid; place-items: center; font-weight: 700; }
      .proc li div { display: grid; line-height: 1.3; } .proc strong { font-size: 0.82rem; } .proc li span:not(.n) { font-size: 0.72rem; color: var(--fw-muted); }
      .proc__help { background: #072452; color: #fff; border-radius: 14px; padding: 22px; display: grid; gap: 10px; align-content: center; justify-items: start; }
      .proc__help h2 { margin: 0; font-size: 1.15rem; line-height: 1.3; } .proc__help p { margin: 0; font-size: 0.85rem; color: #cfe0ff; }
      .band { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 24px 0; }
      .band__inner { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; }
      .band h2 { margin: 0 0 4px; font-size: 1.25rem; } .band p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      @media (max-width: 1100px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } .proc { grid-template-columns: 1fr; } }
      @media (max-width: 760px) { .script { display: none; } .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } .proc ol { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 420px) { .cards { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteServicesComponent {
  protected img(slug: string): string | null {
    return loanSquare(slug);
  }

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly page = SERVICES_PAGE;

  /** Search term (?q=) — shared with the header search box. */
  protected readonly q = toSignal(this.route.queryParamMap.pipe(map((p) => (p.get('q') ?? '').trim())), { initialValue: '' });
  protected readonly all = signal(PRODUCT_PAGES);
  protected readonly items = computed(() => {
    return searchProducts(this.q(), this.all());
  });

  /** Filters as the user types (no reload); clearing the box shows every service again. */
  protected live(term: string): void {
    const q = term.trim();
    void this.router.navigate(['/services'], { queryParams: q ? { q } : {}, replaceUrl: true });
  }

  protected search(event: Event, term: string): void {
    event.preventDefault();
    const q = term.trim();
    void this.router.navigate(['/services'], { queryParams: q ? { q } : {} });
  }
}
