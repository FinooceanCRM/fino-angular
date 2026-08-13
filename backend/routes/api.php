<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', [HealthController::class, 'index'])->name('health');

    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('auth.login');

    Route::middleware(['auth:sanctum', 'auth.active'])->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        Route::prefix('users')->name('users.')->group(function (): void {
            Route::get('/', [UserController::class, 'index'])
                ->middleware('permission:users.view')->name('index');
            Route::get('{user}', [UserController::class, 'show'])
                ->middleware('permission:users.view')->name('show');
            Route::post('/', [UserController::class, 'store'])
                ->middleware('permission:users.create')->name('store');
            Route::put('{user}', [UserController::class, 'update'])
                ->middleware('permission:users.update')->name('update');
            Route::delete('{user}', [UserController::class, 'destroy'])
                ->middleware('permission:users.delete')->name('destroy');
        });
    });
});
