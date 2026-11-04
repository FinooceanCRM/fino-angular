<?php

namespace App\Http\Controllers\Api\V1\Portal;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Portal\LoginCustomerRequest;
use App\Http\Requests\Portal\RegisterCustomerRequest;
use App\Http\Requests\Portal\UpdateCustomerProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\CustomerAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAuthController extends BaseApiController
{
    public function __construct(private readonly CustomerAuthService $accounts)
    {
    }

    public function register(RegisterCustomerRequest $request): JsonResponse
    {
        $result = $this->accounts->register($request->validated());

        return $this->respondCreated([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
            'token_type' => 'Bearer',
        ], 'Your account has been created.');
    }

    public function login(LoginCustomerRequest $request): JsonResponse
    {
        $result = $this->accounts->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        return $this->respondSuccess([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
            'token_type' => 'Bearer',
        ], 'Logged in successfully.');
    }

    public function updateProfile(UpdateCustomerProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->respondSuccess(
            new UserResource($this->accounts->updateProfile($user, $request->validated())),
            'Profile updated.',
        );
    }
}
