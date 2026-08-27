import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { LeadDocument } from '@core/models/document.model';
import { DocumentService } from '@core/services/document.service';
import { RelationshipManagerService } from '@core/services/relationship-manager.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

/**
 * KYC Verification — review queue for PAN/Aadhaar/income documents on this
 * RM's own leads. Backed by the real Document feature (Phase 5, Part B):
 * `RelationshipManagerService.kycQueue()` + `DocumentService.verify/reject`.
 */
@Component({
  selector: 'app-relationship-manager-kyc',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatCardComponent,
    StatusPillComponent,
    TableCellDirective,
    TableComponent,
  ],
  templateUrl: './relationship-manager-kyc.component.html',
  styleUrl: './relationship-manager-kyc.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerKycComponent {
  private readonly relationshipManagers = inject(RelationshipManagerService);
  private readonly documents = inject(DocumentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');
  protected readonly allDocuments = signal<LeadDocument[]>([]);
  protected readonly loading = signal(false);

  protected readonly counts = computed(() => {
    const docs = this.allDocuments();
    return {
      pending: docs.filter((d) => d.status === 'pending').length,
      verified: docs.filter((d) => d.status === 'verified').length,
      rejected: docs.filter((d) => d.status === 'rejected').length,
    };
  });

  protected readonly rows = computed(() => {
    const docs = this.allDocuments();
    return this.statusFilter() === 'pending' ? docs.filter((d) => d.status === 'pending') : docs;
  });

  protected readonly columns: TableColumn<LeadDocument>[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'documentType', label: 'Document', formatter: (row) => row.document_type_label },
    { key: 'fileName', label: 'File', formatter: (row) => row.original_name },
    { key: 'uploadedBy', label: 'Uploaded by', formatter: (row) => row.uploaded_by?.name ?? '—' },
    { key: 'uploadedAt', label: 'Uploaded' },
    { key: 'status', label: 'Status' },
  ];

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.relationshipManagers.kycQueue().subscribe({
      next: (documents) => {
        this.allDocuments.set(documents);
        this.loading.set(false);
      },
      error: () => {
        this.allDocuments.set([]);
        this.loading.set(false);
      },
    });
  }

  protected leadLabel(doc: LeadDocument): string {
    return doc.lead ? `${doc.lead.reference} — ${doc.lead.applicant_name}` : `Lead #${doc.loan_lead_id}`;
  }

  protected statusColour(doc: LeadDocument): string {
    if (doc.status === 'verified') return 'success';
    if (doc.status === 'rejected') return 'warn';
    return 'accent';
  }

  protected verify(doc: LeadDocument): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Verify document', message: `Mark "${doc.original_name}" as verified?`, confirmLabel: 'Verify' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.documents.verify(doc.id).subscribe({
          next: () => {
            this.snackBar.open('Document verified.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: () => this.snackBar.open('Could not verify this document.', 'Dismiss', { duration: 4000 }),
        });
      });
  }

  protected reject(doc: LeadDocument): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject document',
          message: `Rejecting "${doc.original_name}". The reason is shown to the uploader.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.documents.reject(doc.id, reason).subscribe({
          next: () => {
            this.snackBar.open('Document rejected.', 'Dismiss', { duration: 4000 });
            this.load();
          },
          error: () => this.snackBar.open('Could not reject this document.', 'Dismiss', { duration: 4000 }),
        });
      });
  }
}
