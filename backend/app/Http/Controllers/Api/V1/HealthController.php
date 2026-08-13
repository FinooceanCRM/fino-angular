<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;

class HealthController extends BaseApiController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'status' => 'ok',
            'application' => config('app.name'),
            'environment' => config('app.env'),
            'api_version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
