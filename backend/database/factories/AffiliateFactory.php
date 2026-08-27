<?php

namespace Database\Factories;

use App\Enums\AffiliateStatus;
use App\Enums\UserRole;
use App\Models\Affiliate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Affiliate>
 */
class AffiliateFactory extends Factory
{
    protected $model = Affiliate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Affiliate),
            'referral_code' => strtoupper(Str::random(8)),
            'commission_rate' => null,
            'status' => AffiliateStatus::PendingVerification,
            'email_verified_at' => null,
            'alternate_phone' => $this->faker->numerify('9#########'),
            'payout_method' => 'bank_transfer',
            'payout_account_name' => $this->faker->name(),
            'payout_account_number' => $this->faker->numerify('##########'),
            'payout_ifsc_or_upi' => strtoupper($this->faker->bothify('????0######')),
            'joined_at' => now(),
        ];
    }

    public function active(): self
    {
        return $this->state(fn (): array => [
            'status' => AffiliateStatus::Active,
            'email_verified_at' => now(),
        ]);
    }
}
