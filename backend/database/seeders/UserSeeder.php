<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Test users (Phase 8 hierarchy).
 *
 * Super Admin
 * ├── Manager One
 * │   ├── RM One   ── Employee One, Employee Two
 * │   └── RM Two   ── Employee Three, Employee Four
 * └── Manager Two
 *     ├── RM Three ── Employee Five, Employee Six
 *     └── RM Four  ── Employee Seven, Employee Eight
 *
 * Connectors sit completely outside the reporting hierarchy.
 */
class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = '12345678';

    /** @var array<int, string> */
    private const EMPLOYEE_WORDS = [
        'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    ];

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
            ['RM One', 'rm1@finoocean.test', $manager1],
            ['RM Two', 'rm2@finoocean.test', $manager1],
            ['RM Three', 'rm3@finoocean.test', $manager2],
            ['RM Four', 'rm4@finoocean.test', $manager2],
        ];

        $employeeNumber = 1;
        foreach ($relationshipManagers as [$name, $email, $manager]) {
            $rm = $this->make($name, $email, UserRole::RelationshipManager, [
                'manager_id' => $manager->id,
            ]);

            // Two employees per Relationship Manager.
            for ($i = 0; $i < 2; $i++) {
                $word = self::EMPLOYEE_WORDS[$employeeNumber - 1];

                $this->make("Employee {$word}", "employee{$employeeNumber}@finoocean.test", UserRole::Employee, [
                    'manager_id' => $manager->id,
                    'relationship_manager_id' => $rm->id,
                ]);

                $employeeNumber++;
            }
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
