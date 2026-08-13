<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Connector>
 */
class ConnectorFactory extends Factory
{
    protected $model = Connector::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Connector),
            'relationship_manager_id' => null,
            'company_name' => $this->faker->company(),
            'contact_person' => $this->faker->name(),
            'alternate_phone' => $this->faker->numerify('9#########'),
            'address_line1' => $this->faker->streetAddress(),
            'address_line2' => null,
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'pincode' => $this->faker->numerify('4#####'),
            'pan_number' => strtoupper($this->faker->bothify('?????####?')),
            'gst_number' => strtoupper($this->faker->bothify('##???????####?#?#')),
        ];
    }
}
