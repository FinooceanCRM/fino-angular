<?php

namespace App\Providers;

use App\Repositories\Contracts\ConnectorRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\EloquentConnectorRepository;
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
    ];

    public function register(): void
    {
        //
    }
}
