import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ARTICLE, BLOG, BlogPost } from '../site-content.data';
import { blogThumb } from '../loan-images';
import { WEBSITE } from '../website.config';
import { BandComponent } from '../shared/band.component';
import { NewsletterFormComponent } from '../shared/newsletter-form.component';

/**
 * Blog article — layout and wording follow images/10_Blog/02_Blog_Article.png.
 * Only the first article's full text exists in the designs; the others show
 * their summary with a pointer back to the list (nothing is made up).
 */
@Component({
  selector: 'app-website-blog-article',
  standalone: true,
  imports: [RouterLink, BandComponent, NewsletterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!post()) {
      <div class="fw-container fw-section"><h1 class="fw-h2">We couldn’t find that article</h1><a class="fw-btn fw-btn--primary" routerLink="/blog">Back to News &amp; Blog</a></div>
    } @else {
      @if (post(); as p) {
        <section class="hero">
          <div class="fw-container hero__inner">
            <div>
              <nav class="crumbs" aria-label="Breadcrumb"><a routerLink="/">Home</a><span>›</span><a routerLink="/blog">News &amp; Blog</a><span>›</span><span>{{ p.category }}</span><span>›</span><span aria-current="page" class="cur">{{ p.title }}</span></nav>
              <span class="pill">{{ p.category }}</span>
              <h1>{{ p.title }}</h1>
              <p>{{ p.summary }}</p>
              @if (p.full) {
                <ul class="meta"><li><span class="material-icons">calendar_today</span>{{ p.date }}</li><li><span class="material-icons">person</span>By {{ a.author }}</li><li><span class="material-icons">visibility</span>{{ a.views }}</li><li><span class="material-icons">schedule</span>{{ a.read }}</li></ul>
              } @else {
                <ul class="meta"><li><span class="material-icons">calendar_today</span>{{ p.date }}</li></ul>
              }
            </div>
            <p class="script" aria-hidden="true">{{ a.script }}</p>
          </div>
        </section>

        <div class="fw-container cols">
          <div class="share" aria-label="Share article">
            <span>Share Article</span>
            <a [href]="share('facebook')" target="_blank" rel="noopener" aria-label="Share on Facebook" class="fb">f</a>
            <a [href]="share('x')" target="_blank" rel="noopener" aria-label="Share on X" class="x">X</a>
            <a [href]="share('linkedin')" target="_blank" rel="noopener" aria-label="Share on LinkedIn" class="in">in</a>
            <a [href]="share('whatsapp')" target="_blank" rel="noopener" aria-label="Share on WhatsApp" class="wa"><span class="material-icons">chat</span></a>
            <button type="button" (click)="copy()" aria-label="Copy link" class="cp"><span class="material-icons">link</span></button>
            @if (copied()) { <small role="status">Copied</small> }
          </div>

          <article class="body">
            @if (p.full) {
              <div class="take"><h2><span class="material-icons">lightbulb</span> Key Takeaways</h2><ul>@for (t of a.takeaways; track t) { <li><span class="material-icons">check_circle</span>{{ t }}</li> }</ul></div>
              <p>{{ a.intro }}</p>
              @for (s of a.sections; track s.title) {
                <h2>{{ s.title }}</h2>
                <p>{{ s.text }}</p>
                <div class="feat"><strong>{{ s.featuresTitle }}</strong><ul>@for (f of s.features; track f) { <li><span class="material-icons">check_circle</span>{{ f }}</li> }</ul></div>
              }
            } @else {
              <div class="fw-alert fw-alert--info">The full article is coming soon. In the meantime, explore our <a routerLink="/services">loan services</a> or <a routerLink="/contact">talk to an expert</a>.</div>
            }
          </article>

          <aside>
            <div class="box"><div class="bh"><h3>Related Articles</h3><a routerLink="/blog">View All →</a></div>
              @for (r of related(); track r.slug) { <a class="rel" [routerLink]="['/blog', r.slug]"><span class="thumb">@if (thumb(r.slug); as src) { <img [src]="src" alt="" /> } @else { <span class="material-icons">{{ r.icon }}</span> }</span><span><small class="tg">{{ r.category }} · {{ r.date }}</small><b>{{ r.title }}</b></span></a> }
            </div>
            <div class="box"><h3>{{ a.advice.title }}</h3><p>{{ a.advice.text }}</p>
              <a class="fw-btn fw-btn--primary fw-btn--block" routerLink="/contact">Talk to Our Experts <span class="material-icons">arrow_forward</span></a>
              <a class="phone" [href]="site.phoneHref"><span class="material-icons">phone</span><span><b>{{ site.phone }}</b><small>{{ site.hours.replace(' · ', ' ') }}</small></span></a></div>
            <div class="box"><h3>{{ b.newsletter.title }}</h3><p>Get the latest financial tips, loan updates and government scheme news.</p><app-newsletter-form /></div>
          </aside>
        </div>

        <app-band [title]="a.band.title" [text]="a.band.text" [cta]="a.band.cta" link="/eligibility" />
      }
    }
  `,
  styles: [
    `
      a { color: inherit; } .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; } .material-icons { font-size: 20px; }
      .hero { background: linear-gradient(115deg, #061a3d 0%, #0a2f66 60%, #0d4a9a 100%); color: #fff; padding: 20px 0 30px; }
      .hero__inner { display: grid; grid-template-columns: 1.5fr 0.5fr; gap: 20px; align-items: center; }
      .crumbs { display: flex; gap: 8px; font-size: 0.74rem; color: #cfe0ff; margin-bottom: 12px; flex-wrap: wrap; } .crumbs a { text-decoration: none; } .cur { opacity: 0.8; }
      .pill { display: inline-block; background: #16a34a; color: #fff; font-size: 0.72rem; font-weight: 600; padding: 4px 12px; border-radius: 6px; margin-bottom: 10px; }
      h1 { font-size: clamp(1.7rem, 3.6vw, 2.5rem); line-height: 1.15; margin: 0 0 8px; font-weight: 700; } .hero p { font-size: 0.92rem; line-height: 1.6; color: #dbe8ff; margin: 0 0 14px; max-width: 560px; }
      .meta { display: flex; gap: 8px 22px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0; font-size: 0.8rem; color: #cfe0ff; } .meta .material-icons { font-size: 16px; margin-right: 6px; vertical-align: -3px; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.7rem !important; line-height: 1.25; color: #e6f0ff !important; text-align: right; margin: 0 !important; }
      .cols { display: grid; grid-template-columns: 56px minmax(0, 1fr) 300px; gap: 22px; margin: 24px auto; align-items: start; }
      .share { display: grid; gap: 8px; justify-items: center; font-size: 0.72rem; text-align: center; position: sticky; top: 84px; }
      .share a, .share button { width: 38px; height: 38px; border-radius: 8px; border: 0; display: grid; place-items: center; color: #fff; font: 700 0.9rem Poppins, sans-serif; text-decoration: none; cursor: pointer; }
      .fb { background: #1877f2; } .x { background: #000; } .in { background: #0a66c2; } .wa { background: #22c55e; } .cp { background: #5b6b82; }
      .body { min-width: 0; } .body p { line-height: 1.75; font-size: 0.92rem; color: #3d4a5f; } .body h2 { font-size: 1.25rem; margin: 22px 0 8px; color: var(--fw-navy); }
      .take { background: var(--fw-blue-soft); border: 1px solid #cfe0ff; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; } .take h2 { margin: 0 0 10px; font-size: 1.1rem; display: flex; gap: 8px; align-items: center; } .take h2 .material-icons { color: var(--fw-blue); }
      ul { list-style: none; margin: 0; padding: 0; } .take li, .feat li { display: flex; gap: 8px; align-items: flex-start; font-size: 0.88rem; margin: 6px 0; color: #3d4a5f; } .take .material-icons, .feat .material-icons { color: var(--fw-blue); font-size: 18px; margin-top: 1px; }
      .feat { background: var(--fw-blue-soft); border-radius: 10px; padding: 14px 18px; margin-top: 10px; } .feat strong { font-size: 0.9rem; } .feat ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0 14px; }
      .box { background: var(--fw-blue-soft); border-radius: 12px; padding: 16px; margin-bottom: 14px; } .box h3 { margin: 0 0 8px; font-size: 1rem; color: var(--fw-navy); } .box p { margin: 0 0 10px; font-size: 0.82rem; color: var(--fw-muted); line-height: 1.5; }
      .bh { display: flex; justify-content: space-between; align-items: center; } .bh a { color: var(--fw-blue); font-size: 0.78rem; text-decoration: none; font-weight: 600; }
      .rel { display: flex; gap: 10px; align-items: center; text-decoration: none; padding: 8px 0; border-top: 1px solid #d8e5fa; } .rel span:last-child { display: grid; line-height: 1.3; } .rel b { font-size: 0.8rem; } .tg { color: var(--fw-muted); font-size: 0.7rem; }
      .thumb { overflow: hidden; } .thumb img { width: 100%; height: 100%; object-fit: cover; }
      .thumb { width: 54px; height: 54px; flex: none; border-radius: 8px; background: linear-gradient(135deg, #0a3a8a, #4da3ff); color: #fff; display: grid; place-items: center; font-size: 26px; }
      .phone { display: flex; gap: 10px; align-items: center; text-decoration: none; margin-top: 10px; } .phone .material-icons { background: var(--fw-blue); color: #fff; border-radius: 50%; padding: 8px; } .phone span:last-child { display: grid; } .phone small { color: var(--fw-muted); font-size: 0.72rem; }
      @media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } .share { position: static; display: flex; justify-items: unset; align-items: center; flex-wrap: wrap; gap: 8px; } .hero__inner { grid-template-columns: 1fr; } .script { text-align: left; } }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteBlogArticleComponent {
  protected thumb(slug: string): string | null {
    return blogThumb(slug);
  }

  readonly slug = input.required<string>();

  protected readonly a = ARTICLE;
  protected readonly b = BLOG;
  protected readonly site = WEBSITE;
  protected readonly copied = signal(false);

  protected readonly post = computed<BlogPost | undefined>(() => BLOG.posts.find((p) => p.slug === this.slug()));
  protected readonly related = computed(() => BLOG.posts.filter((p) => p.slug !== this.slug()).slice(0, 4));

  private url(): string {
    return typeof location !== 'undefined' ? location.href : '';
  }

  protected share(network: 'facebook' | 'x' | 'linkedin' | 'whatsapp'): string {
    const u = encodeURIComponent(this.url());
    const t = encodeURIComponent(this.post()?.title ?? 'FINOOCEAN');
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
    }[network];
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }
}
