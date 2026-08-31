import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * One node of an org chart tree. `children` is optional and may itself
 * contain nodes with their own `children`, so a single `OrgChartNode` tree
 * can represent any real reporting depth (e.g. Manager → Relationship
 * Manager → Employee), not just a fixed "one root, N children" shape.
 */
export interface OrgChartNode {
  id: string | number;
  label: string;
  sublabel?: string;
  children?: OrgChartNode[];
}

/**
 * "Priya Nair" -> "PN"; single-word names fall back to their first two
 * letters. Exported so the avatar-initials chips used elsewhere (e.g. the
 * Team performance tables) render the same initials as the org chart does,
 * without duplicating the logic.
 */
export function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generic top-down org chart: a node card, a connector down to a row of
 * child cards, each wired up to a shared horizontal line — the standard
 * org-chart look. Renders any number of children, and recurses into a
 * child's own `children` (if present) so real multi-level hierarchies (not
 * just a single root + siblings) render correctly. Plain CSS, no chart
 * library. Reused by every role's Team Hierarchy view; fed real
 * {label, sublabel, children} nodes by each caller — this component knows
 * nothing about managers/RMs/employees, just how to draw a tree.
 */
@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [OrgChartComponent],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgChartComponent {
  /** The node rendered at this level; pass the tree's root at the top-level call site. */
  readonly node = input.required<OrgChartNode>();
  /**
   * Avatar tint for THIS node's card. Callers should leave this at the
   * default 'action' (coral) for the root; every recursive child render
   * always passes 'secondary' (teal), regardless of depth, matching the
   * Tidewater mockup (coral root, teal reports).
   */
  readonly tint = input<'action' | 'secondary'>('action');

  protected readonly initials = computed(() => initialsOf(this.node().label));
}
