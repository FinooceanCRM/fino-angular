<?php

namespace Database\Seeders;

use App\Enums\ConnectorStatus;
use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the connector profile row for every seeded connector user.
 * User identity is NOT duplicated — only connector-specific attributes.
 *
 * Also seeds a 3-level referral chain (One -> Two -> Three) so the
 * override-commission cascade is demonstrable immediately after
 * `migrate --seed`, without needing to walk the self-service signup flow
 * by hand. Processed in order since each connector's `referred_by` lookup
 * depends on the previous one already having a referral_code.
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
                'referral_code' => 'CONN0001A',
                'referred_by_email' => null,
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
                'referral_code' => 'CONN0002B',
                'referred_by_email' => 'connector1@finoocean.test',
            ],
            'connector3@finoocean.test' => [
                'company_name' => 'Riverside Loan Referrals',
                'contact_person' => 'Connector Three',
                'alternate_phone' => '9800000003',
                'address_line1' => '7 Riverside Colony',
                'city' => 'Nashik',
                'state' => 'Maharashtra',
                'pincode' => '422001',
                'pan_number' => 'LMNOP9012Q',
                'gst_number' => '27LMNOP9012Q1Z8',
                'referral_code' => 'CONN0003C',
                'referred_by_email' => 'connector2@finoocean.test',
            ],
        ];

        foreach ($profiles as $email => $profile) {
            $user = User::query()->where('email', $email)->where('role', UserRole::Connector->value)->first();

            if (! $user) {
                continue;
            }

            $referredByUserId = null;
            if ($profile['referred_by_email'] !== null) {
                $referredByUserId = User::query()->where('email', $profile['referred_by_email'])->value('id');
            }

            Connector::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'company_name' => $profile['company_name'],
                    'contact_person' => $profile['contact_person'],
                    'alternate_phone' => $profile['alternate_phone'],
                    'address_line1' => $profile['address_line1'],
                    'city' => $profile['city'],
                    'state' => $profile['state'],
                    'pincode' => $profile['pincode'],
                    'pan_number' => $profile['pan_number'],
                    'gst_number' => $profile['gst_number'],
                    'referral_code' => $profile['referral_code'],
                    'referred_by_connector_id' => $referredByUserId,
                    'status' => ConnectorStatus::Active->value,
                    'phone_verified_at' => now(),
                    'joined_at' => now(),
                ],
            );
        }
    }
}
