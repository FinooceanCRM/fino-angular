<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Banker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banker>
 */
class BankerFactory extends Factory
{
    protected $model = Banker::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Banker),
            'bank_name' => $this->faker->company().' Bank',
            'branch' => $this->faker->city().' Branch',
            'designation' => $this->faker->randomElement(['Relationship Officer', 'Credit Manager', 'Branch Manager']),
            'employee_code' => strtoupper($this->faker->bothify('BNK-####')),
            'alternate_phone' => $this->faker->numerify('9#########'),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => null,
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
        ];
    }
}
