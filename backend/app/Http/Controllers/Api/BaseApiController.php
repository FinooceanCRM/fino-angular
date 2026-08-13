<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Base controller for every versioned API controller.
 * Guarantees a single, stable response envelope.
 */
abstract class BaseApiController extends Controller
{
    protected function respondSuccess(
        mixed $data = null,
        ?string $message = null,
        array $meta = [],
        int $status = 200,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
            'meta' => (object) $meta,
        ], $status);
    }

    protected function respondCreated(mixed $data = null, ?string $message = null): JsonResponse
    {
        return $this->respondSuccess($data, $message, [], 201);
    }

    protected function respondNoContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function respondError(
        string $message,
        int $status = 400,
        array $errors = [],
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => (object) $errors,
        ], $status);
    }
}
