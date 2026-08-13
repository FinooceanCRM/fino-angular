<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Test users (Phase 4 hierarchy).
 *
 * Super Admin
 * ├── Manager 1
 * │   ├── RM 1 ── Employee 1
 * │   └── RM 2 ── Employee 2
 * └── Manager 2
 *     ├── RM 3 ── Employee 3
 *     └── RM 4 ── Employee 4
 *
 * Connectors sit completely outside the reporting hierarchy.
 */
class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = '12345678';

    public function run(): void
    {
        $superAdmin = $this->make('Super Admin', 'superadmin@finoocean.test', UserRole::SuperAdmin);

        $manager1 = $this->make('Manager One', 'manager1@finoocean.test', UserRole::Manager, [
            'manager_id' => $superAdmin->id,
        ]);
        $manager2 = $this->make('Manager Two', 'manager2@finoocean.test', UserRole::Manager, [
            'manager_id' => $superAdmin->id,
        ]);

        $relationshipManagers = [
            ['Relationship Manager One', 'rm1@finoocean.test', $manager1],
            ['Relationship Manager Two', 'rm2@finoocean.test', $manager1],
            ['Relationship Manager Three', 'rm3@finoocean.test', $manager2],
            ['Relationship Manager Four', 'rm4@finoocean.test', $manager2],
        ];

        $index = 1;
        foreach ($relationshipManagers as [$name, $email, $manager]) {
            $rm = $this->make($name, $email, UserRole::RelationshipManager, [
                'manager_id' => $manager->id,
            ]);

            $this->make("Employee {$index}", "employee{$index}@finoocean.test", UserRole::Employee, [
                'manager_id' => $manager->id,
                'relationship_manager_id' => $rm->id,
            ]);

            $index++;
        }

        // Independent roles.
        $this->make('Connector One', 'connector1@finoocean.test', UserRole::Connector);
        $this->make('Connector Two', 'connector2@finoocean.test', UserRole::Connector);
    }

    /**
     * @param  array<string, mixed>  $hierarchy
     */
    private function make(string $name, string $email, UserRole $role, array $hierarchy = []): User
    {
        return User::query()->updateOrCreate(
            ['email' => $email],
            array_merge([
                'name' => $name,
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => $role,
                'manager_id' => null,
                'relationship_manager_id' => null,
                'employee_id' => null,
                'is_active' => true,
                'email_verified_at' => now(),
            ], $hierarchy),
        );
    }
}
