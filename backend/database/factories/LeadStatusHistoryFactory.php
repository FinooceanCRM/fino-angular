<?php

namespace Database\Factories;

use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadStatusHistory>
 */
class LeadStatusHistoryFactory extends Factory
{
    protected $model = LeadStatusHistory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'loan_lead_id' => LoanLead::factory(),
            'from_status' => 'new',
            'to_status' => $this->faker->randomElement(['in_review', 'matched', 'submitted', 'approved', 'rejected']),
            'changed_by' => null,
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
