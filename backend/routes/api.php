<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Phase 1 exposes only the health endpoint. Feature routes are added in
| later phases inside this versioned group.
*/

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', [HealthController::class, 'index'])->name('health');

    Route::middleware('auth:sanctum')->group(function (): void {
        // Authenticated routes are registered here in later phases.
    });
});
