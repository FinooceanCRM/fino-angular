<?php

namespace Database\Seeders;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Test users (Phase 8 hierarchy).
 *
 * Department lives at the Relationship Manager level, not the Manager: one
 * Manager runs Personal Loan, Home Loan and Mortgage Loan simultaneously,
 * split across three separate RMs (one RM per department). Employees
 * inherit their department from their own RM.
 *
 * Super Admin
 * ├── Manager One
 * │   ├── RM One (PL)   ── Employee One
 * │   ├── RM Two (HL)   ── Employee Two
 * │   └── RM Three (ML) ── Employee Three
 * └── Manager Two
 *     ├── RM Four (PL)  ── Employee Four
 *     ├── RM Five (HL)  ── Employee Five
 *     └── RM Six (ML)   ── Employee Six
 *
 * Connectors sit completely outside the reporting hierarchy.
 */
class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = '12345678';

    /** @var array<int, string> */
    private const EMPLOYEE_WORDS = [
        'One', 'Two', 'Three', 'Four', 'Five', 'Six',
    ];

    /** @var array<int, Department> */
    private const RM_DEPARTMENTS = [
        Department::PersonalLoan,
        Department::HomeLoan,
        Department::MortgageLoan,
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
            ['RM Three', 'rm3@finoocean.test', $manager1],
            ['RM Four', 'rm4@finoocean.test', $manager2],
            ['RM Five', 'rm5@finoocean.test', $manager2],
            ['RM Six', 'rm6@finoocean.test', $manager2],
        ];

        $employeeNumber = 1;
        foreach ($relationshipManagers as $index => [$name, $email, $manager]) {
            $department = self::RM_DEPARTMENTS[$index % 3];

            $rm = $this->make($name, $email, UserRole::RelationshipManager, [
                'manager_id' => $manager->id,
                'department' => $department->value,
            ]);

            $word = self::EMPLOYEE_WORDS[$employeeNumber - 1];
            $this->make("Employee {$word}", "employee{$employeeNumber}@finoocean.test", UserRole::Employee, [
                'manager_id' => $manager->id,
                'relationship_manager_id' => $rm->id,
                'department' => $rm->department?->value,
            ]);

            $employeeNumber++;
        }

        // Independent roles.
        $this->make('Connector One', 'connector1@finoocean.test', UserRole::Connector);
        $this->make('Connector Two', 'connector2@finoocean.test', UserRole::Connector);
        // Connector Three joins under Connector Two (see ConnectorSeeder), demonstrating
        // the referral chain One -> Two -> Three for the override-commission cascade.
        $this->make('Connector Three', 'connector3@finoocean.test', UserRole::Connector);
        $this->make('Banker One', 'banker1@finoocean.test', UserRole::Banker);
        $this->make('Banker Two', 'banker2@finoocean.test', UserRole::Banker);
        $this->make('Telecaller One', 'telecaller1@finoocean.test', UserRole::Telecaller, [
            'department' => Department::PersonalLoan->value,
        ]);
        $this->make('Telecaller Two', 'telecaller2@finoocean.test', UserRole::Telecaller, [
            'department' => Department::HomeLoan->value,
        ]);
        $this->make('Affiliate One', 'affiliate1@finoocean.test', UserRole::Affiliate);
        $this->make('Affiliate Two', 'affiliate2@finoocean.test', UserRole::Affiliate);
        $this->make('Affiliate Three', 'affiliate3@finoocean.test', UserRole::Affiliate);
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
