/**
 * The Super Admin module's "Users" interface group. Re-exports the real,
 * already-shared user model rather than duplicating it — there is only
 * ever one shape for a user, mock or eventually API-backed.
 */
export type {
  AuthenticatedUser,
  ManagedUser,
  UserRole,
  CreateUserPayload,
  UpdateUserPayload,
  UserListFilters,
} from '@core/models/user.model';
export { ROLE_LABELS, ROLE_HIERARCHY } from '@core/models/user.model';
