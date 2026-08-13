<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\BankCriteriaController;
use App\Http\Controllers\Api\V1\ConnectorController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\RelationshipManagerController;
use App\Http\Controllers\Api\V1\ReportController;
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

        // Connector module (Phase 5). Independent of the reporting hierarchy.
        Route::prefix('connectors')->name('connectors.')
            ->middleware('role:connector')
            ->group(function (): void {
                Route::get('dashboard', [ConnectorController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [ConnectorController::class, 'profile'])->name('profile.show');
                Route::put('profile', [ConnectorController::class, 'updateProfile'])->name('profile.update');
            });

        // Employee module (Phase 6). Self-scoped; leaf of the reporting hierarchy.
        Route::prefix('employees')->name('employees.')
            ->middleware('role:employee')
            ->group(function (): void {
                Route::get('dashboard', [EmployeeController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [EmployeeController::class, 'profile'])->name('profile.show');
                Route::put('profile', [EmployeeController::class, 'updateProfile'])->name('profile.update');
                Route::get('team', [EmployeeController::class, 'team'])->name('team');
            });

        // Relationship Manager module (Phase 7). Self-scoped to their own team.
        Route::prefix('relationship-managers')->name('relationship-managers.')
            ->middleware('role:relationship_manager')
            ->group(function (): void {
                Route::get('dashboard', [RelationshipManagerController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [RelationshipManagerController::class, 'profile'])->name('profile.show');
                Route::put('profile', [RelationshipManagerController::class, 'updateProfile'])->name('profile.update');
                Route::get('employees', [RelationshipManagerController::class, 'employees'])->name('employees');
                Route::get('connectors', [RelationshipManagerController::class, 'connectors'])->name('connectors');
            });

        // Manager module (Phase 8). Scoped to their own RMs and employees.
        Route::prefix('managers')->name('managers.')
            ->middleware('role:manager')
            ->group(function (): void {
                Route::get('dashboard', [ManagerController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [ManagerController::class, 'profile'])->name('profile.show');
                Route::put('profile', [ManagerController::class, 'updateProfile'])->name('profile.update');
                Route::get('relationship-managers', [ManagerController::class, 'relationshipManagers'])
                    ->name('relationship-managers.index');
                Route::post('relationship-managers', [ManagerController::class, 'storeRelationshipManager'])
                    ->name('relationship-managers.store');
                Route::put('relationship-managers/{relationship_manager}', [ManagerController::class, 'updateRelationshipManager'])
                    ->whereNumber('relationship_manager')
                    ->name('relationship-managers.update');
                Route::get('employees', [ManagerController::class, 'employees'])->name('employees');
            });

        // Loan management workflow (Phase 9). Visibility is hierarchy-scoped
        // inside the repository; policies decide what each role may do.
        Route::prefix('leads')->name('leads.')->group(function (): void {
            Route::get('metadata', [LeadController::class, 'metadata'])->name('metadata');
            Route::get('assignable-users', [LeadController::class, 'assignableUsers'])->name('assignable-users');
            Route::get('/', [LeadController::class, 'index'])->name('index');
            Route::post('/', [LeadController::class, 'store'])->name('store');
            Route::get('{lead}', [LeadController::class, 'show'])->whereNumber('lead')->name('show');
            Route::put('{lead}', [LeadController::class, 'update'])->whereNumber('lead')->name('update');
            Route::delete('{lead}', [LeadController::class, 'destroy'])->whereNumber('lead')->name('destroy');
            Route::post('{lead}/assign', [LeadController::class, 'assign'])->whereNumber('lead')->name('assign');
            Route::post('{lead}/status', [LeadController::class, 'updateStatus'])->whereNumber('lead')->name('status');
            Route::post('{lead}/match', [LeadController::class, 'match'])->whereNumber('lead')->name('match');
            Route::get('{lead}/documents', [DocumentController::class, 'index'])->whereNumber('lead')->name('documents.index');
            Route::post('{lead}/documents', [DocumentController::class, 'store'])->whereNumber('lead')->name('documents.store');
        });

        Route::prefix('documents')->name('documents.')->group(function (): void {
            Route::get('{document}/download', [DocumentController::class, 'download'])
                ->whereNumber('document')->name('download');
            Route::delete('{document}', [DocumentController::class, 'destroy'])
                ->whereNumber('document')->name('destroy');
        });

        Route::prefix('banks')->name('banks.')->group(function (): void {
            Route::get('/', [BankCriteriaController::class, 'index'])->name('index');
            Route::post('/', [BankCriteriaController::class, 'store'])->name('store');
            Route::get('{bank}', [BankCriteriaController::class, 'show'])->whereNumber('bank')->name('show');
            Route::put('{bank}', [BankCriteriaController::class, 'update'])->whereNumber('bank')->name('update');
            Route::delete('{bank}', [BankCriteriaController::class, 'destroy'])->whereNumber('bank')->name('destroy');
        });

        Route::prefix('notifications')->name('notifications.')->group(function (): void {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
            Route::post('{notification}/read', [NotificationController::class, 'markRead'])
                ->whereNumber('notification')->name('read');
        });

        Route::get('reports/dashboard', [ReportController::class, 'dashboard'])->name('reports.dashboard');


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
