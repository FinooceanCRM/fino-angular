<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Banker;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the banker profile row for every seeded banker user.
 * User identity is NOT duplicated — only banker-specific attributes.
 */
class BankerSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'banker1@finoocean.test' => [
                'bank_name' => 'HDFC Bank',
                'branch' => 'Connaught Place, Delhi',
                'designation' => 'Credit Manager',
                'employee_code' => 'BNK-0001',
                'alternate_phone' => '9800000101',
                'address_line1' => '10 Connaught Place',
                'city' => 'Delhi',
                'state' => 'Delhi',
                'pincode' => '110001',
            ],
            'banker2@finoocean.test' => [
                'bank_name' => 'ICICI Bank',
                'branch' => 'Bandra West, Mumbai',
                'designation' => 'Relationship Officer',
                'employee_code' => 'BNK-0002',
                'alternate_phone' => '9800000102',
                'address_line1' => '25 Bandra West',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400050',
            ],
        ];

        User::query()
            ->where('role', UserRole::Banker->value)
            ->get()
            ->each(function (User $user) use ($profiles): void {
                Banker::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profiles[$user->email] ?? ['designation' => 'Banker'],
                );
            });
    }
}
