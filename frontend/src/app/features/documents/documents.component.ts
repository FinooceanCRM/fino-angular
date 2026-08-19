import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { DocumentTypeOption, LeadDocument } from '@core/models/document.model';
import { Lead } from '@core/models/lead.model';
import { AuthService } from '@core/services/auth.service';
import { DocumentService } from '@core/services/document.service';
import { LeadService } from '@core/services/lead.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

const STATUS_COLOUR: Record<string, 'default' | 'accent' | 'success' | 'warn'> = {
  pending: 'accent',
  verified: 'success',
  rejected: 'warn',
};

/** Document workspace: pick a visible lead, then upload and manage its files. */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent implements OnInit {
  private readonly leadsApi = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
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

  statusColour(status: string): 'default' | 'accent' | 'success' | 'warn' {
    return STATUS_COLOUR[status] ?? 'default';
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.leadsApi.list({ per_page: 50 }).subscribe({
      next: (result) => {
        this.leads.set(result.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('The document could not be uploaded.');
      },
    });
  }

  download(item: LeadDocument): void {
    this.documentsApi.download(item).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = item.original_name;
        anchor.click();
        URL.revokeObjectURL(url);
      },
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
          },
          error: () => this.snackBar.open('The document could not be deleted.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
