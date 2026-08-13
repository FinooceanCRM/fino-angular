<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private function service(): AuthService
    {
        return app(AuthService::class);
    }

    public function test_login_returns_user_and_token(): void
    {
        User::factory()->role(UserRole::Manager)->create(['email' => 'svc@example.test']);

        $result = $this->service()->login('svc@example.test', 'Password123!');

        $this->assertSame('svc@example.test', $result['user']->email);
        $this->assertNotEmpty($result['token']);
    }

    public function test_login_throws_on_bad_password(): void
    {
        User::factory()->create(['email' => 'bad@example.test']);

        $this->expectException(DomainException::class);
        $this->service()->login('bad@example.test', 'nope-nope-nope');
    }

    public function test_logout_removes_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('test');

        $this->service()->logoutEverywhere($user);

        $this->assertSame(0, $user->fresh()->tokens()->count());
    }

    public function test_role_hierarchy_parents(): void
    {
        $this->assertSame([UserRole::SuperAdmin], UserRole::Manager->allowedParents());
        $this->assertSame([UserRole::Manager], UserRole::RelationshipManager->allowedParents());
        $this->assertSame([UserRole::RelationshipManager], UserRole::Employee->allowedParents());
        $this->assertSame([], UserRole::SuperAdmin->allowedParents());
    }
}
