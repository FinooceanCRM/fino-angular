import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { SEARCH_TYPE_LABEL, SEARCH_TYPE_ORDER, SearchResult, SearchResultType } from '@core/models/search.model';
import { SearchService } from '@core/services/search.service';
import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

const EMPTY_COUNTS: Record<SearchResultType, number> = { lead: 0, user: 0, employee: 0, connector: 0, banker: 0 };

/** `/super-admin/search?q=…&type=…` — the full results view behind the search overlay's "View all". */
@Component({
  selector: 'app-super-admin-search-results',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    EmptyStateComponent,
    PageHeaderComponent,
  ],
  templateUrl: './super-admin-search-results.component.html',
  styleUrl: './super-admin-search-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminSearchResultsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);

  protected readonly typeLabel = SEARCH_TYPE_LABEL;
  protected readonly types = SEARCH_TYPE_ORDER;

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly queryText = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly activeType = computed(() => (this.queryParams().get('type') as SearchResultType | null) ?? '');
  protected readonly term = computed(() => this.queryParams().get('q') ?? '');

  protected readonly loading = signal(false);
  protected readonly results = signal<SearchResult[]>([]);
  protected readonly counts = signal<Record<SearchResultType, number>>({ ...EMPTY_COUNTS });

  protected readonly totalCount = computed(() => this.types.reduce((sum, type) => sum + this.counts()[type], 0));

  constructor() {
    // Reacts to every source of change (search box submit, chip filter, and
    // browser back/forward through query-param history alike) rather than
    // only the actions this component itself triggers.
    effect(() => {
      const term = this.term();
      const type = this.activeType();

      if (!term.trim()) {
        this.results.set([]);
        this.counts.set({ ...EMPTY_COUNTS });
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.search.search(term, type ? [type] : undefined).subscribe((response) => {
        this.results.set(response.results);
        this.counts.set(response.counts);
        this.loading.set(false);
      });
    });
  }

  protected submit(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.queryText().trim() || null },
      queryParamsHandling: 'merge',
    });
  }

  protected setType(type: SearchResultType | ''): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: type || null },
      queryParamsHandling: 'merge',
    });
  }

  protected select(result: SearchResult): void {
    void this.router.navigate(result.route, { queryParams: result.query_params ?? undefined });
  }
}
