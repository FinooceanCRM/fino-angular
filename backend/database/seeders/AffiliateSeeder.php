<?php

namespace Database\Seeders;

use App\Enums\AffiliateStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the affiliate profile row for every seeded affiliate user.
 * User identity is NOT duplicated — only affiliate-specific attributes.
 * Demo affiliates are seeded already verified and active.
 */
class AffiliateSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            'affiliate1@finoocean.test' => [
                'referral_code' => 'AFF1000A',
                'commission_rate' => 2.50,
                'alternate_phone' => '9800000101',
                'payout_method' => 'bank_transfer',
                'payout_account_name' => 'Affiliate One',
                'payout_account_number' => '123456789012',
                'payout_ifsc_or_upi' => 'HDFC0001234',
            ],
            'affiliate2@finoocean.test' => [
                'referral_code' => 'AFF1000B',
                'commission_rate' => null,
                'alternate_phone' => '9800000102',
                'payout_method' => 'upi',
                'payout_account_name' => 'Affiliate Two',
                'payout_account_number' => null,
                'payout_ifsc_or_upi' => 'affiliatetwo@upi',
            ],
            'affiliate3@finoocean.test' => [
                'referral_code' => 'AFF1000C',
                'commission_rate' => 1.75,
                'alternate_phone' => '9800000103',
                'payout_method' => 'bank_transfer',
                'payout_account_name' => 'Affiliate Three',
                'payout_account_number' => '987654321098',
                'payout_ifsc_or_upi' => 'ICIC0005678',
            ],
        ];

        User::query()
            ->where('role', UserRole::Affiliate->value)
            ->get()
            ->each(function (User $user) use ($profiles): void {
                Affiliate::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    array_merge(
                        $profiles[$user->email] ?? ['referral_code' => strtoupper(bin2hex(random_bytes(4)))],
                        [
                            'status' => AffiliateStatus::Active,
                            'email_verified_at' => now(),
                            'joined_at' => now(),
                        ],
                    ),
                );
            });
    }
}
