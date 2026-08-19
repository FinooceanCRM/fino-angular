import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

import { SEARCH_TYPE_LABEL, SEARCH_TYPE_ORDER, SearchResult, SearchResultType } from '../../data/models/search.model';
import { GlobalSearchDataProvider } from '../../data/providers/global-search.provider';

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
  private readonly searchData = inject(GlobalSearchDataProvider);

  protected readonly typeLabel = SEARCH_TYPE_LABEL;
  protected readonly types = SEARCH_TYPE_ORDER;

  private readonly queryParams = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly queryText = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly activeType = computed(() => (this.queryParams().get('type') as SearchResultType | null) ?? '');

  protected readonly term = computed(() => this.queryParams().get('q') ?? '');

  protected readonly counts = computed(() => this.searchData.countsByType(this.term()));
  protected readonly totalCount = computed(() =>
    this.types.reduce((sum, type) => sum + this.counts()[type], 0),
  );

  protected readonly results = computed(() => {
    const type = this.activeType();
    return this.searchData.search(this.term(), type ? [type] : undefined);
  });

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
    void this.router.navigate(result.route, { queryParams: result.queryParams });
  }
}
