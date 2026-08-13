<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Employee),
            'employee_code' => strtoupper($this->faker->unique()->bothify('EMP-####')),
            'designation' => $this->faker->jobTitle(),
            'department' => $this->faker->randomElement(['Sales', 'Operations', 'Credit', 'Support']),
            'date_of_joining' => $this->faker->dateTimeBetween('-4 years', 'now')->format('Y-m-d'),
            'alternate_phone' => $this->faker->numerify('9#########'),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => null,
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
            'emergency_contact_name' => $this->faker->name(),
            'emergency_contact_phone' => $this->faker->numerify('9#########'),
        ];
    }
}
