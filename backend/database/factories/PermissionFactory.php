<?php

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Permission>
 */
class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = $this->faker->randomElement(['leads', 'users', 'documents', 'reports']);
        $action = $this->faker->randomElement(['view', 'create', 'update', 'delete']);

        return [
            'slug' => $group.'.'.$action.'.'.$this->faker->unique()->numberBetween(1, 100000),
            'name' => ucfirst($action).' '.$group,
            'group' => $group,
        ];
    }
}
