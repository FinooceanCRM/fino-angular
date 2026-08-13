<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds one user per role, following the hierarchy:
 * Super Admin -> Manager -> Relationship Manager -> Employee.
 * Banker and Connector sit outside the hierarchy.
 */
class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'Password123!';

    public function run(): void
    {
        $superAdmin = $this->make('Super Admin', 'superadmin@finoocean.test', UserRole::SuperAdmin);
        $manager = $this->make('Manager One', 'manager@finoocean.test', UserRole::Manager, $superAdmin->id);
        $rm = $this->make('Relationship Manager One', 'rm@finoocean.test', UserRole::RelationshipManager, $manager->id);
        $this->make('Employee One', 'employee@finoocean.test', UserRole::Employee, $rm->id);
        $this->make('Banker One', 'banker@finoocean.test', UserRole::Banker, $manager->id);
        $this->make('Connector One', 'connector@finoocean.test', UserRole::Connector, $manager->id);
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
