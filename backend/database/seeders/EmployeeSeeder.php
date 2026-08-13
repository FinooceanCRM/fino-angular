<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the employee profile row for every seeded employee user.
 * User identity and reporting links are NOT duplicated here.
 */
class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departments = ['Sales', 'Operations', 'Credit', 'Support'];

        User::query()
            ->where('role', UserRole::Employee->value)
            ->orderBy('id')
            ->get()
            ->values()
            ->each(function (User $user, int $index) use ($departments): void {
                Employee::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'employee_code' => sprintf('EMP-%04d', $index + 1),
                        'designation' => 'Loan Executive',
                        'department' => $departments[$index % count($departments)],
                        'date_of_joining' => now()->subMonths(6 + $index)->toDateString(),
                        'alternate_phone' => sprintf('98100000%02d', $index + 1),
                        'address_line1' => sprintf('%d Business Park', 10 + $index),
                        'city' => 'Mumbai',
                        'state' => 'Maharashtra',
                        'pincode' => '400001',
                        'emergency_contact_name' => 'Emergency Contact '.($index + 1),
                        'emergency_contact_phone' => sprintf('98200000%02d', $index + 1),
                    ],
                );
            });
    }
}
