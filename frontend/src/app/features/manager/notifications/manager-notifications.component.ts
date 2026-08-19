import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatCardComponent } from '@shared/components/stat-card.component';

import { AppNotification, NOTIFICATION_CATEGORY_LABEL } from '@features/super-admin/data/models/notification.model';
import { NotificationDataProvider } from '@features/super-admin/data/providers/notification-data.provider';

const NOW = new Date('2026-08-15T10:00:00+05:30');

/**
 * Notification Center — reuses Super Admin's `NotificationDataProvider`
 * directly (one shared, root-provided notification feed backs every role's
 * center), so read/unread state stays in sync everywhere it's shown.
 */
@Component({
  selector: 'app-manager-notifications',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
  ],
  templateUrl: './manager-notifications.component.html',
  styleUrl: './manager-notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerNotificationsComponent {
  readonly subtitle = input('Updates relevant to you and your team.');

  private readonly fb = inject(FormBuilder);
  private readonly notificationData = inject(NotificationDataProvider);

  protected readonly categoryLabel = NOTIFICATION_CATEGORY_LABEL;
  protected readonly categories = Object.entries(NOTIFICATION_CATEGORY_LABEL);

  protected readonly items = this.notificationData.notifications;

  protected readonly filters = this.fb.nonNullable.group({
    search: '',
    category: '',
    unreadOnly: false,
  });

  private readonly filterValues = toSignal(this.filters.valueChanges, { initialValue: this.filters.getRawValue() });

  protected readonly summary = computed(() => {
    const all = this.items();
    const todayStart = new Date(NOW);
    todayStart.setHours(0, 0, 0, 0);

    return {
      total: all.length,
      unread: all.filter((n) => !n.is_read).length,
      today: all.filter((n) => new Date(n.created_at) >= todayStart).length,
    };
  });

  protected readonly filteredItems = computed(() => {
    const f = this.filterValues();
    const search = (f.search ?? '').trim().toLowerCase();

    return this.items()
      .filter((n) => {
        const matchesSearch = !search || n.title.toLowerCase().includes(search) || n.body.toLowerCase().includes(search);
        const matchesCategory = !f.category || n.category === f.category;
        const matchesUnread = !f.unreadOnly || !n.is_read;
        return matchesSearch && matchesCategory && matchesUnread;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  protected readonly todayItems = computed(() => this.filteredItems().filter((n) => this.isToday(n.created_at)));
  protected readonly earlierItems = computed(() => this.filteredItems().filter((n) => !this.isToday(n.created_at)));

  private isToday(iso: string): boolean {
    const todayStart = new Date(NOW);
    todayStart.setHours(0, 0, 0, 0);
    return new Date(iso) >= todayStart;
  }

  protected markRead(notification: AppNotification): void {
    this.notificationData.markRead(notification.id);
  }

  protected markAllRead(): void {
    this.notificationData.markAllRead();
  }
}
