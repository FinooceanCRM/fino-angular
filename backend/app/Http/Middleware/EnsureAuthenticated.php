<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authentication middleware for the API.
 *
 * Runs after `auth:sanctum` and guarantees the bearer token belongs to an
 * account that is still active. Usage: ->middleware(['auth:sanctum', 'auth.active'])
 */
class EnsureAuthenticated
{
    public function handle(Request $request, Closure $next): Response
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

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'This account has been deactivated.',
                'errors' => (object) [],
            ], 403);
        }

        return $next($request);
    }
}
