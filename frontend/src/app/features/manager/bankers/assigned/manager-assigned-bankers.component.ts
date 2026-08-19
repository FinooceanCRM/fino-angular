import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { StatusPillComponent } from '@shared/components/status-pill.component';

import { loanTypeLabel } from '../../leads/data/models/lead.model';
import { ManagerBankerDataProvider } from '../data/manager-banker.provider';

/** Assigned Bankers — banker-centric view of which of the manager's leads each banker is handling. */
@Component({
  selector: 'app-manager-assigned-bankers',
  standalone: true,
  imports: [MatExpansionModule, MatListModule, EmptyStateComponent, PageHeaderComponent, StatusPillComponent],
  templateUrl: './manager-assigned-bankers.component.html',
  styleUrl: './manager-assigned-bankers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerAssignedBankersComponent {
  protected readonly bankers = inject(ManagerBankerDataProvider);
  protected readonly loanTypeLabel = loanTypeLabel;
}
