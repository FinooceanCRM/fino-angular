import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, effect, inject, viewChild } from '@angular/core';

import { OfferService } from '@core/services/offer.service';

import { OfferPopupService } from './offer-popup.service';

/**
 * The timed offer popup (see OfferPopupService for when it appears). Everything shown comes from the offer the
 * admin created: no invented urgency, no countdown — a validity date appears only if the offer really has one.
 */
@Component({
  selector: 'app-offer-popup',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (popup.isOpen() && popup.offer(); as o) {
      <div class="ov" (click)="popup.dismiss()">
        <div class="card" role="dialog" aria-modal="true" aria-labelledby="op-title" aria-describedby="op-desc" (click)="$event.stopPropagation()" #dialog>
          <button type="button" class="x" (click)="popup.dismiss()" aria-label="Close offer"><span class="material-icons">close</span></button>

          <div class="art" aria-hidden="true">
            @if (img(o); as src) { <img [src]="src" alt="" /> }
            <span class="orb orb--a"></span><span class="orb orb--b"></span><span class="orb orb--c"></span>
            <div class="art__c">
              <span class="gift"><span class="material-icons">redeem</span></span>
              <span class="tag">{{ o.badge_text || o.type_label }}</span>
            </div>
          </div>

          <div class="body">
            <p class="eyebrow">Wait! Don’t Miss Out on Something Special!</p>
            <h2 id="op-title">{{ o.headline }}</h2>
            <p id="op-desc" class="desc">{{ o.description }}</p>
            @if (o.benefits.length) {
              <ul class="ben">@for (b of o.benefits.slice(0, 3); track b) { <li><span class="material-icons">check_circle</span>{{ b }}</li> }</ul>
            }
            @if (o.valid_until) { <p class="valid"><span class="material-icons">event</span>Offer valid until {{ o.valid_until | date: 'd MMM y' }}</p> }
            <button type="button" class="cta" (click)="popup.claim()" #cta>{{ o.cta_text }} <span class="material-icons">arrow_forward</span></button>
            <button type="button" class="later" (click)="popup.dismiss()">Maybe later</button>
            <p class="fine">It takes about a minute. We’ll only use your details to contact you about this offer.</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ov { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(6, 26, 61, 0.66); backdrop-filter: blur(4px); animation: fade 0.25s ease both; overflow-y: auto; }
      .card { position: relative; width: min(780px, 100%); display: grid; grid-template-columns: 0.9fr 1.2fr; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4); animation: pop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.15) both; font-family: Poppins, system-ui, sans-serif; color: var(--fw-ink, #10213a); }
      .x { position: absolute; top: 12px; right: 12px; z-index: 3; width: 36px; height: 36px; border-radius: 50%; border: 0; background: rgba(16, 33, 58, 0.08); color: #10213a; cursor: pointer; display: grid; place-items: center; } .x:hover { background: rgba(16, 33, 58, 0.16); }
      .art { position: relative; min-height: 340px; background: linear-gradient(150deg, #061a3d 0%, #0d3a75 55%, #1c6df0 100%); overflow: hidden; display: grid; place-items: center; color: #fff; }
      .art img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; mix-blend-mode: luminosity; }
      .orb { position: absolute; border-radius: 50%; filter: blur(2px); animation: float 7s ease-in-out infinite; } .orb--a { width: 190px; height: 190px; background: radial-gradient(circle, rgba(77, 196, 255, 0.55), transparent 70%); top: -40px; left: -50px; } .orb--b { width: 150px; height: 150px; background: radial-gradient(circle, rgba(255, 193, 77, 0.45), transparent 70%); bottom: 20px; right: -30px; animation-delay: -2s; } .orb--c { width: 90px; height: 90px; background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 70%); top: 45%; left: 20%; animation-delay: -4s; }
      .art__c { position: relative; z-index: 2; display: grid; justify-items: center; gap: 14px; text-align: center; padding: 20px; }
      .gift { width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, #ffd166, #f59e0b); box-shadow: 0 12px 30px rgba(245, 158, 11, 0.5), 0 0 0 10px rgba(255, 255, 255, 0.12); animation: bob 3s ease-in-out infinite; } .gift .material-icons { font-size: 52px; color: #fff; }
      .tag { background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.35); padding: 6px 16px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.3px; backdrop-filter: blur(4px); }
      .body { padding: 34px 32px 26px; display: grid; gap: 10px; align-content: center; }
      .eyebrow { margin: 0; color: #d97706; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.2px; }
      h2 { margin: 0; font-size: clamp(1.4rem, 2.8vw, 1.85rem); line-height: 1.2; color: #0a2f66; }
      .desc { margin: 0; color: #4b5b73; font-size: 0.92rem; line-height: 1.55; }
      .ben { list-style: none; margin: 2px 0 0; padding: 0; display: grid; gap: 6px; font-size: 0.86rem; } .ben li { display: flex; gap: 8px; align-items: center; } .ben .material-icons { color: #16a34a; font-size: 19px; }
      .valid { margin: 0; display: flex; gap: 6px; align-items: center; font-size: 0.8rem; color: #4b5b73; } .valid .material-icons { font-size: 17px; color: #1c6df0; }
      .cta { margin-top: 8px; display: inline-flex; gap: 8px; align-items: center; justify-content: center; border: 0; border-radius: 14px; padding: 14px 22px; font: 600 1rem Poppins, sans-serif; color: #fff; cursor: pointer; background: linear-gradient(135deg, #1c6df0, #0d3a75); box-shadow: 0 10px 24px rgba(28, 109, 240, 0.4); transition: transform 0.15s, box-shadow 0.15s; } .cta:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(28, 109, 240, 0.5); } .cta:focus-visible, .later:focus-visible, .x:focus-visible { outline: 3px solid rgba(28, 109, 240, 0.55); outline-offset: 2px; }
      .later { background: none; border: 0; color: #5b6b82; font: 500 0.86rem Poppins, sans-serif; cursor: pointer; padding: 6px; text-decoration: underline; }
      .fine { margin: 0; text-align: center; font-size: 0.72rem; color: #7b8aa0; }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pop { from { opacity: 0; transform: translateY(24px) scale(0.92); } to { opacity: 1; transform: none; } }
      @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      @keyframes bob { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(4deg); } }
      @media (max-width: 720px) { .card { grid-template-columns: 1fr; } .art { min-height: 150px; } .gift { width: 64px; height: 64px; } .gift .material-icons { font-size: 36px; } .art__c { gap: 8px; padding: 14px; } .body { padding: 22px 20px 20px; } }
      @media (prefers-reduced-motion: reduce) { .ov, .card, .orb, .gift { animation: none !important; } }
    `,
  ],
})
export class OfferPopupComponent implements OnInit, OnDestroy {
  protected readonly popup = inject(OfferPopupService);
  private readonly offers = inject(OfferService);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private opener: HTMLElement | null = null;
  private lockedScroll = false;

  constructor() {
    // Move focus into the dialog when it opens, hand it back when it closes, and stop the page scrolling behind it.
    effect(() => {
      const open = this.popup.isOpen();
      if (open) {
        this.opener = document.activeElement as HTMLElement | null;
        document.body.style.overflow = 'hidden';
        this.lockedScroll = true;
        setTimeout(() => this.dialog()?.nativeElement.querySelector<HTMLElement>('.cta')?.focus(), 60);
      } else if (this.lockedScroll) {
        document.body.style.overflow = '';
        this.lockedScroll = false;
        this.opener?.focus?.();
      }
    });
  }

  ngOnInit(): void {
    this.popup.start();
  }

  ngOnDestroy(): void {
    if (this.lockedScroll) document.body.style.overflow = '';
  }

  protected img(o: { image_url: string | null }): string | null {
    return this.offers.imageUrl(o);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    if (!this.popup.isOpen()) return;
    if (e.key === 'Escape') {
      this.popup.dismiss();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep keyboard focus inside the dialog.
    const items = Array.from(this.dialog()?.nativeElement.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}
