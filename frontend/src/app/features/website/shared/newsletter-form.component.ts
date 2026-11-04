import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WebsiteService } from '@core/services/website.service';

/** Newsletter sign-up. Posts to /public/newsletter (stored server-side). */
@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (ngSubmit)="submit()" class="nl">
      <input type="email" name="email" [(ngModel)]="email" placeholder="Enter your email" aria-label="Email address" autocomplete="email" required />
      <!-- Honeypot: invisible to people, bots fill it. -->
      <input class="hp" type="text" name="website" [(ngModel)]="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <button type="submit" [disabled]="busy()">{{ busy() ? '…' : label() }}</button>
    </form>
    @if (msg()) { <p class="nl__msg" [class.err]="isError()" role="status">{{ msg() }}</p> }
  `,
  styles: [
    `
      .nl { display: flex; border-radius: 8px; overflow: hidden; border: 1px solid var(--fw-line-strong); background: #fff; }
      .nl input[type='email'] { flex: 1; min-width: 0; border: 0; outline: 0; padding: 0 12px; height: 38px; font: 400 0.82rem Poppins, sans-serif; }
      .nl button { border: 0; background: var(--fw-blue); color: #fff; padding: 0 14px; font: 600 0.82rem Poppins, sans-serif; cursor: pointer; }
      .nl button[disabled] { opacity: 0.6; }
      .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
      .nl__msg { margin: 6px 0 0; font-size: 0.75rem; color: #16a34a; } .nl__msg.err { color: #d33a2c; }
    `,
  ],
})
export class NewsletterFormComponent {
  private readonly web = inject(WebsiteService);

  readonly label = input('Subscribe');

  protected email = '';
  protected hp = '';
  protected readonly busy = signal(false);
  protected readonly msg = signal<string | null>(null);
  protected readonly isError = signal(false);

  protected submit(): void {
    const email = this.email.trim();
    if (!email || this.busy()) return;
    this.busy.set(true);
    this.msg.set(null);
    this.web.subscribe(email, this.hp).subscribe({
      next: () => { this.busy.set(false); this.isError.set(false); this.msg.set('Thanks for subscribing!'); this.email = ''; },
      error: (e: { message?: string; errors?: Record<string, string[]> }) => {
        this.busy.set(false);
        this.isError.set(true);
        this.msg.set(Object.values(e?.errors ?? {}).flat()[0] ?? e?.message ?? 'Could not subscribe. Please try again.');
      },
    });
  }
}
