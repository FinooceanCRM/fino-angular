<?php

namespace App\Providers;

use App\Repositories\Contracts\ConnectorRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\RelationshipManagerRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentConnectorRepository;
use App\Repositories\EloquentEmployeeRepository;
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
    ];

    public function register(): void
    {
        //
    }
}
