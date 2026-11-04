import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ABOUT, WEBSITE } from '../website.config';
import { PeekCarouselComponent } from '../shared/peek-carousel.component';

/** About Us — wording, figures and cards follow the approved design (images/02_About.png). */
@Component({
  selector: 'app-website-about',
  standalone: true,
  imports: [PeekCarouselComponent, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero -->
    <section class="hero">
      <img class="hero__img" src="/images/about-banner.png" width="2125" height="740" alt="The FINOOCEAN office reception with the company logo on the wall" fetchpriority="high" />
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="fw-container hero__inner">
        <div class="hero__copy">
          <nav class="crumbs" aria-label="Breadcrumb"><a routerLink="/">Home</a><span aria-hidden="true">›</span><span aria-current="page">About Us</span></nav>
          <h1>About Us</h1>
          <h2>{{ about.heroSubtitle }}</h2>
          <p>{{ about.heroText }}</p>
          <button type="button" class="fw-btn fw-btn--primary" (click)="scrollTo('who')">Our Story <span class="material-icons">arrow_forward</span></button>
        </div>
        <blockquote class="hero__quote"><span aria-hidden="true">“</span>{{ about.heroQuote }}<i aria-hidden="true"></i></blockquote>
      </div>
    </section>

    <!-- Who we are -->
    <section class="fw-section who" id="who">
      <div class="fw-container who__grid">
        <figure class="photo" aria-label="People, Purpose, Progress">
          <span class="material-icons photo__icon" aria-hidden="true">groups</span>
          <figcaption>People<br />Purpose<br />Progress</figcaption>
        </figure>

        <div>
          <span class="label">WHO WE ARE <i></i></span>
          <h2 class="who__title">Your Financial Partner<br />for a Better Tomorrow</h2>
          <p class="who__text">{{ about.whoText }}</p>
          <div class="feat">
            @for (f of about.features; track f.title) {
              <div class="feat__item"><span class="ico material-icons">{{ f.icon }}</span><span>{{ f.title }}</span></div>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Stats + mission banner -->
    <section class="stats-sec">
      <div class="fw-container stats">
        <div class="stats__panel">
          @for (s of about.stats; track s.label) {
            <div class="stat"><span class="ico material-icons">{{ s.icon }}</span><strong>{{ s.value }}</strong><span>{{ s.label }}</span></div>
          }
        </div>
        <div class="build">
          <span class="build__trophy material-icons" aria-hidden="true">emoji_events</span>
          <div><h3>{{ about.buildTitle }}</h3><p>{{ about.buildText }}</p></div>
        </div>
      </div>
    </section>

    <!-- Mission, vision, values + leadership -->
    <section class="fw-section mvv">
      <div class="fw-container">
        <span class="label">OUR MISSION, VISION &amp; VALUES <i></i></span>
        <!-- Desktop / tablet: the original grid. Phone: the peek-a-boo carousel (CSS shows one or the other). -->
        <div class="mvv__grid">
          @for (t of [mission, vision, values, lead]; track $index) { <ng-container [ngTemplateOutlet]="t" /> }
        </div>
        <app-peek-carousel class="mvv__slider" label="Our mission, vision and values" [slides]="[mission, vision, values, lead]" />
        <ng-template #mission>
          <article class="card">
            <span class="ico ico--lg material-icons">track_changes</span>
            <div><h3>Our Mission</h3><p>{{ about.mission }}</p></div>
          </article>
        </ng-template>
        <ng-template #vision>
          <article class="card">
            <span class="ico ico--lg material-icons">visibility</span>
            <div><h3>Our Vision</h3><p>{{ about.vision }}</p></div>
          </article>
        </ng-template>
        <ng-template #values>
          <article class="card">
            <span class="ico ico--lg material-icons">diamond</span>
            <div>
              <h3>Our Values</h3>
              <p class="values">
                @for (row of about.values; track $index) {
                  <span>@for (v of row; track v; let last = $last) { {{ v }}@if (!last) { <b>|</b> } }</span>
                }
              </p>
            </div>
          </article>
        </ng-template>
        <ng-template #lead>
          <article class="card lead">
            <h3>A Message from Our Leadership</h3>
            <div class="lead__body">
              <div>
                <p class="lead__quote"><span aria-hidden="true">“</span>{{ about.leader.quote }}”</p>
                <strong>{{ about.leader.name }}</strong>
                <small>{{ about.leader.role }}<br />{{ site.legalName.replace('Private Limited', 'Pvt. Ltd.') }}</small>
              </div>
              <span class="avatar" aria-hidden="true">{{ initials(about.leader.name) }}</span>
            </div>
          </article>
        </ng-template>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="fw-container cta__inner">
        <div><h2>Let’s Build a Brighter Financial Future Together</h2><p>Join thousands of satisfied customers who trust Finoocean for their financial needs.</p></div>
        <a class="fw-btn fw-btn--primary" routerLink="/apply">Apply for a Loan <span class="material-icons">arrow_forward</span></a>
      </div>
    </section>
  `,
  styles: [
    `
      a { color: inherit; }
      .fw-btn { color: inherit; } .fw-btn--primary { color: #fff; }
      .material-icons { font-size: 20px; }
      /* Hero */
      .hero { position: relative; overflow: hidden; background: #0a3a8a; color: #fff; min-height: 330px; display: flex; align-items: center; }
      .hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: right center; }
      .hero__shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(6, 26, 61, 0.88) 0%, rgba(6, 26, 61, 0.55) 45%, rgba(6, 26, 61, 0.15) 70%, rgba(6, 26, 61, 0.55) 100%); }
      .hero__inner { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; padding-top: 28px; padding-bottom: 36px; }
      .hero__copy { max-width: 560px; }
      .crumbs { display: flex; gap: 8px; font-size: 0.78rem; color: #cfe0ff; margin-bottom: 8px; }
      .crumbs a { text-decoration: none; } .crumbs a:hover { text-decoration: underline; }
      .hero h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); line-height: 1.05; margin: 0 0 10px; font-weight: 700; color: #4dc4ff; }
      .hero h2 { font-size: clamp(1.1rem, 2vw, 1.4rem); line-height: 1.3; margin: 0 0 12px; font-weight: 600; }
      .hero p { font-size: 0.92rem; line-height: 1.6; color: #dbe8ff; margin: 0 0 18px; }
      .hero__quote { margin: 0; font-style: italic; font-size: 1.4rem; line-height: 1.35; font-weight: 500; max-width: 160px; position: relative; }
      .hero__quote span { display: block; font-size: 2.2rem; line-height: 0.8; font-style: normal; font-weight: 700; }
      .hero__quote i { display: block; width: 32px; height: 3px; background: #1c9bff; margin-top: 12px; }
      /* Who we are */
      .who { padding-bottom: 20px; }
      .who__grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 36px; align-items: center; }
      .photo { margin: 0; min-height: 260px; border-radius: 14px; background: linear-gradient(135deg, #0a3a8a 0%, #1c6df0 60%, #4da3ff 100%); color: #fff; display: grid; place-items: center; gap: 4px; padding: 24px; text-align: center; position: relative; overflow: hidden; }
      .photo__icon { font-size: 72px; opacity: 0.35; position: absolute; left: 18px; bottom: 10px; }
      .photo figcaption { font-size: 1.7rem; font-weight: 600; line-height: 1.25; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25); }
      .label { display: inline-flex; align-items: center; gap: 10px; font-size: 0.72rem; font-weight: 600; letter-spacing: 1px; color: var(--fw-navy); margin-bottom: 8px; }
      .label i { display: inline-block; width: 28px; height: 2px; background: var(--fw-blue); }
      .who__title { font-size: clamp(1.5rem, 2.6vw, 2rem); line-height: 1.2; margin: 0 0 10px; color: var(--fw-navy); }
      .who__text { color: #3d4a5f; line-height: 1.7; font-size: 0.92rem; margin: 0 0 18px; }
      .feat { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .feat__item { display: grid; justify-items: center; gap: 8px; text-align: center; font-size: 0.8rem; font-weight: 500; padding: 4px 8px; border-left: 1px solid var(--fw-line); }
      .feat__item:first-child { border-left: 0; }
      .ico { width: 44px; height: 44px; border-radius: 50%; background: #e6f1ff; color: var(--fw-blue); display: grid; place-items: center; font-size: 24px; }
      .ico--lg { width: 46px; height: 46px; flex: none; background: transparent; font-size: 34px; }
      /* Stats */
      .stats-sec { padding: 10px 0 8px; }
      .stats { display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; align-items: stretch; }
      .stats__panel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: #eef5ff; border: 1px solid #dbe8fb; border-radius: 12px; padding: 18px 8px; }
      .stat { display: grid; justify-items: center; gap: 2px; text-align: center; border-left: 1px solid #d3e1f6; padding: 0 8px; font-size: 0.82rem; color: #3d4a5f; }
      .stat:first-child { border-left: 0; }
      .stat .ico { background: transparent; width: 36px; height: 36px; font-size: 30px; }
      .stat strong { font-size: 1.45rem; color: var(--fw-navy); line-height: 1.2; }
      .build { display: flex; gap: 14px; align-items: center; background: #072452; color: #fff; border-radius: 12px; padding: 20px 22px; }
      .build__trophy { font-size: 44px; color: #ffc533; flex: none; }
      .build h3 { margin: 0 0 6px; font-size: 1.15rem; line-height: 1.25; } .build p { margin: 0; font-size: 0.82rem; line-height: 1.55; color: #cfe0ff; }
      /* Mission / vision / values */
      .mvv { padding-top: 22px; }
      .card { background: #fff; border: 1px solid var(--fw-line); border-radius: 12px; padding: 18px; display: flex; gap: 12px; align-items: flex-start; box-shadow: 0 2px 10px rgba(16, 33, 58, 0.05); }
      .mvv__grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.3fr; gap: 14px; margin-top: 6px; }
      .mvv__slider { display: none; }
      .mvv__slider .card { box-sizing: border-box; height: 100%; min-height: 220px; padding: 22px; }
      .card h3 { margin: 0 0 6px; font-size: 0.98rem; color: var(--fw-navy); }
      .card p { margin: 0; font-size: 0.8rem; line-height: 1.6; color: #52607a; }
      .values { display: grid; gap: 4px; } .values b { margin: 0 6px; color: #9fb0cc; font-weight: 400; }
      .lead { display: block; } .lead h3 { margin-bottom: 10px; }
      .lead__body { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .lead__quote { font-style: italic; margin-bottom: 10px !important; } .lead__quote span { color: var(--fw-blue); font-size: 1.4rem; line-height: 0; margin-right: 2px; vertical-align: -0.2em; font-style: normal; font-weight: 700; }
      .lead strong { display: block; font-size: 0.85rem; color: var(--fw-navy); } .lead small { display: block; font-size: 0.72rem; color: #52607a; line-height: 1.5; }
      .avatar { flex: none; width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #1c6df0, #0a3a8a); color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 1.3rem; box-shadow: 0 0 0 3px #e6f1ff; }
      /* CTA */
      .cta { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 26px 0; margin-top: 10px; }
      .cta__inner { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
      .cta h2 { margin: 0 0 4px; font-size: 1.25rem; } .cta p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      @media (max-width: 1100px) {
        .stats { grid-template-columns: 1fr; }
      }
      @media (max-width: 1100px) {
        .mvv__grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 720px) {
        .mvv__grid { display: none; }
        .mvv__slider { display: block; }
      }
      @media (max-width: 860px) {
        .hero { display: block; min-height: 0; }
        .hero__img { position: static; display: block; height: 170px; }
        .hero__shade { display: none; }
        .hero__inner { grid-template-columns: 1fr; background: #072452; padding-top: 22px; }
        .hero__quote { max-width: none; font-size: 1.1rem; }
        .who__grid { grid-template-columns: 1fr; gap: 20px; }
        .photo { min-height: 200px; }
      }
      @media (max-width: 600px) {
        .feat { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 14px; }
        .feat__item:nth-child(3) { border-left: 0; }
        .stats__panel { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 14px; }
        .stat:nth-child(3) { border-left: 0; }
      }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class WebsiteAboutComponent {
  protected readonly about = ABOUT;
  protected readonly site = WEBSITE;

  protected initials(name: string): string {
    return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  protected scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
