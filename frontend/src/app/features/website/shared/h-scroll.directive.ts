import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

/**
 * Phone layout helper: a row of cards that the global `.m-hscroll` class turns into a swipeable, snapping strip
 * (see styles.scss). This adds the little page dots under it, like the mobile designs. On wide screens the row is
 * a normal grid, nothing overflows, and the dots stay hidden.
 *
 * Usage: `<div class="cards m-hscroll" appHScroll style="--m-card-w: 72%">…</div>`
 */
@Directive({ selector: '[appHScroll]', standalone: true })
export class HScrollDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private dots?: HTMLElement;
  private resize?: ResizeObserver;
  private mutations?: MutationObserver;
  private frame = 0;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      if (this.host.hasAttribute('data-no-dots')) return; // e.g. a row of filter chips
      this.dots = document.createElement('div');
      this.dots.className = 'm-dots';
      this.dots.setAttribute('aria-hidden', 'true');
      this.host.insertAdjacentElement('afterend', this.dots);

      this.host.addEventListener('scroll', this.schedule, { passive: true });
      this.resize = new ResizeObserver(this.schedule);
      this.resize.observe(this.host);
      // Cards that arrive later (data loaded, search filter changed) change the dot count.
      this.mutations = new MutationObserver(this.schedule);
      this.mutations.observe(this.host, { childList: true });
      this.schedule();
    });
  }

  ngOnDestroy(): void {
    this.host.removeEventListener('scroll', this.schedule);
    this.resize?.disconnect();
    this.mutations?.disconnect();
    cancelAnimationFrame(this.frame);
    this.dots?.remove();
  }

  private readonly schedule = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.paint());
  };

  private paint(): void {
    const dots = this.dots;
    if (!dots) return;
    const h = this.host;
    const kids = Array.from(h.children) as HTMLElement[];
    const scrollable = h.scrollWidth > h.clientWidth + 4;
    if (!scrollable || kids.length < 2) {
      dots.hidden = true;
      return;
    }
    const cardW = kids[0].getBoundingClientRect().width + 12;
    const perView = Math.max(1, Math.floor(h.clientWidth / cardW));
    const pages = Math.max(2, Math.ceil(kids.length / perView));
    const span = h.scrollWidth - h.clientWidth;
    const active = span > 0 ? Math.round((h.scrollLeft / span) * (pages - 1)) : 0;

    dots.hidden = false;
    if (dots.children.length !== pages) {
      dots.replaceChildren(
        ...Array.from({ length: pages }, (_, i) => {
          const d = document.createElement('i');
          d.addEventListener('click', () => h.scrollTo({ left: (span * i) / (pages - 1), behavior: 'smooth' }));
          return d;
        }),
      );
    }
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === active));
  }
}
