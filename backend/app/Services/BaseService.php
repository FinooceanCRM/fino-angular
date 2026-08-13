<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Base class for the service layer. Services hold business rules and never
 * build HTTP responses. Concrete services arrive with their feature modules.
 */
abstract class BaseService
{
    /**
     * Run a unit of work inside a database transaction.
     */
    protected function transaction(callable $callback): mixed
    {
        try {
            return DB::transaction($callback);
        } catch (Throwable $e) {
            report($e);

            throw $e;
        }
    }
}
