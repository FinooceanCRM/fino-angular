<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Manager;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Manager>
 */
class ManagerFactory extends Factory
{
    protected $model = Manager::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Manager]),
            'manager_code' => strtoupper($this->faker->unique()->bothify('MGR-####')),
            'designation' => 'Manager',
            'branch' => $this->faker->city(),
            'region' => $this->faker->randomElement(['West', 'North', 'South', 'East']),
            'date_of_joining' => $this->faker->date(),
            'alternate_phone' => $this->faker->numerify('98##0#####'),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => null,
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
        ];
    }
}
