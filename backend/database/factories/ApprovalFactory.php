<?php

namespace Database\Factories;

use App\Models\Approval;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Approval>
 */
class ApprovalFactory extends Factory
{
    protected $model = Approval::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => $this->faker->randomElement(['banker', 'lead', 'document']),
            'title' => $this->faker->sentence(4),
            'subtitle' => $this->faker->optional()->sentence(6),
            'requested_by' => User::factory(),
            'requested_at' => now(),
            'status' => 'pending',
            'decided_by' => null,
            'decided_at' => null,
            'decision_remarks' => null,
            'loan_lead_id' => null,
        ];
    }
}
