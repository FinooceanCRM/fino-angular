import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/**
 * Rolling-character (slot machine) text effect. Splits the host's text into
 * words and characters, each character stacked with a copy of itself; the
 * `.roll-link:hover` rule in the host component's styles slides every column up
 * one line, staggered left to right. Words stay unbroken so long text still wraps.
 */
@Directive({ selector: 'a[appRoll]', standalone: true, host: { class: 'roll-link' } })
export class RollTextDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  ngAfterViewInit(): void {
    const text = (this.el.textContent ?? '').trim();
    if (!text) return;
    this.el.setAttribute('aria-label', text);
    this.el.textContent = '';
    let i = 0;
    text.split(/\s+/).forEach((word, w, all) => {
      const wrap = document.createElement('span');
      wrap.className = 'roll-w';
      wrap.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const col = document.createElement('span');
        col.className = 'roll-c';
        const stack = document.createElement('span');
        stack.className = 'roll-s';
        stack.style.transitionDelay = `${Math.min(i++, 40) * 18}ms`;
        for (let n = 0; n < 2; n++) {
          const g = document.createElement('span');
          g.textContent = ch;
          stack.appendChild(g);
        }
        col.appendChild(stack);
        wrap.appendChild(col);
      }
      this.el.appendChild(wrap);
      if (w < all.length - 1) this.el.appendChild(document.createTextNode(' '));
    });
  }
}
