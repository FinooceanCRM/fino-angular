<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
            ConnectorSeeder::class,
            AffiliateSeeder::class,
            BankerSeeder::class,
            EmployeeSeeder::class,
            RelationshipManagerSeeder::class,
            ManagerSeeder::class,
            BankCriteriaSeeder::class,
            LoanLeadSeeder::class,
        ]);
    }
}
