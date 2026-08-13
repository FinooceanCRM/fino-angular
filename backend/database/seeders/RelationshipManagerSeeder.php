<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Connector;
use App\Models\RelationshipManager;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates the Relationship Manager profile row for every seeded RM user and
 * assigns the seeded connectors to a Relationship Manager as their point of
 * contact. The reporting hierarchy in `users` is left untouched.
 */
class RelationshipManagerSeeder extends Seeder
{
    public function run(): void
    {
        $regions = ['West', 'North', 'South', 'East'];

        $relationshipManagers = User::query()
            ->where('role', UserRole::RelationshipManager->value)
            ->orderBy('id')
            ->get()
            ->values();

        $relationshipManagers->each(function (User $user, int $index) use ($regions): void {
            RelationshipManager::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'rm_code' => sprintf('RM-%04d', $index + 1),
                    'designation' => 'Relationship Manager',
                    'branch' => sprintf('Branch %02d', $index + 1),
                    'region' => $regions[$index % count($regions)],
                    'date_of_joining' => now()->subYears(2)->subMonths($index)->toDateString(),
                    'alternate_phone' => sprintf('98300000%02d', $index + 1),
                    'address_line1' => sprintf('%d Finance Street', 20 + $index),
                    'city' => 'Mumbai',
                    'state' => 'Maharashtra',
                    'pincode' => '400001',
                ],
            );
        });

        if ($relationshipManagers->isEmpty()) {
            return;
        }

        // Connectors stay outside the hierarchy; this is only a point of contact.
        Connector::query()
            ->with('user')
            ->get()
            ->values()
            ->each(function (Connector $connector, int $index) use ($relationshipManagers): void {
                $connector->forceFill([
                    'relationship_manager_id' => $relationshipManagers[$index % $relationshipManagers->count()]->id,
                ])->save();
            });
    }
}
