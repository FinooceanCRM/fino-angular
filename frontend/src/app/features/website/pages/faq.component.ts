import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CONTACT, FAQ_PAGE } from '../site-content.data';
import { WEBSITE } from '../website.config';
import { PageHeroComponent } from '../shared/page-hero.component';

/** FAQ — layout and wording follow images/08_FAQ.png. Answers are drafted (not in the design); see site-content.data.ts. */
@Component({
  selector: 'app-website-faq',
  standalone: true,
  imports: [RouterLink, PageHeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [crumbs]="[{ label: 'FAQ' }]" [title]="f.title" [text]="f.text" [script]="f.script" [checks]="f.checks">
      <form class="search" role="search" (submit)="$event.preventDefault()">
        <span class="material-icons">search</span>
        <input type="search" placeholder="Search your question here..." aria-label="Search questions" [value]="term()" (input)="term.set($any($event.target).value)" autocomplete="off" />
        <button type="submit">Search</button>
      </form>
    </app-page-hero>

    <div class="fw-container">
      <div class="cats" role="tablist" aria-label="Question categories">
        @for (c of f.categories; track c.key) {
          <button type="button" role="tab" [attr.aria-selected]="cat() === c.key" [class.on]="cat() === c.key" (click)="toggleCat(c.key)">
            <span class="material-icons">{{ c.icon }}</span>{{ c.label }}
          </button>
        }
      </div>

      <div class="cols">
        <section>
          <div class="head"><h2 class="fw-h2">Popular Questions</h2>@if (cat() || term()) { <button type="button" class="link" (click)="clear()">View All →</button> }</div>
          @for (q of shown(); track q.q) {
            <details class="q"><summary>{{ q.q }}</summary><p>{{ q.a }}</p></details>
          } @empty {
            <div class="fw-alert fw-alert--info">No question matches your search. <a routerLink="/contact">Ask us directly</a> and we’ll get back to you.</div>
          }
        </section>

        <aside>
          <div class="help">
            <div>
              <h3>{{ f.help.title }}</h3>
              <p>{{ f.help.text }}</p>
              <a class="row" [href]="site.phoneHref"><span class="material-icons">phone</span><span><b>Call Us</b>{{ site.phone }}<small>{{ site.hours.replace(' · ', ' ') }}</small></span></a>
              <a class="row" [href]="site.whatsappHref" target="_blank" rel="noopener"><span class="material-icons wa">chat</span><span><b>Chat on WhatsApp</b><small>{{ f.help.whatsapp }}</small></span></a>
              <a class="row" [href]="'mailto:' + site.email"><span class="material-icons">mail</span><span><b>Email Us</b>{{ site.email }}</span></a>
              <a class="row" [href]="maps"><span class="material-icons">place</span><span><b>Visit Us</b><small>{{ office }}</small></span></a>
            </div>
            <p class="script" aria-hidden="true">{{ f.help.script }}</p>
          </div>
          <div class="ask">
            <h3>{{ f.ask.title }}</h3><p>{{ f.ask.text }}</p>
            <a class="fw-btn fw-btn--primary" routerLink="/contact"><span class="material-icons">chat</span> {{ f.ask.cta }} <span class="material-icons">arrow_forward</span></a>
          </div>
        </aside>
      </div>

      <div class="strip">@for (s of f.strip; track s.title) { <div><span class="ic material-icons">{{ s.icon }}</span><span><b>{{ s.title }}</b><small>{{ s.text }}</small></span></div> }</div>
    </div>
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .material-icons { font-size: 22px; }
      .search { display: flex; align-items: center; background: #fff; border-radius: 8px; max-width: 480px; overflow: hidden; color: var(--fw-ink); }
      .search .material-icons { color: var(--fw-blue); margin: 0 6px 0 12px; } .search input { flex: 1; min-width: 0; border: 0; outline: 0; height: 44px; font: 400 0.88rem Poppins, sans-serif; }
      .search button { border: 0; background: var(--fw-blue); color: #fff; height: 44px; padding: 0 22px; font: 600 0.88rem Poppins, sans-serif; cursor: pointer; }
      .cats { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px; margin: -14px 0 22px; position: relative; z-index: 2; }
      .cats button { display: grid; justify-items: center; gap: 4px; padding: 12px 4px; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; font: 600 0.78rem Poppins, sans-serif; color: var(--fw-ink); cursor: pointer; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.08); text-align: center; }
      .cats button.on { background: var(--fw-blue); color: #fff; border-color: var(--fw-blue); } .cats .material-icons { color: var(--fw-blue); font-size: 28px; } .cats .on .material-icons { color: #fff; }
      .cols { display: grid; grid-template-columns: 1.15fr 1fr; gap: 24px; align-items: start; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; } .head h2 { margin: 0; } .link { background: none; border: 0; color: var(--fw-blue); font: 600 0.84rem Poppins, sans-serif; cursor: pointer; }
      .q { border: 1px solid var(--fw-line); border-radius: 8px; background: #fff; padding: 12px 16px; margin-bottom: 8px; } .q summary { cursor: pointer; font-size: 0.9rem; font-weight: 500; } .q p { margin: 10px 0 0; font-size: 0.85rem; color: var(--fw-muted); line-height: 1.6; }
      .help { background: linear-gradient(135deg, #eaf2ff, #dbe9ff); border-radius: 14px; padding: 20px; display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; } .help h3 { margin: 0 0 4px; font-size: 1.2rem; color: var(--fw-navy); } .help p { margin: 0 0 12px; font-size: 0.85rem; color: #3d4a5f; }
      .row { display: flex; gap: 10px; align-items: flex-start; text-decoration: none; font-size: 0.82rem; margin-bottom: 10px; } .row .material-icons { background: var(--fw-blue); color: #fff; border-radius: 50%; padding: 8px; font-size: 18px; flex: none; } .row .wa { background: #22c55e; } .row span:last-child { display: grid; line-height: 1.35; } .row small { color: #52607a; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.3rem !important; color: var(--fw-blue) !important; align-self: start; text-align: right; }
      .ask { background: var(--fw-blue-soft); border-radius: 14px; padding: 18px; margin-top: 14px; display: grid; gap: 6px; justify-items: start; } .ask h3 { margin: 0; color: var(--fw-navy); } .ask p { margin: 0 0 6px; font-size: 0.85rem; color: var(--fw-muted); } .ask .material-icons { font-size: 18px; }
      .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: var(--fw-blue-soft); border-radius: 12px; padding: 14px; margin: 24px 0; } .strip > div { display: flex; gap: 12px; align-items: center; } .strip span:last-child { display: grid; line-height: 1.3; } .strip small { color: var(--fw-muted); font-size: 0.74rem; } .ic { color: var(--fw-blue); font-size: 34px; }
      @media (max-width: 1000px) { .cats { grid-template-columns: repeat(4, 1fr); } .cols { grid-template-columns: 1fr; } }
      @media (max-width: 600px) { .help { grid-template-columns: 1fr; } .script { text-align: left; } .strip { grid-template-columns: 1fr 1fr; } .cats { margin-top: 12px; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteFaqComponent {
  protected readonly f = FAQ_PAGE;
  protected readonly site = WEBSITE;
  protected readonly office = CONTACT.headOffice;
  protected readonly maps = CONTACT.mapsUrl;

  protected readonly cat = signal('');
  protected readonly term = signal('');
  protected readonly shown = computed(() => {
    const t = this.term().trim().toLowerCase();
    return FAQ_PAGE.questions.filter((q) => (!this.cat() || q.cat === this.cat()) && (!t || q.q.toLowerCase().includes(t) || q.a.toLowerCase().includes(t)));
  });

  protected toggleCat(key: string): void {
    this.cat.set(this.cat() === key ? '' : key);
  }

  protected clear(): void {
    this.cat.set('');
    this.term.set('');
  }
}
