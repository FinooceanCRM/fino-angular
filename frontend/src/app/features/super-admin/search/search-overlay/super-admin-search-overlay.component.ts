import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state.component';

import { SEARCH_TYPE_LABEL, SEARCH_TYPE_ORDER, SearchResult, SearchResultType } from '../../data/models/search.model';
import { GlobalSearchDataProvider } from '../../data/providers/global-search.provider';

const GROUP_LIMIT = 5;

interface ResultGroup {
  type: SearchResultType;
  label: string;
  items: SearchResult[];
  total: number;
}

/**
 * Command-palette style overlay opened from `SuperAdminSearchTriggerComponent`
 * (click, or Ctrl/Cmd+K). Groups matches by category, supports arrow-key +
 * Enter quick navigation straight to the matched record.
 */
@Component({
  selector: 'app-super-admin-search-overlay',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, EmptyStateComponent],
  templateUrl: './super-admin-search-overlay.component.html',
  styleUrl: './super-admin-search-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSearchOverlayComponent implements AfterViewInit {
  private readonly dialogRef = inject(MatDialogRef<SuperAdminSearchOverlayComponent>);
  private readonly router = inject(Router);
  private readonly searchData = inject(GlobalSearchDataProvider);

  @ViewChild('searchInput') private readonly searchInput?: ElementRef<HTMLInputElement>;

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly groups = computed<ResultGroup[]>(() => {
    const term = this.query();
    if (!term.trim()) {
      return [];
    }

    const all = this.searchData.search(term);
    return SEARCH_TYPE_ORDER.map((type) => {
      const matches = all.filter((r) => r.type === type);
      return { type, label: SEARCH_TYPE_LABEL[type], items: matches.slice(0, GROUP_LIMIT), total: matches.length };
    }).filter((group) => group.items.length > 0);
  });

  protected readonly flatResults = computed(() => this.groups().flatMap((g) => g.items));
  protected readonly totalCount = computed(() => this.groups().reduce((sum, g) => sum + g.total, 0));

  ngAfterViewInit(): void {
    this.searchInput?.nativeElement.focus();
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const flat = this.flatResults();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = flat[this.activeIndex()];
      if (active) {
        this.select(active);
      } else if (this.query().trim()) {
        this.viewAll();
      }
    }
  }

  protected isActive(result: SearchResult): boolean {
    return this.flatResults()[this.activeIndex()]?.id === result.id;
  }

  protected select(result: SearchResult): void {
    this.dialogRef.close();
    void this.router.navigate(result.route, { queryParams: result.queryParams });
  }

  protected viewAll(): void {
    const q = this.query().trim();
    if (!q) {
      return;
    }
    this.dialogRef.close();
    void this.router.navigate(['/super-admin/search'], { queryParams: { q } });
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
