<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function user(UserRole $role = UserRole::Employee, array $attributes = []): User
    {
        return User::factory()->role($role)->create($attributes);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = $this->user(UserRole::Manager, ['email' => 'manager@example.test']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'manager@example.test',
            'password' => '12345678',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'manager')
            ->assertJsonStructure(['data' => ['token', 'token_type']]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $this->user(UserRole::Employee, ['email' => 'employee@example.test']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'employee@example.test',
            'password' => 'WrongPassword1',
        ])->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_login_validation_errors(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'not-an-email', 'password' => 'x'])
            ->assertStatus(422);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->user(UserRole::Connector, ['email' => 'connector@example.test', 'is_active' => false]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'connector@example.test',
            'password' => '12345678',
        ])->assertStatus(403);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }

    public function test_me_returns_current_user(): void
    {
        $user = $this->user(UserRole::Connector);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role', 'connector');
    }

    public function test_user_can_logout(): void
    {
        $user = $this->user(UserRole::Employee, ['email' => 'logout@example.test']);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'logout@example.test',
            'password' => '12345678',
        ])->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        // Laravel's auth guard caches the resolved user for the lifetime of
        // the guard instance, which persists across sequential test-client
        // calls within one test method (unlike separate real HTTP requests,
        // which each get a fresh guard) — without this, the second call
        // below would reuse the first call's cached resolution and never
        // actually re-check the (now-deleted) token against the database.
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401);

        $this->assertSame(0, $user->fresh()->tokens()->count());
    }

    /**
     * Exercises the `role` middleware against a real role-gated route
     * (super-admin/dashboard, ->middleware('role:super_admin')) rather than
     * a dedicated test-only endpoint — there is no /auth/admin-check route
     * in this app.
     */
    public function test_role_middleware_blocks_other_roles(): void
    {
        Sanctum::actingAs($this->user(UserRole::Employee));

        $this->getJson('/api/v1/super-admin/dashboard')->assertStatus(403);
    }

    public function test_role_middleware_allows_matching_role(): void
    {
        Sanctum::actingAs($this->user(UserRole::SuperAdmin));

        $this->getJson('/api/v1/super-admin/dashboard')->assertOk();
    }
}
