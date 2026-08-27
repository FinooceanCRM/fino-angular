<?php

namespace App\Http\Middleware;

use App\Services\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('permission:users.view')
 *
 * DB-driven (`roles` / `permissions` / `permission_role`, see
 * RolePermissionService) rather than the old `App\Enums\Permission` enum —
 * the alias and multi-slug signature are unchanged, so existing usages keep
 * working unchanged.
 */
class EnsureUserCanManageUsers
{
    public function __construct(private readonly RolePermissionService $permissions)
    {
    }

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->deny('Unauthenticated.', 401);
        }

        foreach ($permissions as $permission) {
            if (! $this->permissions->roleHas($user, $permission)) {
                return $this->deny('You are not authorised to perform this action.', 403);
            }
        }

        return $next($request);
    }

    private function deny(string $message, int $status): Response
    {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => (object) [],
        ], $status);
    }
}
