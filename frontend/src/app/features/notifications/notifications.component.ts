import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { AppNotification, notificationCategory } from '@core/models/notification.model';
import { NotificationService } from '@core/services/notification.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

type NotificationTab = 'all' | 'unread' | 'leads' | 'documents' | 'system';

const TABS: { key: NotificationTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'leads', label: 'Leads' },
  { key: 'documents', label: 'Documents' },
  { key: 'system', label: 'System' },
];

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCardModule, MatListModule, MatProgressBarModule, MatTabsModule, PageHeaderComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly notifications = inject(NotificationService);

  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly selectedTabIndex = signal(0);

  protected readonly tabs = TABS;

  readonly filteredItems = computed(() => {
    const tab = TABS[this.selectedTabIndex()]?.key ?? 'all';
    return this.items().filter((item) => this.matchesTab(item, tab));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notifications.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markRead(item: AppNotification): void {
    this.notifications.markRead(item.id).subscribe({ next: () => this.load() });
  }

  markAllRead(): void {
    this.notifications.markAllRead().subscribe({ next: () => this.load() });
  }

  private matchesTab(item: AppNotification, tab: NotificationTab): boolean {
    if (tab === 'all') {
      return true;
    }
    if (tab === 'unread') {
      return !item.is_read;
    }
    return notificationCategory(item.type) === tab;
  }
}
