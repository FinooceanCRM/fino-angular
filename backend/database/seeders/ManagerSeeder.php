<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Manager;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the Manager profile row for every seeded Manager user.
 * Identity and the reporting link to the Super Admin stay in `users`.
 */
class ManagerSeeder extends Seeder
{
    public function run(): void
    {
        $regions = ['West', 'North', 'South', 'East'];

        User::query()
            ->where('role', UserRole::Manager->value)
            ->orderBy('id')
            ->get()
            ->values()
            ->each(function (User $user, int $index) use ($regions): void {
                Manager::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'manager_code' => sprintf('MGR-%04d', $index + 1),
                        'designation' => 'Manager',
                        'branch' => sprintf('Regional Office %02d', $index + 1),
                        'region' => $regions[$index % count($regions)],
                        'date_of_joining' => now()->subYears(4)->subMonths($index)->toDateString(),
                        'alternate_phone' => sprintf('98400000%02d', $index + 1),
                        'address_line1' => sprintf('%d Corporate Avenue', 30 + $index),
                        'city' => 'Mumbai',
                        'state' => 'Maharashtra',
                        'pincode' => '400001',
                    ],
                );
            });
    }
}
