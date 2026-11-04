import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

const GLYPHS = '01ABCDEFGHJKLMNPQRSTUVWXYZ#$%&*+<>/\=?@';

/**
 * Scroll-triggered text decryption: the text starts as scrambled characters and
 * resolves left to right once the element scrolls into view.
 */
@Directive({ selector: 'a[appDecrypt], h4[appDecrypt], span[appDecrypt], p[appDecrypt]', standalone: true })
export class DecryptTextDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private text = '';
  private raf = 0;
  private observer?: IntersectionObserver;
  private readonly reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    this.text = (this.el.textContent ?? '').trim();
    if (!this.text || this.reduced || typeof IntersectionObserver === 'undefined') return;
    this.el.setAttribute('aria-label', this.text);
    this.render(0);
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.observer?.disconnect();
          this.play();
        }
      },
      { threshold: 0.4 },
    );
    this.observer.observe(this.el);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
  }

  private readonly play = (): void => {
    cancelAnimationFrame(this.raf);
    const duration = Math.min(600 + this.text.length * 22, 1800);
    const start = performance.now();
    const tick = (now: number): void => {
      const p = Math.min((now - start) / duration, 1);
      this.render(p);
      if (p < 1) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  };

  private render(progress: number): void {
    const done = Math.floor(progress * this.text.length);
    let out = '';
    for (let i = 0; i < this.text.length; i++) {
      const c = this.text[i];
      out += i < done || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    this.el.textContent = progress >= 1 ? this.text : out;
  }
}
