import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, output } from '@angular/core';

import { environment } from '@env/environment';

interface HCaptchaApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
}

const SCRIPT_SRC = 'https://js.hcaptcha.com/1/api.js?render=explicit';

/**
 * Anti-spam challenge for the public inquiry form. Emits the token (or an
 * empty string when it expires). The server only enforces it when a captcha
 * secret is configured, so local development works without one.
 */
@Component({
  selector: 'app-hcaptcha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #box></div>`,
})
export class HcaptchaComponent implements AfterViewInit, OnDestroy {
  readonly token = output<string>();
  readonly failed = output<void>();

  @ViewChild('box', { static: true }) private readonly box!: ElementRef<HTMLDivElement>;

  private widgetId: string | null = null;
  private script: HTMLScriptElement | null = null;

  private get api(): HCaptchaApi | undefined {
    return (window as unknown as { hcaptcha?: HCaptchaApi }).hcaptcha;
  }

  ngAfterViewInit(): void {
    this.ensureScript().then(() => this.render()).catch(() => this.failed.emit());
  }

  ngOnDestroy(): void {
    this.script?.remove();
  }

  reset(): void {
    this.token.emit('');
    if (this.api && this.widgetId !== null) {
      this.api.reset(this.widgetId);
    }
  }

  private ensureScript(): Promise<void> {
    if (this.api) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = SCRIPT_SRC;
      el.async = true;
      el.defer = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('hCaptcha failed to load'));
      document.head.appendChild(el);
      this.script = el;
    });
  }

  private render(): void {
    if (!this.api) return;

    this.widgetId = this.api.render(this.box.nativeElement, {
      sitekey: environment.hcaptchaSiteKey,
      callback: (t: string) => this.token.emit(t),
      'expired-callback': () => this.token.emit(''),
      'error-callback': () => this.token.emit(''),
    });
  }
}
