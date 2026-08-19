import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ModalComponent } from '@shared/components/modal.component';

import { ManagerLeadDataProvider } from '@features/manager/leads/data/providers/lead-data.provider';

import { currentRmId } from '../../leads/current-rm';
import { ActivityDraft, ActivityType } from '../data/relationship-manager-activity.provider';

export interface ActivityFormDialogData {
  type: ActivityType;
}

const TYPE_LABEL: Record<ActivityType, string> = {
  call: 'call',
  meeting: 'meeting',
  task: 'task',
  reminder: 'reminder',
};

/** Schedule a new call / meeting / task / reminder, optionally linked to one of the RM's own leads. */
@Component({
  selector: 'app-relationship-manager-activity-form-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, ModalComponent],
  templateUrl: './relationship-manager-activity-form-dialog.component.html',
  styleUrl: './relationship-manager-activity-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationshipManagerActivityFormDialogComponent {
  protected readonly data = inject<ActivityFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<RelationshipManagerActivityFormDialogComponent, ActivityDraft>);
  private readonly leadData = inject(ManagerLeadDataProvider);
  private readonly rmId = currentRmId();

  protected readonly typeLabel = TYPE_LABEL[this.data.type];

  protected readonly myLeads = computed(() =>
    this.leadData.leads().filter((lead) => lead.assigned_relationship_manager?.id === this.rmId),
  );

  protected readonly assignableTo = computed(() => [
    'Priya Nair',
    ...this.leadData.employeesOfRm(this.rmId).map((person) => person.name),
  ]);

  protected readonly title = signal('');
  protected readonly leadId = signal<number | null>(null);
  protected readonly assignedTo = signal('Priya Nair');
  protected readonly dueDate = signal('');
  protected readonly notes = signal('');

  protected readonly canSubmit = computed(() => this.title().trim().length > 0 && this.dueDate().length > 0);

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const lead = this.leadId() ? this.leadData.getById(this.leadId()!) : undefined;

    this.dialogRef.close({
      title: this.title().trim(),
      relatedTo: lead ? `${lead.reference} — ${lead.applicant_name}` : 'General',
      leadId: lead?.id ?? null,
      dueAt: new Date(this.dueDate() + 'T10:00:00').toISOString(),
      assignedTo: this.assignedTo(),
      notes: this.notes().trim() || null,
    });
  }
}
