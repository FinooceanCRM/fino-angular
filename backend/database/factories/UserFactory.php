<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('12345678'),
            'role' => UserRole::Employee,
            'manager_id' => null,
            'relationship_manager_id' => null,
            'employee_id' => null,
            'phone' => $this->faker->numerify('9#########'),
            'is_active' => true,
        ];
    }

    public function role(UserRole $role): self
    {
        return $this->state(fn (): array => ['role' => $role]);
    }

    public function inactive(): self
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
