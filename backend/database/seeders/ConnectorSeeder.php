<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the connector profile row for every seeded connector user.
 * User identity is NOT duplicated — only connector-specific attributes.
 */
class ConnectorSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'connector1@finoocean.test' => [
                'company_name' => 'Ocean Referral Partners',
                'contact_person' => 'Connector One',
                'alternate_phone' => '9800000001',
                'address_line1' => '12 Marine Drive',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400001',
                'pan_number' => 'ABCDE1234F',
                'gst_number' => '27ABCDE1234F1Z5',
            ],
            'connector2@finoocean.test' => [
                'company_name' => 'Fino Channel Associates',
                'contact_person' => 'Connector Two',
                'alternate_phone' => '9800000002',
                'address_line1' => '44 MG Road',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411001',
                'pan_number' => 'FGHIJ5678K',
                'gst_number' => '27FGHIJ5678K1Z2',
            ],
        ];

        User::query()
            ->where('role', UserRole::Connector->value)
            ->get()
            ->each(function (User $user) use ($profiles): void {
                Connector::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    $profiles[$user->email] ?? ['contact_person' => $user->name],
                );
            });
    }
}
