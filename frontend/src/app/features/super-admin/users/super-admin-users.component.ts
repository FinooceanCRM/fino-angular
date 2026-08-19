import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyStateComponent } from '@shared/components/empty-state.component';
import { PageHeaderComponent } from '@shared/components/page-header.component';

@Component({
  selector: 'app-super-admin-users',
  standalone: true,
  imports: [EmptyStateComponent, PageHeaderComponent],
  templateUrl: './super-admin-users.component.html',
  styleUrl: './super-admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminUsersComponent {}
