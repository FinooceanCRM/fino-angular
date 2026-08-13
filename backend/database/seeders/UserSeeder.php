<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Test users.
 *
 * Super Admin
 * ├── Manager 1
 * │   ├── RM 1
 * │   │   └── Employee 1
 * │   └── RM 2
 * └── Manager 2
 *     ├── RM 3
 *     └── RM 4
 *
 * Banker and Connector sit outside the hierarchy.
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

        $rm1 = $this->make('Relationship Manager One', 'rm1@finoocean.test', UserRole::RelationshipManager, [
            'manager_id' => $manager1->id,
        ]);
        $this->make('Relationship Manager Two', 'rm2@finoocean.test', UserRole::RelationshipManager, [
            'manager_id' => $manager1->id,
        ]);
        $this->make('Relationship Manager Three', 'rm3@finoocean.test', UserRole::RelationshipManager, [
            'manager_id' => $manager2->id,
        ]);
        $this->make('Relationship Manager Four', 'rm4@finoocean.test', UserRole::RelationshipManager, [
            'manager_id' => $manager2->id,
        ]);

        $this->make('Employee One', 'employee1@finoocean.test', UserRole::Employee, [
            'manager_id' => $manager1->id,
            'relationship_manager_id' => $rm1->id,
        ]);

        $this->make('Banker One', 'banker@finoocean.test', UserRole::Banker, [
            'manager_id' => $manager1->id,
        ]);
        $this->make('Connector One', 'connector@finoocean.test', UserRole::Connector, [
            'manager_id' => $manager1->id,
        ]);
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
