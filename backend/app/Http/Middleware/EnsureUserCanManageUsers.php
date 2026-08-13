<?php

namespace App\Http\Middleware;

use App\Enums\Permission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('permission:users.view')
 */
class EnsureUserCanManageUsers
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->deny('Unauthenticated.', 401);
        }

        foreach ($permissions as $permission) {
            $enum = Permission::tryFrom($permission);

            if ($enum === null || ! Permission::roleHas($user->roleEnum(), $enum)) {
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
