import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Peek-a-boo carousel: one full card in the middle with the previous / next cards peeking in at the sides.
 * Infinite loop (a clone of the last and first card sits at each end), swipe / drag, arrows, dots, keyboard
 * arrows, and no animation under prefers-reduced-motion. Cards are passed as templates so each page keeps its
 * own card markup and styling:
 *
 *   <app-peek-carousel label="Our values" [slides]="[mission, vision]" />
 *   <ng-template #mission>…card…</ng-template>
 */
@Component({
  selector: 'app-peek-carousel',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.arrowLeft)': 'step(-1)', '(keydown.arrowRight)': 'step(1)' },
  template: `
    <div class="pc" role="region" aria-roledescription="carousel" [attr.aria-label]="label()" tabindex="0">
      <div
        #viewport
        class="pc__viewport"
        [class.is-dragging]="dragging()"
        (pointerdown)="dragStart($event)"
        (pointermove)="dragMove($event)"
        (pointerup)="dragEnd($event)"
        (pointercancel)="dragEnd($event)"
        (click)="swallowClick($event)"
      >
        <div
          class="pc__track"
          [class.is-animating]="animating()"
          [style.transform]="transform()"
          [style.gap.px]="gap"
          (transitionend)="settle($event)"
        >
          @for (i of order(); track $index) {
            <div
              class="pc__slide"
              [class.is-active]="$index === pos()"
              [style.width.px]="slideW()"
              [attr.aria-hidden]="$index === pos() ? null : 'true'"
              [attr.inert]="$index === pos() ? null : ''"
              role="group"
              aria-roledescription="slide"
              [attr.aria-label]="i + 1 + ' of ' + count()"
            >
              <ng-container [ngTemplateOutlet]="slides()[i]" />
            </div>
          }
        </div>
      </div>

      <div class="pc__controls">
        <button type="button" class="pc__arrow" aria-label="Previous" (click)="step(-1)">
          <span class="material-icons" aria-hidden="true">chevron_left</span>
        </button>
        <div class="pc__dots">
          @for (s of slides(); track $index) {
            <button type="button" [class.on]="$index === active()" [attr.aria-label]="'Go to slide ' + ($index + 1)" [attr.aria-current]="$index === active() ? 'true' : null" (click)="goTo($index)"></button>
          }
        </div>
        <button type="button" class="pc__arrow" aria-label="Next" (click)="step(1)">
          <span class="material-icons" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .pc { outline: none; }
      .pc:focus-visible .pc__viewport { outline: 2px solid var(--fw-blue, #1c6df0); outline-offset: 2px; border-radius: 16px; }
      /* Vertical padding leaves room for the card shadow and the hover lift inside the clipped area. */
      .pc__viewport { overflow: hidden; padding: 14px 0 18px; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; }
      .pc__viewport.is-dragging { cursor: grabbing; }
      .pc__track { display: flex; align-items: stretch; will-change: transform; }
      .pc__track.is-animating { transition: transform 0.55s cubic-bezier(0.22, 0.8, 0.24, 1); }
      .pc__slide { flex: none; display: flex; box-sizing: border-box; opacity: 0.55; transform: scale(0.93); transition: opacity 0.45s ease, transform 0.45s ease; }
      .pc__slide.is-active { opacity: 1; transform: none; }
      .pc__slide > * { flex: 1; min-width: 0; }
      .pc__slide ::ng-deep > * > .card, .pc__slide.is-active ::ng-deep .card { transition: box-shadow 0.3s ease, transform 0.3s ease; }
      .pc__slide.is-active ::ng-deep .card { box-shadow: 0 18px 40px rgba(8, 42, 85, 0.18); }
      @media (hover: hover) { .pc__slide.is-active:hover ::ng-deep .card { transform: translateY(-4px); box-shadow: 0 22px 46px rgba(8, 42, 85, 0.22); } }
      .pc__controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 2px; }
      .pc__arrow { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--fw-line-strong, #c5d3ea); background: #fff; color: var(--fw-navy, #082a55); display: grid; place-items: center; cursor: pointer; box-shadow: 0 4px 12px rgba(8, 42, 85, 0.1); transition: background 0.2s, color 0.2s, transform 0.2s; }
      .pc__arrow:hover { background: var(--fw-blue, #1c6df0); color: #fff; transform: scale(1.06); }
      .pc__arrow:focus-visible { outline: 2px solid var(--fw-blue, #1c6df0); outline-offset: 2px; }
      .pc__dots { display: flex; align-items: center; gap: 7px; }
      .pc__dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; background: #c7d3e6; cursor: pointer; transition: width 0.25s, background 0.25s; }
      .pc__dots button.on { width: 24px; background: var(--fw-blue, #1c6df0); }
      @media (prefers-reduced-motion: reduce) {
        .pc__track.is-animating, .pc__slide, .pc__slide ::ng-deep .card { transition: none !important; }
      }
    `,
  ],
})
export class PeekCarouselComponent {
  readonly slides = input.required<TemplateRef<unknown>[]>();
  readonly label = input('Cards');

  protected readonly gap = 16;
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly width = signal(0);

  protected readonly count = computed(() => this.slides().length);
  /** Slide indexes in render order, with the last card in front and the first card behind for the endless loop. */
  protected readonly order = computed(() => {
    const n = this.count();
    const all = Array.from({ length: n }, (_, i) => i);
    return n > 1 ? [n - 1, ...all, 0] : all;
  });
  /** Position in the rendered order (1 = first real card). */
  protected readonly pos = signal(1);
  protected readonly animating = signal(false);
  protected readonly dragging = signal(false);
  private readonly dragX = signal(0);

  protected readonly active = computed(() => {
    const n = this.count();
    return n > 1 ? (((this.pos() - 1) % n) + n) % n : 0;
  });

  /** Desktop: a wide centre card with generous previews; tablet: narrower; phone: just a small sliver each side. */
  protected readonly slideW = computed(() => {
    const w = this.width();
    return Math.round(w * (w >= 900 ? 0.5 : w >= 600 ? 0.62 : 0.78));
  });
  protected readonly transform = computed(() => {
    const w = this.width();
    const sw = this.slideW();
    const x = (w - sw) / 2 - this.pos() * (sw + this.gap) + this.dragX();
    return `translate3d(${x}px, 0, 0)`;
  });

  private busy = false;
  private fallback?: ReturnType<typeof setTimeout>;
  private startX = 0;
  private moved = false;
  private pointer: number | null = null;
  private readonly reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.viewport().nativeElement;
      this.width.set(el.clientWidth);
      const ro = new ResizeObserver(() => this.width.set(el.clientWidth));
      ro.observe(el);
      destroyRef.onDestroy(() => ro.disconnect());
    });
    destroyRef.onDestroy(() => clearTimeout(this.fallback));
  }

  protected step(dir: 1 | -1): void {
    if (this.count() < 2 || this.busy) return;
    this.move(this.pos() + dir);
  }

  protected goTo(index: number): void {
    if (this.count() < 2 || this.busy || index === this.active()) return;
    this.move(index + 1);
  }

  private move(target: number): void {
    this.busy = true;
    this.dragX.set(0);
    const instant = this.reduceMotion && this.reduceMotion.matches;
    this.animating.set(!instant);
    this.pos.set(target);
    // transitionend never fires without a transition (reduced motion) and can be missed in a hidden tab.
    clearTimeout(this.fallback);
    this.fallback = setTimeout(() => this.finish(), instant ? 0 : 700);
  }

  protected settle(event: TransitionEvent): void {
    if (event.target === event.currentTarget && event.propertyName === 'transform') this.finish();
  }

  /** After a slide onto a clone, jump (without animating) to the matching real card. */
  private finish(): void {
    clearTimeout(this.fallback);
    const n = this.count();
    this.animating.set(false);
    if (this.pos() === 0) this.pos.set(n);
    else if (this.pos() === n + 1) this.pos.set(1);
    this.busy = false;
  }

  protected dragStart(e: PointerEvent): void {
    if (this.busy || this.count() < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    this.pointer = e.pointerId;
    this.startX = e.clientX;
    this.moved = false;
    this.animating.set(false);
  }

  protected dragMove(e: PointerEvent): void {
    if (e.pointerId !== this.pointer) return;
    const dx = e.clientX - this.startX;
    if (!this.moved && Math.abs(dx) < 6) return;
    if (!this.moved) {
      this.moved = true;
      this.dragging.set(true);
      this.viewport().nativeElement.setPointerCapture(e.pointerId);
    }
    this.dragX.set(dx);
  }

  protected dragEnd(e: PointerEvent): void {
    if (e.pointerId !== this.pointer) return;
    this.pointer = null;
    const dx = this.dragX();
    this.dragging.set(false);
    if (!this.moved) return;
    const threshold = Math.min(80, this.slideW() / 4);
    if (Math.abs(dx) > threshold) this.move(this.pos() + (dx < 0 ? 1 : -1));
    else {
      this.animating.set(true); // ease back into place
      this.dragX.set(0);
    }
  }

  /** A drag that ends over a link or button must not count as a click on it. */
  protected swallowClick(e: Event): void {
    if (this.moved) {
      e.preventDefault();
      e.stopPropagation();
      this.moved = false;
    }
  }
}
