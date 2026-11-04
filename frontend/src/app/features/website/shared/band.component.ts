import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Dark call-to-action band used at the foot of most pages. */
@Component({
  selector: 'app-band',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="band">
      <div class="fw-container band__inner">
        <div><h2>{{ title() }}</h2><p>{{ text() }}</p></div>
        <a class="fw-btn fw-btn--primary" [routerLink]="link()" [queryParams]="params()">{{ cta() }} <span class="material-icons">arrow_forward</span></a>
      </div>
    </section>
  `,
  styles: [
    `
      .band { background: linear-gradient(90deg, #061a3d, #0d3a75); color: #fff; padding: 24px 0; }
      .band__inner { display: flex; justify-content: space-between; align-items: center; gap: 18px; flex-wrap: wrap; }
      h2 { margin: 0 0 4px; font-size: 1.25rem; } p { margin: 0; color: #cfe0ff; font-size: 0.88rem; }
      .fw-btn { color: #fff; } .material-icons { font-size: 18px; }
    `,
  ],
  styleUrl: '../website-ui.scss',
})
export class BandComponent {
  readonly title = input.required<string>();
  readonly text = input('');
  readonly cta = input.required<string>();
  readonly link = input('/apply');
  readonly params = input<Record<string, string>>({});
}
