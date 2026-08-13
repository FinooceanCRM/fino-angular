<?php

namespace Database\Factories;

use App\Models\LeadAssignment;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadAssignment>
 */
class LeadAssignmentFactory extends Factory
{
    protected $model = LeadAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'loan_lead_id' => LoanLead::factory(),
            'assigned_to' => User::factory(),
            'assigned_by' => null,
            'status' => 'active',
            'assigned_at' => now(),
            'released_at' => null,
            'remarks' => null,
        ];
    }
}
