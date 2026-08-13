<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('role:super_admin,manager')
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthenticated.',
                'errors' => (object) [],
            ], 401);
        }

        if ($roles !== [] && ! $user->hasRole(...$roles)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You are not authorised to perform this action.',
                'errors' => (object) [],
            ], 403);
        }

        return $next($request);
    }
}
