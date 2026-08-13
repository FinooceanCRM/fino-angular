<?php

namespace Database\Factories;

use App\Models\BankCriteria;
use App\Models\LeadMatch;
use App\Models\LoanLead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadMatch>
 */
class LeadMatchFactory extends Factory
{
    protected $model = LeadMatch::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'loan_lead_id' => LoanLead::factory(),
            'bank_criteria_id' => BankCriteria::factory(),
            'match_score' => $this->faker->numberBetween(40, 100),
            'status' => 'matched',
            'reasons' => ['income_ok', 'credit_score_ok'],
        ];
    }
}
