<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Accountant;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the accounts profile row for every seeded accounts user.
 * User identity is NOT duplicated — only accounts-specific attributes.
 */
class AccountantSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'accounts1@finoocean.test' => [
                'designation' => 'Finance Manager',
                'branch' => 'Head Office, Mumbai',
                'employee_code' => 'ACC-0001',
                'alternate_phone' => '9800000201',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400001',
            ],
        ];

        User::query()
            ->where('role', UserRole::Accounts->value)
            ->get()
            ->each(function (User $user) use ($profiles): void {
                Accountant::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profiles[$user->email] ?? ['designation' => 'Accountant'],
                );
            });
    }
}
