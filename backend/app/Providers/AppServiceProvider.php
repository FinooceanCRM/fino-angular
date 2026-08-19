<?php

namespace App\Providers;

use App\Models\BankCriteria;
use App\Models\Banker;
use App\Models\Connector;
use App\Models\Document;
use App\Models\Employee;
use App\Models\LeadAccessRequest;
use App\Models\LeadFollowUp;
use App\Models\LoanLead;
use App\Models\Manager;
use App\Models\RelationshipManager;
use App\Models\User;
use App\Policies\BankCriteriaPolicy;
use App\Policies\BankerPolicy;
use App\Policies\ConnectorPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\LeadAccessRequestPolicy;
use App\Policies\LeadFollowUpPolicy;
use App\Policies\LoanLeadPolicy;
use App\Policies\ManagerPolicy;
use App\Policies\RelationshipManagerPolicy;
use App\Policies\UserPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Model::preventLazyLoading(! app()->isProduction());
        Model::unguard(false);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Connector::class, ConnectorPolicy::class);
        Gate::policy(Banker::class, BankerPolicy::class);
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(RelationshipManager::class, RelationshipManagerPolicy::class);
        Gate::policy(Manager::class, ManagerPolicy::class);
        Gate::policy(LoanLead::class, LoanLeadPolicy::class);
        Gate::policy(BankCriteria::class, BankCriteriaPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(LeadAccessRequest::class, LeadAccessRequestPolicy::class);
        Gate::policy(LeadFollowUp::class, LeadFollowUpPolicy::class);
    }
}
