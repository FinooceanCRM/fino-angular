import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG, BlogPost } from '../site-content.data';
import { BLOG_BANNERS, blogImage, blogThumb } from '../loan-images';
import { BandComponent } from '../shared/band.component';
import { NewsletterFormComponent } from '../shared/newsletter-form.component';
import { PageHeroComponent } from '../shared/page-hero.component';
import { HScrollDirective } from '../shared/h-scroll.directive';

/** News & Blog list — layout and wording follow images/10_Blog/01_Blog_List.png. */
@Component({
  selector: 'app-website-blog',
  standalone: true,
  imports: [HScrollDirective, RouterLink, PageHeroComponent, BandComponent, NewsletterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-hero [bg]="banner" [crumbs]="[{ label: 'News & Blog' }]" [title]="[b.title]" [sub]="b.sub" [text]="b.text" [script]="b.scripts[0]">
      <p hero-aside class="script2" aria-hidden="true">{{ b.scripts[1] }}</p>
    </app-page-hero>

    <div class="fw-container">
      <div class="tabs" role="tablist" aria-label="Categories">
        @for (t of b.tabs; track t.key) { <button type="button" role="tab" [attr.aria-selected]="cat() === t.key" [class.on]="cat() === t.key" (click)="cat.set(t.key)">{{ t.label }}</button> }
      </div>

      <div class="cols">
        <section>
          @if (posts().length === 0) { <div class="fw-alert fw-alert--info">No articles match your search. <button class="link" type="button" (click)="reset()">Show all posts</button></div> }
          <div class="grid m-hscroll" appHScroll style="--m-card-w: 80%">
            @for (p of posts(); track p.slug) {
              <article class="post">
                <a class="post__img" [routerLink]="['/blog', p.slug]" [attr.aria-label]="p.title">@if (image(p.slug); as src) { <img [src]="src" alt="" /> } @else { <span class="material-icons">{{ p.icon }}</span> }<span class="tag">{{ p.category }}</span></a>
                <div class="post__b">
                  <span class="date"><span class="material-icons">calendar_today</span>{{ p.date }}</span>
                  <h3><a [routerLink]="['/blog', p.slug]">{{ p.title }}</a></h3>
                  <p>{{ p.summary }}</p>
                  <a class="rm" [routerLink]="['/blog', p.slug]">Read More <span class="material-icons">arrow_forward</span></a>
                </div>
              </article>
            }
          </div>
        </section>

        <aside>
          <form class="search" role="search" (submit)="$event.preventDefault()">
            <span class="material-icons">search</span>
            <input type="search" placeholder="Search articles, topics..." aria-label="Search articles" [value]="term()" (input)="term.set($any($event.target).value)" autocomplete="off" />
          </form>
          <div class="box">
            <h3>Popular Posts</h3>
            @for (p of popular(); track p.slug) {
              <a class="pop" [routerLink]="['/blog', p.slug]"><span class="thumb">@if (thumb(p.slug); as src) { <img [src]="src" alt="" /> } @else { <span class="material-icons">{{ p.icon }}</span> }</span><span><b>{{ p.title }}</b><small>{{ p.date }}</small></span></a>
            }
          </div>
          <div class="box nl"><h3><span class="material-icons">mail</span> {{ b.newsletter.title }}</h3><p>{{ b.newsletter.text }}</p><app-newsletter-form /></div>
          <div class="box"><h3>Related Services</h3><div class="rel">@for (r of b.related; track r.label) { <a [routerLink]="r.link">{{ r.label }} <span class="material-icons">arrow_forward</span></a> }</div></div>
        </aside>
      </div>
    </div>

    <app-band [title]="b.band.title" [text]="b.band.text" [cta]="b.band.cta" link="/services" />
  `,
  styles: [
    `
      a { color: inherit; } .material-icons { font-size: 20px; }
      .script2 { font-family: Lora, serif; font-style: italic; font-size: 1.5rem; color: #e6f0ff; margin: 0; max-width: 220px; }
      .tabs { display: flex; gap: 8px; margin: -16px 0 20px; position: relative; z-index: 2; overflow-x: auto; padding: 4px 2px 8px; }
      .tabs button { flex: 1 0 auto; padding: 12px 18px; background: #fff; border: 1px solid var(--fw-line); border-radius: 10px; font: 600 0.8rem Poppins, sans-serif; color: var(--fw-ink); cursor: pointer; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.08); white-space: nowrap; } .tabs button.on { background: var(--fw-blue); border-color: var(--fw-blue); color: #fff; }
      .cols { display: grid; grid-template-columns: 1fr 290px; gap: 22px; align-items: start; margin-bottom: 26px; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .post { background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); display: grid; align-content: start; }
      .post__img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .post__img { position: relative; overflow: hidden; height: 150px; background: linear-gradient(135deg, #0a3a8a, #4da3ff); display: grid; place-items: center; text-decoration: none; } .post__img > .material-icons { font-size: 56px; color: rgba(255, 255, 255, 0.85); }
      .tag { position: absolute; left: 10px; bottom: 10px; background: #16a34a; color: #fff; font-size: 0.68rem; font-weight: 600; padding: 3px 9px; border-radius: 4px; }
      .post__b { padding: 14px; display: grid; gap: 6px; } .date { display: flex; gap: 6px; align-items: center; font-size: 0.74rem; color: var(--fw-muted); } .date .material-icons { font-size: 14px; }
      .post h3 { margin: 0; font-size: 1rem; line-height: 1.3; color: var(--fw-navy); } .post h3 a { text-decoration: none; } .post p { margin: 0; font-size: 0.8rem; color: var(--fw-muted); line-height: 1.55; }
      .rm { display: inline-flex; gap: 4px; align-items: center; color: var(--fw-blue); font-size: 0.8rem; font-weight: 600; text-decoration: none; } .rm .material-icons { font-size: 15px; }
      .search { display: flex; align-items: center; border: 1.5px solid var(--fw-line-strong); border-radius: 8px; background: #fff; margin-bottom: 14px; } .search .material-icons { margin: 0 6px 0 10px; color: var(--fw-muted); } .search input { flex: 1; min-width: 0; border: 0; outline: 0; height: 40px; font: 400 0.84rem Poppins, sans-serif; background: transparent; }
      .box { background: var(--fw-blue-soft); border-radius: 12px; padding: 16px; margin-bottom: 14px; } .box h3 { margin: 0 0 10px; font-size: 1rem; color: var(--fw-navy); display: flex; gap: 6px; align-items: center; } .box p { margin: 0 0 10px; font-size: 0.8rem; color: var(--fw-muted); line-height: 1.5; }
      .pop { display: flex; gap: 10px; align-items: center; text-decoration: none; padding: 7px 0; border-top: 1px solid #d8e5fa; } .pop:first-of-type { border-top: 0; } .pop span:last-child { display: grid; line-height: 1.3; } .pop b { font-size: 0.8rem; } .pop small { color: var(--fw-muted); font-size: 0.72rem; }
      .thumb { overflow: hidden; } .thumb img { width: 100%; height: 100%; object-fit: cover; }
      .thumb { width: 48px; height: 48px; flex: none; border-radius: 8px; background: linear-gradient(135deg, #0a3a8a, #4da3ff); color: #fff; display: grid; place-items: center; font-size: 26px; }
      .rel { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; } .rel a { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; text-decoration: none; padding: 5px 0; border-bottom: 1px solid #d8e5fa; } .rel .material-icons { font-size: 14px; color: var(--fw-blue); }
      .link { background: none; border: 0; color: var(--fw-blue); text-decoration: underline; cursor: pointer; font: inherit; }
      @media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteBlogComponent {
  protected readonly banner = BLOG_BANNERS.hero;
  protected image(slug: string): string | null {
    return blogImage(slug);
  }
  protected thumb(slug: string): string | null {
    return blogThumb(slug);
  }

  protected readonly b = BLOG;
  protected readonly cat = signal('all');
  protected readonly term = signal('');

  protected readonly posts = computed<BlogPost[]>(() => {
    const t = this.term().trim().toLowerCase();
    return BLOG.posts.filter((p) => (this.cat() === 'all' || p.catKey === this.cat()) && (!t || `${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(t)));
  });
  protected readonly popular = computed(() => BLOG.popular.map((s) => BLOG.posts.find((p) => p.slug === s)).filter((p): p is BlogPost => !!p));

  protected reset(): void {
    this.cat.set('all');
    this.term.set('');
  }
}
