import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';

import { SEARCH_TYPE_LABEL, SEARCH_TYPE_ORDER, SearchResult, SearchResultType } from '@core/models/search.model';
import { SearchService } from '@core/services/search.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';

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
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, EmptyStateComponent],
  templateUrl: './super-admin-search-overlay.component.html',
  styleUrl: './super-admin-search-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSearchOverlayComponent implements AfterViewInit {
  private readonly dialogRef = inject(MatDialogRef<SuperAdminSearchOverlayComponent>);
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);

  @ViewChild('searchInput') private readonly searchInput?: ElementRef<HTMLInputElement>;

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly loading = signal(false);
  protected readonly allResults = signal<SearchResult[]>([]);

  protected readonly groups = computed<ResultGroup[]>(() => {
    const all = this.allResults();
    return SEARCH_TYPE_ORDER.map((type) => {
      const matches = all.filter((r) => r.type === type);
      return { type, label: SEARCH_TYPE_LABEL[type], items: matches.slice(0, GROUP_LIMIT), total: matches.length };
    }).filter((group) => group.items.length > 0);
  });

  protected readonly flatResults = computed(() => this.groups().flatMap((g) => g.items));
  protected readonly totalCount = computed(() => this.groups().reduce((sum, g) => sum + g.total, 0));

  constructor() {
    effect(() => {
      const term = this.query();
      if (!term.trim()) {
        this.allResults.set([]);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.search.search(term).subscribe((response) => {
        this.allResults.set(response.results);
        this.loading.set(false);
      });
    });
  }

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
    void this.router.navigate(result.route, { queryParams: result.query_params ?? undefined });
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
