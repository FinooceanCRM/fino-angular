<?php

namespace Database\Factories;

use App\Models\BankCriteria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankCriteria>
 */
class BankCriteriaFactory extends Factory
{
    protected $model = BankCriteria::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'bank_name' => $this->faker->company(),
            'product_name' => $this->faker->words(2, true),
            'loan_type' => $this->faker->randomElement(['home', 'personal', 'business', 'auto', 'education']),
            'min_loan_amount' => 100000,
            'max_loan_amount' => 10000000,
            'min_monthly_income' => 25000,
            'min_credit_score' => $this->faker->numberBetween(600, 780),
            'min_age' => 21,
            'max_age' => 60,
            'employment_type' => $this->faker->randomElement(['salaried', 'self_employed', 'business']),
            'interest_rate' => $this->faker->randomFloat(2, 7, 18),
            'is_active' => true,
            'banker_id' => null,
        ];
    }
}
