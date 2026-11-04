import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb.component';

/** Breadcrumb, title, subtitle, handwriting line and the green "secure" card shared by every Profile page. */
@Component({
  selector: 'app-profile-head',
  standalone: true,
  imports: [BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb variant="portal" [compact]="compact()" [withBack]="true" />
    <header class="head" [class.compact]="compact()">
      <div><h1>{{ title() }}</h1><p>{{ subtitle() }}</p></div>
      @if (script()) { <p class="script" aria-hidden="true">{{ script() }}</p> }
      <div class="secure" [class.secure--blue]="tone() === 'blue'">
        <span class="material-icons">{{ icon() }}</span>
        <div><b>{{ secureTitle() }}</b><small>{{ secureText() }}</small></div>
      </div>
    </header>
  `,
  styles: [
    `
      :host { display: block; }
      .crumbs { display: flex; gap: 8px; font-size: 0.82rem; color: var(--fw-muted); margin-bottom: 8px; flex-wrap: wrap; } .crumbs a { color: inherit; text-decoration: none; }
      .head { display: grid; grid-template-columns: 1fr auto auto; gap: 14px 24px; align-items: center; margin-bottom: 16px; }
      h1 { margin: 0 0 4px; font-size: clamp(1.7rem, 3vw, 2.2rem); color: var(--fw-navy); } .head p { margin: 0; color: var(--fw-muted); font-size: 0.92rem; }
      .script { font-family: Lora, serif; font-style: italic; font-size: 1.15rem; line-height: 1.25; color: var(--fw-navy-2) !important; }
      .secure { display: flex; gap: 12px; align-items: center; background: #eefaf2; border: 1px solid #c9ecd5; border-radius: 12px; padding: 12px 16px; max-width: 340px; }
      .secure--blue { background: var(--fw-blue-soft); border-color: #dbe8fb; }
      .secure .material-icons { font-size: 34px; color: #16a34a; } .secure--blue .material-icons { color: var(--fw-blue); } .secure div { display: grid; } .secure small { color: var(--fw-muted); font-size: 0.74rem; }
      .crumbs.compact { margin-bottom: 2px; font-size: 0.76rem; } .head.compact { margin-bottom: 8px; gap: 6px 16px; } .head.compact h1 { font-size: 1.45rem; margin: 0; } .head.compact p { font-size: 0.8rem; } .head.compact .script { display: none; } .head.compact .secure { padding: 7px 12px; } .head.compact .secure .material-icons { font-size: 26px; } .head.compact .secure small { font-size: 0.7rem; }
      @media (max-width: 1100px) { .head { grid-template-columns: 1fr; } .script { display: none; } .secure { max-width: none; } }
    `,
  ],
  styleUrl: '../../website/website-ui.scss',
})
export class ProfileHeadComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly script = input('');
  readonly secureTitle = input('Your information is secure');
  readonly secureText = input('We use bank-grade security to protect your data.');
  readonly icon = input('verified_user');
  readonly tone = input<'green' | 'blue'>('green');
  readonly crumbs = input<{ label: string; link?: string }[]>([]);
  /** Tighter spacing for pages that should fit on one screen. */
  readonly compact = input(false);
}
