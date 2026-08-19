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

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { ReasonDialogComponent } from '@shared/components/reason-dialog.component';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';
import { TableCellDirective } from '@shared/components/table-cell.directive';
import { TableColumn, TableComponent } from '@shared/components/table.component';

import { KycDocument, RelationshipManagerKycDataProvider } from './data/relationship-manager-kyc.provider';

/** KYC Verification — review queue for PAN/Aadhaar/income documents on this RM's own leads. */
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
  protected readonly kyc = inject(RelationshipManagerKycDataProvider);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statusFilter = signal<'pending' | 'all'>('pending');

  protected readonly counts = computed(() => {
    const docs = this.kyc.documents();
    return {
      pending: docs.filter((d) => d.status === 'pending').length,
      verified: docs.filter((d) => d.status === 'verified').length,
      rejected: docs.filter((d) => d.status === 'rejected').length,
    };
  });

  protected readonly rows = computed(() => {
    const docs = this.kyc.documents();
    return this.statusFilter() === 'pending' ? docs.filter((d) => d.status === 'pending') : docs;
  });

  protected readonly columns: TableColumn<KycDocument>[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'documentType', label: 'Document' },
    { key: 'fileName', label: 'File' },
    { key: 'uploadedBy', label: 'Uploaded by' },
    { key: 'uploadedAt', label: 'Uploaded' },
    { key: 'status', label: 'Status' },
  ];

  protected leadLabel(doc: KycDocument): string {
    const lead = this.kyc.leadFor(doc.leadId);
    return lead ? `${lead.reference} — ${lead.applicant_name}` : `Lead #${doc.leadId}`;
  }

  protected statusColour(doc: KycDocument): string {
    if (doc.status === 'verified') return 'success';
    if (doc.status === 'rejected') return 'warn';
    return 'accent';
  }

  protected verify(doc: KycDocument): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Verify document', message: `Mark "${doc.fileName}" as verified?`, confirmLabel: 'Verify' },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.kyc.verify(doc.id);
        this.snackBar.open('Document verified.', 'Dismiss', { duration: 4000 });
      });
  }

  protected reject(doc: KycDocument): void {
    this.dialog
      .open(ReasonDialogComponent, {
        data: {
          title: 'Reject document',
          message: `Rejecting "${doc.fileName}". The reason is shown to the uploader.`,
          reasonLabel: 'Reason for rejection',
          confirmLabel: 'Reject',
        },
      })
      .afterClosed()
      .subscribe((reason: string | undefined) => {
        if (!reason) {
          return;
        }

        this.kyc.reject(doc.id, reason);
        this.snackBar.open('Document rejected.', 'Dismiss', { duration: 4000 });
      });
  }
}
