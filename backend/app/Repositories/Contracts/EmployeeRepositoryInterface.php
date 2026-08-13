<?php

namespace App\Repositories\Contracts;

use App\Models\Employee;
use App\Models\User;

interface EmployeeRepositoryInterface
{
    public function findByUser(User $user): ?Employee;

    /** Returns the employee profile for the user, creating an empty one if missing. */
    public function firstOrCreateForUser(User $user): Employee;

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Employee $employee, array $attributes): Employee;
}
