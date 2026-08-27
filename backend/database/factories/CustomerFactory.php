<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->numerify('9#########'),
            'segment' => $this->faker->randomElement(['Retail', 'SME', 'Corporate']),
            'status' => $this->faker->randomElement(['active', 'prospect', 'inactive']),
            'notes' => $this->faker->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
