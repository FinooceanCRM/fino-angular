import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Task, TaskActivityType } from '@core/models/task.model';
import { BucketNavComponent, BucketNavLink } from '@shared/components/bucket-nav.component';

interface BucketDef {
  label: string;
  route: string;
  /** Key into `counts()` this pill's badge reads from — omitted for buckets with no well-defined single-type count (e.g. Follow-ups, which spans every type). */
  countKey?: string;
}

const BUCKETS: BucketDef[] = [
  { label: 'All', route: '/tasks', countKey: 'all' },
  { label: 'Calls', route: '/tasks/calls', countKey: 'call' },
  { label: 'Meetings', route: '/tasks/meetings', countKey: 'meeting' },
  { label: 'Reminders', route: '/tasks/reminders', countKey: 'reminder' },
  { label: 'Follow-ups', route: '/tasks/follow-ups' },
];

/**
 * Real per-bucket badge counts — open (`status === 'pending'`) tasks of each
 * type — computed client-side from an already-loaded, unfiltered task list
 * (every `TasksComponent` instance loads one, see its `reload()`), so no
 * extra API call is needed. Shared by `TasksComponent` (which owns its own
 * list) and `TaskFollowUpsComponent` (which has none of its own and sources
 * one via a child `TasksComponent`'s `(tasksLoaded)` output) so the counting
 * rule can't drift between the two call sites.
 */
export function computeTaskBucketCounts(tasks: readonly Task[]): Record<string, number> {
  const open = tasks.filter((task) => task.status === 'pending');
  const byType = (type: TaskActivityType) => open.filter((task) => task.type === type).length;
  return {
    all: open.length,
    call: byType('call'),
    meeting: byType('meeting'),
    reminder: byType('reminder'),
  };
}

/**
 * Bucket navigation strip shown at the top of every Tasks page. Composes the
 * shared `BucketNavComponent` (rather than re-declaring the pill markup —
 * see the module JSDoc on that component) so the count-badge feature added
 * for the Tidewater task-list mock stays in one place. `counts`, when
 * supplied, are real per-type open-task counts already loaded by the caller
 * (`TasksComponent.bucketCounts`) — a bucket with no matching key (Follow-ups
 * spans every type, so there's no single honest count for it) simply renders
 * without a badge rather than showing a fabricated number.
 */
@Component({
  selector: 'app-task-bucket-nav',
  standalone: true,
  imports: [BucketNavComponent],
  template: `<app-bucket-nav class="task-bucket-nav" [links]="links()" ariaLabel="Task type" />`,
  styles: [
    `
      /* Scoped to this component only (via the host-only class + ::ng-deep on
         the projected shared component's markup) so the Tidewater teal-fill
         active state doesn't change the look of every other page that reuses
         the plain BucketNavComponent (e.g. the Banker lead buckets). */
      :host ::ng-deep .task-bucket-nav .bucket-nav__link--active {
        background: var(--tide-color-secondary);
        border-color: var(--tide-color-secondary);
        color: var(--tide-color-text-inverse);
      }
      :host ::ng-deep .task-bucket-nav .bucket-nav__link--active .bucket-nav__count {
        background: rgba(255, 255, 255, 0.3);
        color: var(--tide-color-text-inverse);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBucketNavComponent {
  /** Real per-bucket open-task counts, keyed by `BucketDef.countKey` (e.g. `{ all: 28, call: 12, meeting: 3, reminder: 5 }`). Omit a key (or the whole input) to render that pill without a badge rather than fabricate a count. */
  readonly counts = input<Partial<Record<string, number>>>({});

  protected readonly links = computed<BucketNavLink[]>(() => {
    const counts = this.counts();
    return BUCKETS.map((bucket) => ({
      label: bucket.label,
      route: bucket.route,
      count: bucket.countKey ? counts[bucket.countKey] : undefined,
    }));
  });
}
