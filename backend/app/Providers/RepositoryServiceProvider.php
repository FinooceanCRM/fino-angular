<?php

namespace App\Providers;

use App\Repositories\Contracts\BankCriteriaRepositoryInterface;
use App\Repositories\Contracts\ConnectorRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Repositories\Contracts\ManagerRepositoryInterface;
use App\Repositories\Contracts\RelationshipManagerRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentBankCriteriaRepository;
use App\Repositories\EloquentConnectorRepository;
use App\Repositories\EloquentEmployeeRepository;
use App\Repositories\EloquentLoanLeadRepository;
use App\Repositories\EloquentManagerRepository;
use App\Repositories\EloquentRelationshipManagerRepository;
use App\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

/**
 * Binds repository interfaces to their Eloquent implementations.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        UserRepositoryInterface::class => EloquentUserRepository::class,
        ConnectorRepositoryInterface::class => EloquentConnectorRepository::class,
        EmployeeRepositoryInterface::class => EloquentEmployeeRepository::class,
        RelationshipManagerRepositoryInterface::class => EloquentRelationshipManagerRepository::class,
        ManagerRepositoryInterface::class => EloquentManagerRepository::class,
        LoanLeadRepositoryInterface::class => EloquentLoanLeadRepository::class,
        BankCriteriaRepositoryInterface::class => EloquentBankCriteriaRepository::class,
    ];

    public function register(): void
    {
        //
    }
}
