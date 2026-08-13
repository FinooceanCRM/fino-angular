<?php

namespace Database\Factories;

use App\Enums\LeadStatus;
use App\Models\LoanLead;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<LoanLead>
 */
class LoanLeadFactory extends Factory
{
    protected $model = LoanLead::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reference' => 'LD-'.strtoupper(Str::random(10)),
            'applicant_name' => $this->faker->name(),
            'applicant_email' => $this->faker->unique()->safeEmail(),
            'applicant_phone' => $this->faker->numerify('9#########'),
            'loan_type' => $this->faker->randomElement(['home', 'personal', 'business', 'auto', 'education']),
            'loan_amount' => $this->faker->numberBetween(100000, 10000000),
            'tenure_months' => $this->faker->randomElement([12, 24, 36, 60, 120, 240]),
            'monthly_income' => $this->faker->numberBetween(25000, 500000),
            'credit_score' => $this->faker->numberBetween(550, 900),
            'employment_type' => $this->faker->randomElement(['salaried', 'self_employed', 'business']),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
            'status' => $this->faker->randomElement(LeadStatus::values()),
            'created_by' => null,
            'updated_by' => null,
            'connector_id' => null,
            'assigned_employee_id' => null,
            'assigned_relationship_manager_id' => null,
            'assigned_manager_id' => null,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
