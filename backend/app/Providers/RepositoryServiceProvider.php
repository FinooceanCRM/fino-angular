<?php

namespace App\Providers;

use App\Repositories\Contracts\AccountantRepositoryInterface;
use App\Repositories\Contracts\AffiliateRepositoryInterface;
use App\Repositories\Contracts\ApprovalRepositoryInterface;
use App\Repositories\Contracts\AuditLogRepositoryInterface;
use App\Repositories\Contracts\BankCriteriaRepositoryInterface;
use App\Repositories\Contracts\BankerRepositoryInterface;
use App\Repositories\Contracts\ConnectorRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\LedgerRepositoryInterface;
use App\Repositories\Contracts\LoanLeadRepositoryInterface;
use App\Repositories\Contracts\ManagerRepositoryInterface;
use App\Repositories\Contracts\RelationshipManagerRepositoryInterface;
use App\Repositories\Contracts\SettingsRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Repositories\Contracts\TelecallerRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentAccountantRepository;
use App\Repositories\EloquentAffiliateRepository;
use App\Repositories\EloquentApprovalRepository;
use App\Repositories\EloquentAuditLogRepository;
use App\Repositories\EloquentBankCriteriaRepository;
use App\Repositories\EloquentBankerRepository;
use App\Repositories\EloquentConnectorRepository;
use App\Repositories\EloquentCustomerRepository;
use App\Repositories\EloquentEmployeeRepository;
use App\Repositories\EloquentLedgerRepository;
use App\Repositories\EloquentLoanLeadRepository;
use App\Repositories\EloquentManagerRepository;
use App\Repositories\EloquentRelationshipManagerRepository;
use App\Repositories\EloquentSettingsRepository;
use App\Repositories\EloquentTaskRepository;
use App\Repositories\EloquentTelecallerRepository;
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
        BankerRepositoryInterface::class => EloquentBankerRepository::class,
        TelecallerRepositoryInterface::class => EloquentTelecallerRepository::class,
        EmployeeRepositoryInterface::class => EloquentEmployeeRepository::class,
        RelationshipManagerRepositoryInterface::class => EloquentRelationshipManagerRepository::class,
        ManagerRepositoryInterface::class => EloquentManagerRepository::class,
        LoanLeadRepositoryInterface::class => EloquentLoanLeadRepository::class,
        CustomerRepositoryInterface::class => EloquentCustomerRepository::class,
        BankCriteriaRepositoryInterface::class => EloquentBankCriteriaRepository::class,
        AffiliateRepositoryInterface::class => EloquentAffiliateRepository::class,
        AuditLogRepositoryInterface::class => EloquentAuditLogRepository::class,
        SettingsRepositoryInterface::class => EloquentSettingsRepository::class,
        LedgerRepositoryInterface::class => EloquentLedgerRepository::class,
        TaskRepositoryInterface::class => EloquentTaskRepository::class,
        ApprovalRepositoryInterface::class => EloquentApprovalRepository::class,
        AccountantRepositoryInterface::class => EloquentAccountantRepository::class,
    ];

    public function register(): void
    {
        //
    }
}
