import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusPillColour = 'default' | 'primary' | 'accent' | 'success' | 'warn';

const KNOWN_COLOURS: ReadonlySet<string> = new Set<StatusPillColour>([
  'default',
  'primary',
  'accent',
  'success',
  'warn',
]);

/**
 * Colour-coded status pill. Colour comes from the backend (`status_colour`
 * / `colour` fields already returned by LeadStatus/AccessRequestStatus
 * catalogues) rather than being re-derived here, so the frontend never
 * drifts from the backend's notion of what each status means. The backend
 * field is typed as a plain `string`, so unrecognised values fall back to
 * `default` instead of producing an untargeted `pill--*` class.
 */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
})
export class StatusPillComponent {
  readonly label = input.required<string>();
  readonly colour = input<string>('default');

  protected readonly hostClass = computed(() => {
    const colour = this.colour();
    return `pill pill--${KNOWN_COLOURS.has(colour) ? colour : 'default'}`;
  });
}
