<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\BankCriteriaController;
use App\Http\Controllers\Api\V1\BankerController;
use App\Http\Controllers\Api\V1\ConnectorController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LeadAccessRequestController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadFollowUpController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\RelationshipManagerController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use App\Http\Controllers\Api\V1\TelecallerController;
use App\Http\Controllers\Api\V1\TelecallerFollowUpController;
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
        Route::post('auth/password', [AuthController::class, 'updatePassword'])->name('auth.password.update');
        Route::put('auth/preferences', [AuthController::class, 'updatePreferences'])->name('auth.preferences.update');

        // Connector module (Phase 5). Independent of the reporting hierarchy.
        Route::prefix('connectors')->name('connectors.')
            ->middleware('role:connector')
            ->group(function (): void {
                Route::get('dashboard', [ConnectorController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [ConnectorController::class, 'profile'])->name('profile.show');
                Route::put('profile', [ConnectorController::class, 'updateProfile'])->name('profile.update');
            });

        // Super Admin dashboard. Platform-wide, unscoped.
        Route::prefix('super-admin')->name('super-admin.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::get('dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
            });

        // Banker module. Independent of the reporting hierarchy, like Connector.
        Route::prefix('bankers')->name('bankers.')
            ->middleware('role:banker')
            ->group(function (): void {
                Route::get('dashboard', [BankerController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [BankerController::class, 'profile'])->name('profile.show');
                Route::put('profile', [BankerController::class, 'updateProfile'])->name('profile.update');
            });

        // Telecaller module. Independent of the reporting hierarchy, like Connector and Banker.
        Route::prefix('telecallers')->name('telecallers.')
            ->middleware('role:telecaller')
            ->group(function (): void {
                Route::get('dashboard', [TelecallerController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [TelecallerController::class, 'profile'])->name('profile.show');
                Route::put('profile', [TelecallerController::class, 'updateProfile'])->name('profile.update');
                Route::get('follow-ups', [TelecallerFollowUpController::class, 'pending'])->name('follow-ups.index');
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
            Route::post('{lead}/pd-complete', [LeadController::class, 'completePd'])->whereNumber('lead')->name('pd-complete');
            Route::get('{lead}/pd', [LeadController::class, 'showPd'])->whereNumber('lead')->name('pd.show');
            Route::post('{lead}/pd', [LeadController::class, 'submitPd'])->whereNumber('lead')->name('pd.store');
            Route::get('{lead}/documents', [DocumentController::class, 'index'])->whereNumber('lead')->name('documents.index');
            Route::post('{lead}/documents', [DocumentController::class, 'store'])->whereNumber('lead')->name('documents.store');
            Route::get('{lead}/access-requests', [LeadAccessRequestController::class, 'forLead'])
                ->whereNumber('lead')->name('access-requests.index');
            Route::post('{lead}/access-requests', [LeadAccessRequestController::class, 'store'])
                ->whereNumber('lead')->name('access-requests.store');
            Route::get('{lead}/follow-ups', [LeadFollowUpController::class, 'index'])
                ->whereNumber('lead')->name('follow-ups.index');
            Route::post('{lead}/follow-ups', [LeadFollowUpController::class, 'store'])
                ->whereNumber('lead')->name('follow-ups.store');
            Route::get('{lead}/telecaller-follow-ups', [TelecallerFollowUpController::class, 'index'])
                ->whereNumber('lead')->name('telecaller-follow-ups.index');
            Route::post('{lead}/telecaller-follow-ups', [TelecallerFollowUpController::class, 'store'])
                ->whereNumber('lead')->name('telecaller-follow-ups.store');
        });

        // Banker follow-up completion — separate prefix since it acts on the
        // follow-up itself, not a lead (same shape as access-requests below).
        Route::prefix('follow-ups')->name('follow-ups.')->group(function (): void {
            Route::post('{follow_up}/complete', [LeadFollowUpController::class, 'complete'])
                ->whereNumber('follow_up')->name('complete');
        });

        // Telecaller follow-up completion/reschedule — separate table/prefix
        // from the Banker log above, kept fully independent.
        Route::prefix('telecaller-follow-ups')->name('telecaller-follow-ups.')->group(function (): void {
            Route::post('{follow_up}/complete', [TelecallerFollowUpController::class, 'complete'])
                ->whereNumber('follow_up')->name('complete');
            Route::post('{follow_up}/reschedule', [TelecallerFollowUpController::class, 'reschedule'])
                ->whereNumber('follow_up')->name('reschedule');
        });

        // Banker access-request approve/reject workflow.
        Route::prefix('access-requests')->name('access-requests.')->group(function (): void {
            Route::get('/', [LeadAccessRequestController::class, 'pending'])->name('pending');
            Route::post('{access_request}/approve', [LeadAccessRequestController::class, 'approve'])
                ->whereNumber('access_request')->name('approve');
            Route::post('{access_request}/reject', [LeadAccessRequestController::class, 'reject'])
                ->whereNumber('access_request')->name('reject');
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
