<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $creator = User::factory();

        return [
            'type' => $this->faker->randomElement(['call', 'meeting', 'task', 'reminder']),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->sentence(),
            'loan_lead_id' => null,
            'priority' => $this->faker->randomElement(['low', 'medium', 'high']),
            'due_at' => $this->faker->dateTimeBetween('-5 days', '+5 days'),
            'status' => 'pending',
            'assigned_to' => $creator,
            'created_by' => $creator,
            'completed_at' => null,
        ];
    }
}
