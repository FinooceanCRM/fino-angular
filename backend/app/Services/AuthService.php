<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

/**
 * Authentication business rules. Never builds HTTP responses.
 */
class AuthService extends BaseService
{
    public function __construct(private readonly UserRepositoryInterface $users)
    {
    }

    /**
     * @return array{user: User, token: string}
     */
    public function login(string $email, string $password, ?string $deviceName = null): array
    {
        $user = $this->users->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new DomainException('These credentials do not match our records.', 422, [
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (! $user->is_active) {
            throw new DomainException('This account has been deactivated.', 403);
        }

        $token = $user->createToken($deviceName ?: 'api-token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token) {
            $token->delete();

            return;
        }

        $user->tokens()->delete();
    }

    public function logoutEverywhere(User $user): void
    {
        $user->tokens()->delete();
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw new DomainException('The current password is incorrect.', 422, [
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // The `password` cast is 'hashed' (see User::casts()), so assigning
        // the plain value here hashes it automatically on save.
        $user->update(['password' => $newPassword]);
    }

    /**
     * @param array<string, bool> $preferences
     */
    public function updatePreferences(User $user, array $preferences): User
    {
        $user->update($preferences);

        return $user->fresh() ?? $user;
    }
}
