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
 * │   └── RM 2
 * └── Manager 2
 *     ├── RM 3
 *     └── RM 4
 *
 * Banker and Connector sit outside the hierarchy.
 */
class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'Password123!';

    public function run(): void
    {
        $superAdmin = $this->make('Super Admin', 'superadmin@finoocean.test', UserRole::SuperAdmin);

        $manager1 = $this->make('Manager One', 'manager1@finoocean.test', UserRole::Manager, $superAdmin->id);
        $manager2 = $this->make('Manager Two', 'manager2@finoocean.test', UserRole::Manager, $superAdmin->id);

        $this->make('Relationship Manager One', 'rm1@finoocean.test', UserRole::RelationshipManager, $manager1->id);
        $this->make('Relationship Manager Two', 'rm2@finoocean.test', UserRole::RelationshipManager, $manager1->id);
        $this->make('Relationship Manager Three', 'rm3@finoocean.test', UserRole::RelationshipManager, $manager2->id);
        $this->make('Relationship Manager Four', 'rm4@finoocean.test', UserRole::RelationshipManager, $manager2->id);

        $this->make('Banker One', 'banker@finoocean.test', UserRole::Banker, $manager1->id);
        $this->make('Connector One', 'connector@finoocean.test', UserRole::Connector, $manager1->id);
    }

    private function make(string $name, string $email, UserRole $role, ?int $parentId = null): User
    {
        return User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => $role,
                'parent_id' => $parentId,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
    }
}
