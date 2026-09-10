<?php

use App\Http\Controllers\Api\V1\AccountsController;
use App\Http\Controllers\Api\V1\AffiliateController;
use App\Http\Controllers\Api\V1\ApprovalController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\BankCriteriaController;
use App\Http\Controllers\Api\V1\BankerController;
use App\Http\Controllers\Api\V1\ConnectorController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\CustomerDocumentController;
use App\Http\Controllers\Api\V1\CustomerInteractionController;
use App\Http\Controllers\Api\V1\CustomerNoteController;
use App\Http\Controllers\Api\V1\DeviceTokenController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\GeocodeController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LeadAccessRequestController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\LeadFollowUpController;
use App\Http\Controllers\Api\V1\LedgerController;
use App\Http\Controllers\Api\V1\ManagerController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\Public\AffiliateRegistrationController;
use App\Http\Controllers\Api\V1\Public\BankerRegistrationController;
use App\Http\Controllers\Api\V1\Public\ConnectorRegistrationController;
use App\Http\Controllers\Api\V1\Public\PublicLeadController;
use App\Http\Controllers\Api\V1\Public\VendorRegistrationController;
use App\Http\Controllers\Api\V1\RelationshipManagerController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SuperAdminAffiliateController;
use App\Http\Controllers\Api\V1\SuperAdminConnectorController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TelecallerController;
use App\Http\Controllers\Api\V1\TelecallerFollowUpController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VendorCertificationController;
use App\Http\Controllers\Api\V1\VendorController;
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

    // Self-service affiliate signup (Phase 2). Public: no auth, no admin
    // approval gate. The account stays inactive until the verify link is hit.
    Route::prefix('public/affiliates')->name('public.affiliates.')->group(function (): void {
        Route::post('register', [AffiliateRegistrationController::class, 'store'])
            ->middleware('throttle:5,1')->name('register');
        Route::get('verify/{id}/{hash}', [AffiliateRegistrationController::class, 'verify'])
            ->name('verify')->middleware('signed');
    });

    // Self-service connector signup + referral network. Public: no auth, no
    // admin approval gate. The account stays inactive until the phone OTP
    // sent at signup is confirmed. `invite_code` (another connector's
    // referral_code) is optional — omitting it registers a standalone
    // (root) connector.
    Route::prefix('public/connectors')->name('public.connectors.')->group(function (): void {
        Route::post('register', [ConnectorRegistrationController::class, 'store'])
            ->middleware('throttle:5,1')->name('register');
        Route::post('verify-otp', [ConnectorRegistrationController::class, 'verifyOtp'])
            ->middleware('throttle:10,1')->name('verify-otp');
        Route::post('resend-otp', [ConnectorRegistrationController::class, 'resendOtp'])
            ->middleware('throttle:3,1')->name('resend-otp');
    });

    // Self-service vendor signup ("Join as Vendor"). Public: no auth, no
    // admin approval gate. Same phone-OTP gate as connectors above — the
    // account stays inactive until the 6-digit code sent at signup is
    // confirmed. See VendorRegistrationService.
    Route::prefix('public/vendors')->name('public.vendors.')->group(function (): void {
        Route::post('register', [VendorRegistrationController::class, 'store'])
            ->middleware('throttle:5,1')->name('register');
        Route::post('verify-otp', [VendorRegistrationController::class, 'verifyOtp'])
            ->middleware('throttle:10,1')->name('verify-otp');
        Route::post('resend-otp', [VendorRegistrationController::class, 'resendOtp'])
            ->middleware('throttle:3,1')->name('resend-otp');
    });

    // Self-service banker signup ("Join as Banker"). Public: no auth, no
    // admin approval gate. Same phone-OTP gate as vendors above — the
    // account stays inactive until the 6-digit code sent at signup is
    // confirmed, then the banker logs in to the existing Banker workspace.
    // See BankerRegistrationService.
    Route::prefix('public/bankers')->name('public.bankers.')->group(function (): void {
        Route::post('register', [BankerRegistrationController::class, 'store'])
            ->middleware('throttle:5,1')->name('register');
        Route::post('verify-otp', [BankerRegistrationController::class, 'verifyOtp'])
            ->middleware('throttle:10,1')->name('verify-otp');
        Route::post('resend-otp', [BankerRegistrationController::class, 'resendOtp'])
            ->middleware('throttle:3,1')->name('resend-otp');
    });

    // Public referral lead capture (Phase 4). Unauthenticated by design —
    // honeypot + captcha carry the anti-spam burden instead. Throttled
    // tighter than login since it's unauthenticated and money-adjacent.
    Route::post('public/leads', [PublicLeadController::class, 'store'])
        ->middleware('throttle:20,60')
        ->name('public.leads.store');

    Route::middleware(['auth:sanctum', 'auth.active'])->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('auth/password', [AuthController::class, 'updatePassword'])->name('auth.password.update');
        Route::put('auth/preferences', [AuthController::class, 'updatePreferences'])->name('auth.preferences.update');
        Route::get('me/lead-referral-link', [AuthController::class, 'leadReferralLink'])->name('me.lead-referral-link');

        // Native-app push registration. The mobile client posts its FCM
        // token here after login and deletes it on logout (see PushService).
        Route::post('me/device-tokens', [DeviceTokenController::class, 'store'])->name('me.device-tokens.store');
        Route::delete('me/device-tokens', [DeviceTokenController::class, 'destroy'])->name('me.device-tokens.destroy');

        // Global search (Phase 1). Any authenticated user may search — no
        // `role:`/`permission:` gate here, results are scoped to the
        // searcher's own visibility inside SearchService itself, the same
        // way the Leads/Users list pages are.
        Route::get('search', [SearchController::class, 'index'])->name('search');

        // Connector module (Phase 5). Independent of the reporting hierarchy.
        Route::prefix('connectors')->name('connectors.')
            ->middleware('role:connector')
            ->group(function (): void {
                Route::get('dashboard', [ConnectorController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [ConnectorController::class, 'profile'])->name('profile.show');
                Route::put('profile', [ConnectorController::class, 'updateProfile'])->name('profile.update');
                Route::get('network', [ConnectorController::class, 'network'])->name('network');
                Route::get('commissions', [ConnectorController::class, 'commissions'])->name('commissions');
                Route::post('payouts', [ConnectorController::class, 'requestPayout'])->name('payouts.store');
                Route::get('payouts', [ConnectorController::class, 'payoutHistory'])->name('payouts.index');
            });

        // Affiliate module (Phase 3). Independent of the reporting hierarchy,
        // like Connector and Banker.
        Route::prefix('affiliates')->name('affiliates.')
            ->middleware('role:affiliate')
            ->group(function (): void {
                Route::get('dashboard', [AffiliateController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [AffiliateController::class, 'profile'])->name('profile.show');
                Route::put('profile', [AffiliateController::class, 'updateProfile'])->name('profile.update');
                Route::get('referrals', [AffiliateController::class, 'referrals'])->name('referrals');
                Route::get('commissions', [AffiliateController::class, 'commissions'])->name('commissions');
                Route::post('payouts', [AffiliateController::class, 'requestPayout'])->name('payouts.store');
                Route::get('payouts', [AffiliateController::class, 'payoutHistory'])->name('payouts.index');
            });

        // Super Admin dashboard. Platform-wide, unscoped.
        Route::prefix('super-admin')->name('super-admin.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::get('dashboard', [SuperAdminController::class, 'dashboard'])->name('dashboard');
            });

        // Super Admin affiliate payouts + the read-only affiliate list
        // (Phase 6) — also opened up to the Accounts role (see
        // AffiliatePayoutPolicy): the Commission pages show each
        // affiliate's accrued/paid totals via this same `index`, and
        // deciding payouts is exactly what that role exists for. Only
        // `update` (editing an affiliate's commission_rate/status) stays
        // Super Admin only, split into its own group below.
        // Registered before the `{affiliate}` wildcard group so "payouts"
        // is never swallowed by it regardless of order (the wildcard is
        // numeric-constrained too, so this is belt-and-braces).
        Route::prefix('super-admin/affiliates')->name('super-admin.affiliates.')
            ->middleware('role:super_admin,accounts')
            ->group(function (): void {
                Route::get('payouts', [SuperAdminAffiliateController::class, 'payouts'])->name('payouts.index');
                Route::post('payouts/{payout}/approve', [SuperAdminAffiliateController::class, 'approvePayout'])
                    ->whereNumber('payout')->name('payouts.approve');
                Route::post('payouts/{payout}/mark-paid', [SuperAdminAffiliateController::class, 'markPayoutPaid'])
                    ->whereNumber('payout')->name('payouts.mark-paid');
                Route::post('payouts/{payout}/reject', [SuperAdminAffiliateController::class, 'rejectPayout'])
                    ->whereNumber('payout')->name('payouts.reject');

                Route::get('/', [SuperAdminAffiliateController::class, 'index'])->name('index');
                Route::get('{affiliate}', [SuperAdminAffiliateController::class, 'show'])
                    ->whereNumber('affiliate')->name('show');
            });

        Route::prefix('super-admin/affiliates')->name('super-admin.affiliates.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::put('{affiliate}', [SuperAdminAffiliateController::class, 'update'])
                    ->whereNumber('affiliate')->name('update');
            });

        // Super Admin connector payouts + the read-only connector list —
        // same split as affiliates above: shared with Accounts, only
        // `update` stays Super Admin only.
        Route::prefix('super-admin/connectors')->name('super-admin.connectors.')
            ->middleware('role:super_admin,accounts')
            ->group(function (): void {
                Route::get('payouts', [SuperAdminConnectorController::class, 'payouts'])->name('payouts.index');
                Route::post('payouts/{payout}/approve', [SuperAdminConnectorController::class, 'approvePayout'])
                    ->whereNumber('payout')->name('payouts.approve');
                Route::post('payouts/{payout}/mark-paid', [SuperAdminConnectorController::class, 'markPayoutPaid'])
                    ->whereNumber('payout')->name('payouts.mark-paid');
                Route::post('payouts/{payout}/reject', [SuperAdminConnectorController::class, 'rejectPayout'])
                    ->whereNumber('payout')->name('payouts.reject');

                Route::get('/', [SuperAdminConnectorController::class, 'index'])->name('index');
                Route::get('{connector}', [SuperAdminConnectorController::class, 'show'])
                    ->whereNumber('connector')->name('show');
            });

        Route::prefix('super-admin/connectors')->name('super-admin.connectors.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::put('{connector}', [SuperAdminConnectorController::class, 'update'])
                    ->whereNumber('connector')->name('update');
            });

        // Accounting ledger (Phase 2) — read-only, the real backend behind
        // the frontend's former mock SEED_LEDGER. Opened up to the Accounts
        // role alongside Super Admin (see LedgerPolicy).
        Route::prefix('super-admin/ledger')->name('super-admin.ledger.')
            ->middleware('role:super_admin,accounts')
            ->group(function (): void {
                Route::get('/', [LedgerController::class, 'index'])
                    ->middleware('permission:commissions.view')->name('index');
            });

        // Accounts module — finance/accounts staff (see AccountsService).
        // Independent of the reporting hierarchy, like Connector/Banker.
        // The dashboard aggregates across every payee; the payout/
        // commission/ledger queues themselves are the same
        // super-admin/affiliates, super-admin/connectors and
        // super-admin/ledger endpoints above, just also role-gated to
        // 'accounts' — no business logic is duplicated here.
        Route::prefix('accounts')->name('accounts.')
            ->middleware('role:accounts')
            ->group(function (): void {
                Route::get('dashboard', [AccountsController::class, 'dashboard'])->name('dashboard');
                Route::get('profile', [AccountsController::class, 'profile'])->name('profile.show');
                Route::put('profile', [AccountsController::class, 'updateProfile'])->name('profile.update');
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

        // Vendor module. Independent of the reporting hierarchy, like
        // Connector/Banker. Phase 2 added the dashboard; Phase 3 adds the
        // Vendor Certification wizard (draft → images → submit → certificate)
        // and its geocoding proxy. Loan-request endpoints land in Phase 4.
        Route::prefix('vendors')->name('vendors.')
            ->middleware('role:vendor')
            ->group(function (): void {
                Route::get('dashboard', [VendorController::class, 'dashboard'])->name('dashboard');

                // Map-step geocoding proxy (reverse / forward / suggest).
                Route::get('geocode', GeocodeController::class)->name('geocode');

                Route::prefix('certifications')->name('certifications.')->group(function (): void {
                    Route::get('/', [VendorCertificationController::class, 'index'])->name('index');
                    Route::get('metadata', [VendorCertificationController::class, 'metadata'])->name('metadata');

                    // Single open draft.
                    Route::get('draft', [VendorCertificationController::class, 'draft'])->name('draft.show');
                    Route::put('draft', [VendorCertificationController::class, 'saveDraft'])->name('draft.update');

                    // Step-4 images (staged on the draft).
                    Route::post('images', [VendorCertificationController::class, 'uploadImage'])->name('images.store');
                    Route::delete('images/{image}', [VendorCertificationController::class, 'deleteImage'])
                        ->whereNumber('image')->name('images.destroy');

                    // Submit the draft → completed certification.
                    Route::post('/', [VendorCertificationController::class, 'submit'])->name('submit');

                    // One owned certification + its certificate + its files.
                    Route::get('{certification}', [VendorCertificationController::class, 'show'])
                        ->whereNumber('certification')->name('show');
                    Route::get('{certification}/certificate', [VendorCertificationController::class, 'certificate'])
                        ->whereNumber('certification')->name('certificate');
                    Route::get('{certification}/images/{image}', [VendorCertificationController::class, 'showImage'])
                        ->whereNumber('certification')->whereNumber('image')->name('images.show');
                });
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
                // KYC review queue (Phase 5, Part B) — documents on this RM's
                // own leads, filtered to KYC-relevant document types.
                Route::get('kyc-documents', [RelationshipManagerController::class, 'kycDocuments'])->name('kyc-documents');
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
                Route::put('employees/{employee}/reassign', [ManagerController::class, 'reassignEmployee'])
                    ->whereNumber('employee')
                    ->name('employees.reassign');
            });

        // Loan management workflow (Phase 9). Visibility is hierarchy-scoped
        // inside the repository; policies decide what each role may do.
        Route::prefix('leads')->name('leads.')->group(function (): void {
            Route::get('metadata', [LeadController::class, 'metadata'])->name('metadata');
            Route::get('assignable-users', [LeadController::class, 'assignableUsers'])->name('assignable-users');
            Route::get('/', [LeadController::class, 'index'])
                ->middleware('permission:leads.view')->name('index');
            Route::post('/', [LeadController::class, 'store'])
                ->middleware('permission:leads.create')->name('store');
            Route::get('{lead}', [LeadController::class, 'show'])
                ->whereNumber('lead')->middleware('permission:leads.view')->name('show');
            Route::put('{lead}', [LeadController::class, 'update'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('update');
            Route::delete('{lead}', [LeadController::class, 'destroy'])
                ->whereNumber('lead')->middleware('permission:leads.delete')->name('destroy');
            Route::post('{lead}/assign', [LeadController::class, 'assign'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('assign');
            Route::post('{lead}/status', [LeadController::class, 'updateStatus'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('status');
            Route::post('{lead}/match', [LeadController::class, 'match'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('match');
            Route::post('{lead}/pd-complete', [LeadController::class, 'completePd'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('pd-complete');
            Route::get('{lead}/pd', [LeadController::class, 'showPd'])->whereNumber('lead')->name('pd.show');
            Route::post('{lead}/pd', [LeadController::class, 'submitPd'])
                ->whereNumber('lead')->middleware('permission:leads.edit')->name('pd.store');
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

        // Customer Management (Phase 3). Shared by every authenticated role
        // (row-scoped: own + linked-via-visible-lead), unlike Leads which
        // simply resolves to `permission:leads.*` — Customers gets its own
        // module so it can be granted independently. {@see CustomerService}
        // for the hierarchy-scoping reuse from LeadService.
        Route::prefix('customers')->name('customers.')->group(function (): void {
            Route::get('/', [CustomerController::class, 'index'])
                ->middleware('permission:customers.view')->name('index');
            Route::post('/', [CustomerController::class, 'store'])
                ->middleware('permission:customers.create')->name('store');

            // Registered before the numeric-constrained {customer} wildcard
            // below for clarity, though `whereNumber` already means
            // "documents" can never be swallowed by it regardless of order.
            Route::get('documents/{document}/download', [CustomerDocumentController::class, 'download'])
                ->whereNumber('document')->name('documents.download');
            Route::post('documents/{document}/verify', [CustomerDocumentController::class, 'verify'])
                ->whereNumber('document')->middleware('permission:customers.edit')->name('documents.verify');
            Route::post('documents/{document}/reject', [CustomerDocumentController::class, 'reject'])
                ->whereNumber('document')->middleware('permission:customers.edit')->name('documents.reject');

            Route::get('{customer}', [CustomerController::class, 'show'])
                ->whereNumber('customer')->middleware('permission:customers.view')->name('show');
            Route::put('{customer}', [CustomerController::class, 'update'])
                ->whereNumber('customer')->middleware('permission:customers.edit')->name('update');
            Route::delete('{customer}', [CustomerController::class, 'destroy'])
                ->whereNumber('customer')->middleware('permission:customers.delete')->name('destroy');
            Route::post('{customer}/link-lead', [CustomerController::class, 'linkLead'])
                ->whereNumber('customer')->middleware('permission:customers.edit')->name('link-lead');
            Route::post('{customer}/unlink-lead', [CustomerController::class, 'unlinkLead'])
                ->whereNumber('customer')->middleware('permission:customers.edit')->name('unlink-lead');
            Route::get('{customer}/notes', [CustomerNoteController::class, 'index'])
                ->whereNumber('customer')->middleware('permission:customers.view')->name('notes.index');
            Route::post('{customer}/notes', [CustomerNoteController::class, 'store'])
                ->whereNumber('customer')->middleware('permission:customers.edit')->name('notes.store');
            Route::get('{customer}/interactions', [CustomerInteractionController::class, 'index'])
                ->whereNumber('customer')->middleware('permission:customers.view')->name('interactions.index');
            Route::get('{customer}/documents', [CustomerDocumentController::class, 'index'])
                ->whereNumber('customer')->middleware('permission:customers.view')->name('documents.index');
            Route::post('{customer}/documents', [CustomerDocumentController::class, 'store'])
                ->whereNumber('customer')->middleware('permission:customers.edit')->name('documents.store');
        });

        // Tasks (Phase 4). Shared by every authenticated role, row-scoped
        // (own + team via UserHierarchyService — see EloquentTaskRepository).
        // Also backs the Relationship Manager module's Activities tabs
        // (Calls/Meetings/Tasks/Reminders) via the `assigned_to=team` filter
        // — that is a filtered view over this same API, not a separate
        // feature. {@see TaskService}.
        Route::prefix('tasks')->name('tasks.')->group(function (): void {
            Route::get('counts', [TaskController::class, 'counts'])
                ->middleware('permission:tasks.view')->name('counts');
            Route::get('/', [TaskController::class, 'index'])
                ->middleware('permission:tasks.view')->name('index');
            Route::post('/', [TaskController::class, 'store'])
                ->middleware('permission:tasks.create')->name('store');
            Route::get('{task}', [TaskController::class, 'show'])
                ->whereNumber('task')->middleware('permission:tasks.view')->name('show');
            Route::put('{task}', [TaskController::class, 'update'])
                ->whereNumber('task')->middleware('permission:tasks.edit')->name('update');
            Route::delete('{task}', [TaskController::class, 'destroy'])
                ->whereNumber('task')->middleware('permission:tasks.delete')->name('destroy');
            Route::post('{task}/complete', [TaskController::class, 'complete'])
                ->whereNumber('task')->middleware('permission:tasks.edit')->name('complete');
            Route::post('{task}/cancel', [TaskController::class, 'cancel'])
                ->whereNumber('task')->middleware('permission:tasks.edit')->name('cancel');
            Route::post('{task}/reschedule', [TaskController::class, 'reschedule'])
                ->whereNumber('task')->middleware('permission:tasks.edit')->name('reschedule');
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
            // KYC review (Phase 5, Part B) — distinct from the `customers/
            // documents/{document}/verify|reject` routes above, which act on
            // the separate CustomerDocument model/table.
            Route::post('{document}/verify', [DocumentController::class, 'verify'])
                ->whereNumber('document')->name('verify');
            Route::post('{document}/reject', [DocumentController::class, 'reject'])
                ->whereNumber('document')->name('reject');
            Route::delete('{document}', [DocumentController::class, 'destroy'])
                ->whereNumber('document')->name('destroy');
        });

        // Approval Center (Phase 5, Part A) — Banker/Lead/Document approval
        // types. The Access type is served by access-requests above.
        Route::prefix('approvals')->name('approvals.')->group(function (): void {
            Route::get('/', [ApprovalController::class, 'index'])->name('index');
            Route::post('/', [ApprovalController::class, 'store'])->name('store');
            Route::get('{approval}', [ApprovalController::class, 'show'])
                ->whereNumber('approval')->name('show');
            Route::post('{approval}/approve', [ApprovalController::class, 'approve'])
                ->whereNumber('approval')->name('approve');
            Route::post('{approval}/reject', [ApprovalController::class, 'reject'])
                ->whereNumber('approval')->name('reject');
            Route::get('{approval}/comments', [ApprovalController::class, 'comments'])
                ->whereNumber('approval')->name('comments.index');
            Route::post('{approval}/comments', [ApprovalController::class, 'storeComment'])
                ->whereNumber('approval')->name('comments.store');
        });

        Route::prefix('banks')->name('banks.')->group(function (): void {
            Route::get('/', [BankCriteriaController::class, 'index'])
                ->middleware('permission:banking.view')->name('index');
            Route::post('/', [BankCriteriaController::class, 'store'])
                ->middleware('permission:banking.create')->name('store');
            Route::get('{bank}', [BankCriteriaController::class, 'show'])
                ->whereNumber('bank')->middleware('permission:banking.view')->name('show');
            Route::put('{bank}', [BankCriteriaController::class, 'update'])
                ->whereNumber('bank')->middleware('permission:banking.edit')->name('update');
            Route::delete('{bank}', [BankCriteriaController::class, 'destroy'])
                ->whereNumber('bank')->middleware('permission:banking.delete')->name('destroy');
        });

        Route::prefix('notifications')->name('notifications.')->group(function (): void {
            Route::get('/', [NotificationController::class, 'index'])
                ->middleware('permission:notifications.view')->name('index');
            Route::post('read-all', [NotificationController::class, 'markAllRead'])
                ->middleware('permission:notifications.edit')->name('read-all');
            Route::post('{notification}/read', [NotificationController::class, 'markRead'])
                ->whereNumber('notification')->middleware('permission:notifications.edit')->name('read');
        });

        Route::get('reports/dashboard', [ReportController::class, 'dashboard'])
            ->middleware('permission:reports.view')->name('reports.dashboard');

        Route::prefix('audit-logs')->name('audit-logs.')->group(function (): void {
            Route::get('/', [AuditLogController::class, 'index'])
                ->middleware('permission:audit_logs.view')->name('index');
            Route::get('{audit_log}', [AuditLogController::class, 'show'])
                ->whereNumber('audit_log')->middleware('permission:audit_logs.view')->name('show');
        });

        // Platform settings (Phase 1) — General, Matching Engine,
        // Notifications, Security. Singleton document; Super Admin only, at
        // both the route (`role:`) and Policy (SettingsPolicy) layer, same
        // stacked `role:` + `permission:` shape as the module-scoped groups
        // above.
        Route::prefix('settings')->name('settings.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::get('/', [SettingsController::class, 'show'])
                    ->middleware('permission:settings.view')->name('show');
                Route::put('general', [SettingsController::class, 'updateGeneral'])
                    ->middleware('permission:settings.edit')->name('general');
                Route::put('matching-engine', [SettingsController::class, 'updateMatchingEngine'])
                    ->middleware('permission:settings.edit')->name('matching-engine');
                Route::put('notifications', [SettingsController::class, 'updateNotifications'])
                    ->middleware('permission:settings.edit')->name('notifications');
                Route::put('security', [SettingsController::class, 'updateSecurity'])
                    ->middleware('permission:settings.edit')->name('security');
            });

        // Permissions matrix (Phase 0). Super Admin only, at both the route
        // (role:) and the Policy (PermissionPolicy) layer.
        Route::prefix('permissions')->name('permissions.')
            ->middleware('role:super_admin')
            ->group(function (): void {
                Route::get('matrix', [PermissionController::class, 'matrix'])->name('matrix');
                Route::put('{role}/{module}/{action}', [PermissionController::class, 'update'])->name('update');
            });

        Route::prefix('users')->name('users.')->group(function (): void {
            Route::get('/', [UserController::class, 'index'])
                ->middleware('permission:users.view')->name('index');
            Route::get('{user}', [UserController::class, 'show'])
                ->middleware('permission:users.view')->name('show');
            Route::post('/', [UserController::class, 'store'])
                ->middleware('permission:users.create')->name('store');
            Route::put('{user}', [UserController::class, 'update'])
                ->middleware('permission:users.edit')->name('update');
            Route::delete('{user}', [UserController::class, 'destroy'])
                ->middleware('permission:users.delete')->name('destroy');
        });
    });
});
