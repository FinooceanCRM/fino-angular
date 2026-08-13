<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends BaseApiController
{
    public function __construct(private readonly ReportService $reports)
    {
    }

    public function dashboard(Request $request): JsonResponse
    {
        return $this->respondSuccess($this->reports->dashboard($request->user()));
    }
}
