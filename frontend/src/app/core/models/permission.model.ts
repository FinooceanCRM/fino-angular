/** Real roles/permissions matrix, served by `GET /permissions/matrix` (Phase 0). */
export interface PermissionRole {
  id: number;
  slug: string;
  name: string;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface PermissionModule {
  key: string;
  label: string;
  actions: PermissionAction[];
}

export interface PermissionMatrix {
  roles: PermissionRole[];
  modules: PermissionModule[];
  /** grants[roleSlug][moduleKey] -> the actions granted. */
  grants: Record<string, Record<string, PermissionAction[]>>;
}

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};
