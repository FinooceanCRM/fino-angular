<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Central translation of exceptions into the API error envelope.
 */
class ApiExceptionRenderer
{
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->render(function (Throwable $e, Request $request): ?JsonResponse {
            if (! $request->expectsJson() && ! $request->is('api/*')) {
                return null;
            }

            return self::render($e);
        });
    }

    protected static function render(Throwable $e): JsonResponse
    {
        [$status, $message, $errors] = match (true) {
            $e instanceof ValidationException => [422, 'The given data was invalid.', $e->errors()],
            $e instanceof AuthenticationException => [401, 'Unauthenticated.', []],
            $e instanceof ModelNotFoundException,
            $e instanceof NotFoundHttpException => [404, 'Resource not found.', []],
            $e instanceof DomainException => [$e->getStatus(), $e->getMessage(), $e->getErrors()],
            $e instanceof HttpExceptionInterface => [
                $e->getStatusCode(),
                $e->getMessage() ?: 'Request failed.',
                [],
            ],
            default => [500, config('app.debug') ? $e->getMessage() : 'Server error.', []],
        };

        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => (object) $errors,
        ], $status);
    }
}
