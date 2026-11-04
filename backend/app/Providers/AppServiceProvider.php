<?php

namespace App\Providers;

use App\Models\Accountant;
use App\Models\Affiliate;
use App\Models\AffiliatePayout;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\BankCriteria;
use App\Models\Banker;
use App\Models\Connector;
use App\Models\ConnectorPayout;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\CustomerNote;
use App\Models\Document;
use App\Models\Employee;
use App\Models\LeadAccessRequest;
use App\Models\LeadFollowUp;
use App\Models\LedgerEntry;
use App\Models\LoanLead;
use App\Models\Manager;
use App\Models\Permission;
use App\Models\RelationshipManager;
use App\Models\Settings;
use App\Models\Task;
use App\Models\Telecaller;
use App\Models\TelecallerFollowUp;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorCertification;
use App\Policies\AccountantPolicy;
use App\Policies\AffiliatePayoutPolicy;
use App\Policies\AffiliatePolicy;
use App\Policies\ApprovalPolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\BankCriteriaPolicy;
use App\Policies\BankerPolicy;
use App\Policies\ConnectorPayoutPolicy;
use App\Policies\ConnectorPolicy;
use App\Policies\CustomerDocumentPolicy;
use App\Policies\CustomerNotePolicy;
use App\Policies\CustomerPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\LeadAccessRequestPolicy;
use App\Policies\LeadFollowUpPolicy;
use App\Policies\LedgerPolicy;
use App\Policies\LoanLeadPolicy;
use App\Policies\ManagerPolicy;
use App\Policies\PermissionPolicy;
use App\Policies\RelationshipManagerPolicy;
use App\Policies\SettingsPolicy;
use App\Policies\TaskPolicy;
use App\Policies\TelecallerFollowUpPolicy;
use App\Policies\TelecallerPolicy;
use App\Policies\UserPolicy;
use App\Policies\VendorCertificationPolicy;
use App\Policies\VendorPolicy;
use App\Services\CaptchaVerificationService;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CaptchaVerifierInterface::class, CaptchaVerificationService::class);
    }

    public function boot(): void
    {
        $this->configureRateLimiting();

        Model::preventLazyLoading(! app()->isProduction());
        Model::unguard(false);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Connector::class, ConnectorPolicy::class);
        Gate::policy(ConnectorPayout::class, ConnectorPayoutPolicy::class);
        Gate::policy(Affiliate::class, AffiliatePolicy::class);
        Gate::policy(AffiliatePayout::class, AffiliatePayoutPolicy::class);
        Gate::policy(Banker::class, BankerPolicy::class);
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(RelationshipManager::class, RelationshipManagerPolicy::class);
        Gate::policy(Manager::class, ManagerPolicy::class);
        Gate::policy(LoanLead::class, LoanLeadPolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(CustomerNote::class, CustomerNotePolicy::class);
        Gate::policy(CustomerDocument::class, CustomerDocumentPolicy::class);
        Gate::policy(BankCriteria::class, BankCriteriaPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(LeadAccessRequest::class, LeadAccessRequestPolicy::class);
        Gate::policy(LeadFollowUp::class, LeadFollowUpPolicy::class);
        Gate::policy(Telecaller::class, TelecallerPolicy::class);
        Gate::policy(TelecallerFollowUp::class, TelecallerFollowUpPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
        Gate::policy(Settings::class, SettingsPolicy::class);
        Gate::policy(LedgerEntry::class, LedgerPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(Approval::class, ApprovalPolicy::class);
        Gate::policy(Accountant::class, AccountantPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);
        Gate::policy(VendorCertification::class, VendorCertificationPolicy::class);
    }

    /**
     * Throttles for sign-in and the public (unauthenticated) endpoints. They
     * are OFF in the local environment so developers are never locked out
     * while testing, and enforced everywhere else.
     */
    private function configureRateLimiting(): void
    {
        $perMinute = static fn (int $max) => static fn (Request $request) => app()->environment('local')
            ? Limit::none()
            : Limit::perMinute($max)->by($request->ip());

        RateLimiter::for('sign-in', $perMinute(10));
        RateLimiter::for('customer-register', $perMinute(5));
        RateLimiter::for('public-eligibility', $perMinute(30));
        RateLimiter::for('public-contact', $perMinute(5));
        RateLimiter::for('portal-write', $perMinute(10));
        RateLimiter::for('portal-upload', $perMinute(20));
        // Funnel counters are cheap but easy to spam; the lead form is the one bots want, so it is the strictest.
        RateLimiter::for('public-offer-events', $perMinute(120));
        RateLimiter::for('public-offer-lead', static fn (Request $request) => app()->environment('local')
            ? Limit::none()
            : Limit::perHour(8)->by($request->ip()));
        RateLimiter::for('public-inquiry', static fn (Request $request) => app()->environment('local')
            ? Limit::none()
            : Limit::perHour(10)->by($request->ip()));
    }
}
