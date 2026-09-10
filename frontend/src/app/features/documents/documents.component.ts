import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { DocumentTypeOption, LeadDocument } from '@core/models/document.model';
import { Lead } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { DocumentService } from '@core/services/document.service';
import { DownloadService } from '@core/services/download.service';
import { LeadService } from '@core/services/lead.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { FilterBarComponent, FilterFieldConfig, FilterFieldOption } from '@shared/components/filter-bar.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableComponent } from '@shared/components/table.component';

const STATUS_COLOUR: Record<string, 'default' | 'accent' | 'success' | 'warn'> = {
  pending: 'accent',
  verified: 'success',
  rejected: 'warn',
};

/** `LeadDocument.status` has no backend-provided display label (unlike `Lead.status_label`), so this is purely a display formatter — the raw value is still what every API call and permission check uses. */
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

const STATUS_FILTER_OPTIONS: FilterFieldOption[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

/** A `LeadDocument` widened with the parent lead's reference/applicant name, joined client-side from the leads list (see `loadAllDocuments`) so the flat cross-lead table can show them without a dedicated backend endpoint. */
export interface DocumentRow extends LeadDocument {
  leadReference: string;
  applicantName: string;
}

/**
 * Documents page. The primary view is a flat, read-only table of every
 * document across every lead visible to the current user — there is no
 * backend endpoint for that, so it's assembled client-side: fetch the
 * user's visible leads (`LeadService.list`), then fan out one
 * `DocumentService.listForLead` call per lead and flatten the results
 * (`loadAllDocuments`). That's real data honestly joined, but it is N+1
 * fetching with no server-side pagination — fine for the handful of leads
 * a single user typically sees, but it re-fetches every lead's documents
 * on every page load and would not scale to a user with hundreds of
 * visible leads without a dedicated aggregate endpoint. Search/type/status
 * filtering below therefore runs entirely client-side over the already
 * -fetched rows, so applying a filter never re-triggers the fan-out.
 *
 * The original per-lead workspace (pick a lead, then upload/manage just
 * that lead's files) is unchanged in behaviour and kept fully reachable in
 * the "Upload a document" panel below the table.
 */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    DatePipe,
    FilterBarComponent,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent implements OnInit {
  private readonly leadsApi = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly downloads = inject(DownloadService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  readonly leadControl = this.fb.nonNullable.control<number | null>(null);
  readonly documentTypeControl = this.fb.nonNullable.control('aadhaar');
  readonly leads = signal<Lead[]>([]);
  readonly documents = signal<LeadDocument[]>([]);
  readonly documentTypes = signal<DocumentTypeOption[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly dragging = signal(false);
  readonly error = signal<string | null>(null);

  /** Flat cross-lead rows for the primary table — see class doc for how these are sourced. */
  readonly allDocuments = signal<DocumentRow[]>([]);
  readonly loadingAll = signal(false);
  readonly activeFilters = signal<Record<string, string>>({ search: '', document_type: '', status: '' });
  readonly pageIndex = signal(0);
  readonly pageSize = signal(15);

  /** Document-type filter options, derived from whatever types actually appear in the fetched rows (not a static catalogue) so the filter never offers a type nobody has. */
  private readonly documentTypeFilterOptions = computed<FilterFieldOption[]>(() => {
    const seen = new Map<string, string>();
    for (const row of this.allDocuments()) {
      if (!seen.has(row.document_type)) {
        seen.set(row.document_type, row.document_type_label);
      }
    }
    return [
      { value: '', label: 'All types' },
      ...[...seen.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  });

  readonly filterFields = computed<FilterFieldConfig[]>(() => [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'Applicant or lead reference' },
    { key: 'document_type', label: 'Document type', type: 'select', options: this.documentTypeFilterOptions() },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_FILTER_OPTIONS },
  ]);

  readonly filteredRows = computed<DocumentRow[]>(() => {
    const { search, document_type: documentType, status } = this.activeFilters();
    const term = search.trim().toLowerCase();
    return this.allDocuments().filter((row) => {
      const matchesSearch =
        !term ||
        row.applicantName.toLowerCase().includes(term) ||
        row.leadReference.toLowerCase().includes(term);
      const matchesType = !documentType || row.document_type === documentType;
      const matchesStatus = !status || row.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  });

  readonly pagedRows = computed<DocumentRow[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  statusColour(status: string): 'default' | 'accent' | 'success' | 'warn' {
    return STATUS_COLOUR[status] ?? 'default';
  }

  statusLabel(status: string): string {
    return STATUS_LABEL[status] ?? status;
  }

  avatarColourClass(row: DocumentRow): string {
    return `documents__avatar--${row.loan_lead_id % 5}`;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.leadsApi.list({ per_page: 50 }).subscribe({
      next: (result) => {
        this.leads.set(result.items);
        this.loading.set(false);
        this.loadAllDocuments();
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(values: Record<string, string>): void {
    this.activeFilters.set(values);
    this.pageIndex.set(0);
  }

  onTablePage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  /**
   * Fans out one `listForLead` call per visible lead and flattens the
   * results — see the class doc comment for the honest N+1 caveat. Each
   * lead's own request is isolated with `catchError` so one lead failing
   * to load its documents doesn't blank the whole table.
   */
  private loadAllDocuments(): void {
    const leadsList = this.leads();
    if (leadsList.length === 0) {
      this.allDocuments.set([]);
      return;
    }

    this.loadingAll.set(true);
    const perLead: Observable<DocumentRow[]>[] = leadsList.map((lead) =>
      this.documentsApi.listForLead(lead.id).pipe(
        map((result) =>
          result.items.map(
            (item): DocumentRow => ({
              ...item,
              leadReference: lead.reference,
              applicantName: lead.applicant_name,
            }),
          ),
        ),
        catchError(() => of<DocumentRow[]>([])),
      ),
    );

    forkJoin(perLead).subscribe({
      next: (rowsPerLead) => {
        this.allDocuments.set(rowsPerLead.flat());
        this.loadingAll.set(false);
      },
      error: () => this.loadingAll.set(false),
    });
  }

  loadDocuments(): void {
    const leadId = this.leadControl.value;
    if (!leadId) {
      return;
    }

    this.loading.set(true);
    this.documentsApi.listForLead(leadId).subscribe({
      next: (result) => {
        this.documents.set(result.items);
        if (result.types.length > 0) {
          this.documentTypes.set(result.types);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
    input.value = '';
  }

  private uploadFile(file: File): void {
    const leadId = this.leadControl.value;
    if (!leadId) {
      this.error.set('Choose a lead before uploading a document.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    this.documentsApi.upload(leadId, file, this.documentTypeControl.value).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadDocuments();
        this.loadAllDocuments();
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('The document could not be uploaded.');
      },
    });
  }

  download(item: LeadDocument): void {
    this.documentsApi.download(item).subscribe({
      next: (blob) => void this.downloads.save(blob, item.original_name),
    });
  }

  /** Mirrors `DocumentPolicy::delete` — the uploader may remove their own file (a Manager/RM/Super Admin may remove any, but this page can't tell that from the document alone, so it only ever offers the uploader's own). */
  canRemove(item: LeadDocument): boolean {
    return item.uploaded_by?.id === this.auth.user()?.id;
  }

  remove(item: LeadDocument): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete document',
          message: `Delete "${item.original_name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.documentsApi.remove(item.id).subscribe({
          next: () => {
            this.snackBar.open('Document deleted.', 'Dismiss', { duration: 4000 });
            this.loadDocuments();
            this.loadAllDocuments();
          },
          error: () => this.snackBar.open('The document could not be deleted.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
