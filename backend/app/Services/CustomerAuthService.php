<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Exceptions\DomainException;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Account lifecycle for public-website customers. Reuses `users` + Sanctum
 * (no second auth system) but is a separate door: it only ever authenticates
 * `customer` accounts, and the staff login refuses them in turn.
 */
class CustomerAuthService extends BaseService
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    /**
     * @param array<string, mixed> $data name, email, phone, password
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        /** @var User $user */
        $user = $this->transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => strtolower((string) $data['email']),
                'phone' => $data['phone'],
                'password' => $data['password'], // hashed by the User cast
                'role' => UserRole::Customer->value,
                'is_active' => true,
            ]);

            // `customers.created_by` is mandatory in the existing schema; a
            // self-registered customer is their own creator.
            Customer::query()->create([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => (string) $user->phone,
                'segment' => 'Portal',
                'status' => 'prospect',
                'created_by' => $user->id,
                'user_id' => $user->id,
            ]);

            $this->notifications->notify(
                $user->id,
                'customer.welcome',
                'Welcome to FINOOCEAN',
                'Your account is ready. You can now apply for a loan and track every application here.',
            );

            return $user;
        });

        return ['user' => $user, 'token' => $user->createToken('customer-portal')->plainTextToken];
    }

    /**
     * @return array{user: User, token: string}
     */
    public function login(string $email, string $password): array
    {
        $user = User::query()->where('email', strtolower($email))->first();

        // One message for every failure so the endpoint can't be used to
        // discover which emails belong to staff accounts.
        $fail = new DomainException('These credentials do not match our records.', 422, [
            'email' => ['These credentials do not match our records.'],
        ]);

        if (! $user || ! Hash::check($password, $user->password) || $user->roleEnum() !== UserRole::Customer) {
            throw $fail;
        }

        if (! $user->is_active) {
            throw new DomainException('This account has been deactivated.', 403);
        }

        return ['user' => $user, 'token' => $user->createToken('customer-portal')->plainTextToken];
    }

    public function customerFor(User $user): Customer
    {
        return Customer::query()->where('user_id', $user->id)->firstOrFail();
    }

    /**
     * @param array<string, mixed> $data name, phone
     */
    public function updateProfile(User $user, array $data): User
    {
        return $this->transaction(function () use ($user, $data): User {
            $user->update(['name' => $data['name'], 'phone' => $data['phone']]);
            $this->customerFor($user)->update(['name' => $user->name, 'phone' => (string) $user->phone]);

            return $user->fresh() ?? $user;
        });
    }
}
