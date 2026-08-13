import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { LeadDocument } from '@core/models/document.model';
import { Lead } from '@core/models/lead.model';
import { DocumentService } from '@core/services/document.service';
import { LeadService } from '@core/services/lead.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';

/** Document workspace: pick a visible lead, then manage its files. */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Documents"
      subtitle="KYC and income files attached to your leads"
    />

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-card class="card">
      <mat-card-content class="inline">
        <mat-form-field appearance="outline">
          <mat-label>Lead</mat-label>
          <mat-select [formControl]="leadControl" (selectionChange)="loadDocuments()">
            @for (lead of leads(); track lead.id) {
              <mat-option [value]="lead.id">
                {{ lead.reference }} — {{ lead.applicant_name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (leadControl.value) {
          <a mat-stroked-button [routerLink]="['/leads', leadControl.value]">Open lead</a>
        }
      </mat-card-content>
    </mat-card>

    <mat-card class="card">
      <mat-card-content>
        @if (documents().length === 0) {
          <p class="muted">Select a lead to view its documents.</p>
        } @else {
          <mat-list>
            @for (item of documents(); track item.id) {
              <mat-list-item>
                <span matListItemTitle>
                  {{ item.document_type_label }} — {{ item.original_name }}
                </span>
                <span matListItemLine>{{ item.created_at | date: 'medium' }}</span>
                <span matListItemMeta>
                  <button mat-button (click)="download(item)">Download</button>
                </span>
              </mat-list-item>
            }
          </mat-list>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .card {
        margin-bottom: 1rem;
      }
      .inline {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .muted {
        opacity: 0.7;
      }
    `,
  ],
})
export class DocumentsComponent implements OnInit {
  private readonly leadsApi = inject(LeadService);
  private readonly documentsApi = inject(DocumentService);
  private readonly fb = inject(FormBuilder);

  readonly leadControl = this.fb.nonNullable.control<number | null>(null);
  readonly leads = signal<Lead[]>([]);
  readonly documents = signal<LeadDocument[]>([]);
  readonly loading = signal(false);

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
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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
}
