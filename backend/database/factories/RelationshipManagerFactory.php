<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\RelationshipManager;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RelationshipManager>
 */
class RelationshipManagerFactory extends Factory
{
    protected $model = RelationshipManager::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::RelationshipManager),
            'rm_code' => strtoupper($this->faker->unique()->bothify('RM-####')),
            'designation' => 'Relationship Manager',
            'branch' => $this->faker->city().' Branch',
            'region' => $this->faker->randomElement(['West', 'North', 'South', 'East']),
            'date_of_joining' => $this->faker->dateTimeBetween('-6 years', 'now')->format('Y-m-d'),
            'alternate_phone' => $this->faker->numerify('9#########'),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => null,
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
        ];
    }
}
