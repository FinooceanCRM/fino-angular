import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';

import { WEBSITE } from '../website.config';

/**
 * Floating contact button, fixed to the bottom-right of every page. Tapping it opens a drop-up with Call,
 * Email and WhatsApp (nearest the button first); tapping it again, pressing Escape or clicking anywhere else closes it.
 * Used by the public website and the customer dashboard.
 */
@Component({
  selector: 'app-contact-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cfab" [class.open]="open()">
      <ul class="cfab__list" [attr.aria-hidden]="!open()">
        <li style="--d: 3">
          <a class="cfab__b cfab__b--call" [href]="site.phoneHref" aria-label="Call us" [tabindex]="open() ? 0 : -1">
            <span class="material-icons" aria-hidden="true">add_ic_call</span><span class="cfab__tip">Call us</span>
          </a>
        </li>
        <li style="--d: 2">
          <a class="cfab__b cfab__b--mail" [href]="'mailto:' + site.email" aria-label="Email us" [tabindex]="open() ? 0 : -1">
            <span class="material-icons" aria-hidden="true">mail</span><span class="cfab__tip">Email us</span>
          </a>
        </li>
        <li style="--d: 1">
          <a class="cfab__b cfab__b--wa" [href]="site.whatsappHref" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" [tabindex]="open() ? 0 : -1">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            <span class="cfab__tip">WhatsApp</span>
          </a>
        </li>
      </ul>
      <button type="button" class="cfab__toggle" (click)="toggle($event)" [attr.aria-expanded]="open()" aria-haspopup="true" [attr.aria-label]="open() ? 'Close contact options' : 'Contact us'">
        <span class="material-icons" aria-hidden="true">{{ open() ? 'close' : 'headset_mic' }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      :host { position: fixed; right: 20px; bottom: 24px; z-index: 70; font-family: Poppins, system-ui, sans-serif; }
      .cfab { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .cfab__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .cfab__list li { display: block; opacity: 0; visibility: hidden; transform: translateY(18px) scale(0.6); transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.2), visibility 0s linear 0.28s; transition-delay: calc((var(--d) - 1) * 40ms); }
      .open .cfab__list li { opacity: 1; visibility: visible; transform: none; transition-delay: calc((3 - var(--d)) * 55ms), calc((3 - var(--d)) * 55ms), 0s; }
      .cfab__b { position: relative; display: grid; place-items: center; width: 62px; height: 62px; border-radius: 50%; text-decoration: none; box-shadow: 0 6px 16px rgba(16, 33, 58, 0.18); transition: transform 0.15s, box-shadow 0.15s; }
      .cfab__b:hover, .cfab__b:focus-visible { transform: scale(1.07); box-shadow: 0 10px 22px rgba(16, 33, 58, 0.26); outline: 0; }
      .cfab__b:focus-visible { outline: 3px solid rgba(28, 109, 240, 0.5); outline-offset: 2px; }
      .cfab__b .material-icons { font-size: 30px; }
      .cfab__b--call, .cfab__b--mail { background: #ffe9d6; color: #f59e0b; }
      .cfab__b--wa { background: #dcf6e3; color: #25d366; }
      .cfab__tip { position: absolute; right: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #10213a; color: #fff; font-size: 0.78rem; font-weight: 500; padding: 5px 10px; border-radius: 8px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
      .cfab__b:hover .cfab__tip, .cfab__b:focus-visible .cfab__tip { opacity: 1; }
      .cfab__toggle { display: grid; place-items: center; width: 62px; height: 62px; border-radius: 50%; border: 0; cursor: pointer; color: #fff; background: linear-gradient(135deg, #1c6df0, #0d3a75); box-shadow: 0 8px 22px rgba(28, 109, 240, 0.4); transition: background 0.2s, transform 0.15s; }
      .cfab__toggle:hover { transform: scale(1.05); } .cfab__toggle:focus-visible { outline: 3px solid rgba(28, 109, 240, 0.5); outline-offset: 2px; }
      .cfab__toggle .material-icons { font-size: 32px; }
      .open .cfab__toggle { background: #b8b8b8; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22); }
      /* Clear the bottom tab bars the website and dashboard show on small screens. */
      @media (max-width: 1020px) { :host { bottom: calc(92px + env(safe-area-inset-bottom, 0px)); right: 14px; } }
      @media (max-width: 480px) { .cfab__b, .cfab__toggle { width: 54px; height: 54px; } .cfab__b .material-icons { font-size: 26px; } .cfab__b svg { width: 24px; height: 24px; } }
      @media (prefers-reduced-motion: reduce) { .cfab__list li, .cfab__b, .cfab__toggle { transition: none !important; } }
      @media print { :host { display: none; } }
    `,
  ],
})
export class ContactFabComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly site = WEBSITE;
  protected readonly open = signal(false);

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((o) => !o);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.open.set(false);
  }
}
