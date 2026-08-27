<?php

namespace Tests;

use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Any test using RefreshDatabase runs this seeder once (alongside its
     * one-time migrate:fresh) so the `permission:<module>.<action>`
     * middleware — DB-driven since Phase 0 — has roles/permissions to check
     * against. Deliberately just this lightweight seeder, not the full
     * DatabaseSeeder, so existing tests' fixtures stay untouched.
     */
    protected $seeder = RolePermissionSeeder::class;
}
