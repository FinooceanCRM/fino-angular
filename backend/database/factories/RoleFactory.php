<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->jobTitle();

        return [
            'slug' => Str::slug($name, '_'),
            'name' => $name,
            'level' => $this->faker->numberBetween(1, 5),
            'description' => $this->faker->sentence(),
        ];
    }
}
