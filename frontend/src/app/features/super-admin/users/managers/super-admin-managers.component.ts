import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';

@Component({
  selector: 'app-super-admin-managers',
  standalone: true,
  imports: [UserRoleTableComponent],
  template: `
    <app-super-admin-user-role-table
      role="manager"
      roleLabel="Manager"
      title="Managers"
      subtitle="Manage Manager accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminManagersComponent {}
