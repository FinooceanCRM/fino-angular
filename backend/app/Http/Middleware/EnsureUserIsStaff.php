<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps public-website customers out of every CRM route. A customer token is
 * a valid Sanctum token, so without this a customer could reach any endpoint
 * that only checks `auth:sanctum`.
 */
class EnsureUserIsStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->roleEnum() === UserRole::Customer) {
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
