<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Binds repository interfaces to their Eloquent implementations.
 * Bindings are added as feature repositories are introduced.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    protected array $bindings = [
        // ExampleRepositoryInterface::class => EloquentExampleRepository::class,
    ];

    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }
}
