import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UserRoleTableComponent } from '../user-role-table/user-role-table.component';

@Component({
  selector: 'app-super-admin-relationship-managers',
  standalone: true,
  imports: [UserRoleTableComponent],
  template: `
    <app-super-admin-user-role-table
      role="relationship_manager"
      roleLabel="Relationship Manager"
      title="Relationship Managers"
      subtitle="Manage Relationship Manager accounts across the platform."
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuperAdminRelationshipManagersComponent {}
