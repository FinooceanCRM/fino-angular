<?php

namespace App\Repositories;

use App\Models\Employee;
use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;

class EloquentEmployeeRepository implements EmployeeRepositoryInterface
{
    public function findByUser(User $user): ?Employee
    {
        return Employee::query()->where('user_id', $user->id)->first();
    }

    public function firstOrCreateForUser(User $user): Employee
    {
        $employee = Employee::query()->firstOrCreate(['user_id' => $user->id]);
        $employee->setRelation('user', $user);

        return $employee;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function update(Employee $employee, array $attributes): Employee
    {
        if ($attributes !== []) {
            $employee->fill($attributes)->save();
        }

        return $employee->refresh();
    }
}
