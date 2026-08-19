import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';
import { currentEmployeeId } from '@features/employee/current-employee';
import { ModalComponent } from '@shared/components/modal.component';

import { TaskActivityType, TaskDraft, TaskPriority } from '../data/task.provider';

export interface TaskFormDialogData {
  type: TaskActivityType;
}

const TYPE_LABEL: Record<TaskActivityType, string> = { call: 'call', meeting: 'meeting', task: 'task', reminder: 'reminder' };

/** Create a new call / meeting / task / reminder, optionally linked to one of the signed-in Employee's own leads. */
@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent],
  template: `
    <app-modal [title]="dialogTitle" [showActions]="true">
      <mat-form-field appearance="outline" class="field">
        <mat-label>Title</mat-label>
        <input matInput [ngModel]="title()" (ngModelChange)="title.set($event)" placeholder="e.g. Call customer re: income proof" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Description (optional)</mat-label>
        <textarea matInput rows="2" [ngModel]="description()" (ngModelChange)="description.set($event)"></textarea>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>Related lead</mat-label>
        <mat-select [ngModel]="leadId()" (ngModelChange)="leadId.set($event)">
          <mat-option [value]="null">General (not linked to a lead)</mat-option>
          @for (lead of myLeads(); track lead.id) {
            <mat-option [value]="lead.id">{{ lead.reference }} — {{ lead.applicant_name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class="field-row">
        <mat-form-field appearance="outline" class="field">
          <mat-label>Due date</mat-label>
          <input matInput type="date" [ngModel]="dueDate()" (ngModelChange)="dueDate.set($event)" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Priority</mat-label>
          <mat-select [ngModel]="priority()" (ngModelChange)="priority.set($event)">
            <mat-option value="low">Low</mat-option>
            <mat-option value="medium">Medium</mat-option>
            <mat-option value="high">High</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <button modal-actions mat-button type="button" (click)="dialogRef.close()">Cancel</button>
      <button modal-actions mat-flat-button color="primary" type="button" [disabled]="!canSubmit()" (click)="submit()">
        Create {{ typeLabel }}
      </button>
    </app-modal>
  `,
  styles: [
    `
      .field {
        display: block;
        width: 100%;
      }
      .field-row {
        display: flex;
        gap: 1rem;
      }
      .field-row .field {
        flex: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialogComponent {
  protected readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<TaskFormDialogComponent, TaskDraft>);
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly employeeId = currentEmployeeId();

  protected readonly typeLabel = TYPE_LABEL[this.data.type];
  protected readonly dialogTitle = `New ${this.typeLabel}`;

  protected readonly myLeads = computed(() =>
    this.leadData.leads().filter((lead) => lead.assigned_employee?.id === this.employeeId),
  );

  protected readonly title = signal('');
  protected readonly description = signal('');
  protected readonly leadId = signal<number | null>(null);
  protected readonly priority = signal<TaskPriority>('medium');
  protected readonly dueDate = signal('');

  protected readonly canSubmit = computed(() => this.title().trim().length > 0 && this.dueDate().length > 0);

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const lead = this.leadId() !== null ? this.leadData.getById(this.leadId()!) : undefined;

    this.dialogRef.close({
      type: this.data.type,
      title: this.title().trim(),
      description: this.description().trim() || null,
      leadId: lead?.id ?? null,
      relatedTo: lead ? `${lead.reference} — ${lead.applicant_name}` : 'General',
      priority: this.priority(),
      dueAt: new Date(this.dueDate() + 'T10:00:00').toISOString(),
    });
  }
}
