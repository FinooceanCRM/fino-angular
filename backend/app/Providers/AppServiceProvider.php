<?php

namespace App\Providers;

use App\Models\Connector;
use App\Models\Employee;
use App\Models\Manager;
use App\Models\RelationshipManager;
use App\Models\User;
use App\Policies\ConnectorPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\ManagerPolicy;
use App\Policies\RelationshipManagerPolicy;
use App\Policies\UserPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! app()->isProduction());
        Model::unguard(false);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Connector::class, ConnectorPolicy::class);
        Gate::policy(Employee::class, EmployeePolicy::class);
        Gate::policy(RelationshipManager::class, RelationshipManagerPolicy::class);
        Gate::policy(Manager::class, ManagerPolicy::class);
    }
}
