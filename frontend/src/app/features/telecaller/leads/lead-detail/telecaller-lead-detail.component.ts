import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ManagerLeadDetailComponent } from '@features/manager/leads/lead-detail/manager-lead-detail.component';

import { TelecallerLeadPanelComponent } from '../lead-panel/telecaller-lead-panel.component';

/**
 * Lead Details, Telecaller-scoped. Reuses `ManagerLeadDetailComponent`
 * unmodified for the read-only overview (same as Employee/RM), with the
 * Reassign entry point hidden since a Telecaller may never assign or
 * reassign a lead. Telecaller-only actions (status change, documents, PD
 * completion, follow-ups/notes) live in the sibling
 * `TelecallerLeadPanelComponent` below it, so the shared detail component
 * stays untouched for every other role.
 */
@Component({
  selector: 'app-telecaller-lead-detail',
  standalone: true,
  imports: [ManagerLeadDetailComponent, TelecallerLeadPanelComponent],
  template: `
    <app-manager-lead-detail basePath="/telecaller/leads" [showReassign]="false" />
    <app-telecaller-lead-panel />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelecallerLeadDetailComponent {}
