<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(['lead_assigned', 'status_changed', 'document_uploaded']),
            'title' => $this->faker->sentence(4),
            'body' => $this->faker->sentence(),
            'data' => [],
            'read_at' => null,
        ];
    }
}
