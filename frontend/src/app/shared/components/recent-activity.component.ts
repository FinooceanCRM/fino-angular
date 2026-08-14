import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { EmptyStateComponent } from './empty-state.component';

export interface ActivityItem {
  icon: string;
  title: string;
  description?: string;
  timestamp: string;
}

/** Recent-activity feed card, reused across every role dashboard. */
@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatListModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="recent-activity">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (items().length === 0) {
          <app-empty-state icon="history" message="No recent activity yet." />
        } @else {
          <mat-list>
            @for (item of items(); track item.title + item.timestamp) {
              <mat-list-item>
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.title }}</span>
                <span matListItemLine>
                  @if (item.description) {
                    {{ item.description }} ·
                  }
                  {{ item.timestamp | date: 'medium' }}
                </span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class RecentActivityComponent {
  readonly title = input('Recent activity');
  readonly items = input<ActivityItem[]>([]);
}
