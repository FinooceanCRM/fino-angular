<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserHierarchyService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function __construct(
        private readonly UserService $users,
        private readonly UserHierarchyService $hierarchy,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $this->authorize('viewAny', User::class);

        $paginator = $this->users->listFor($actor, [
            'role' => $request->query('role'),
            'search' => $request->query('search'),
            'is_active' => $request->query('is_active'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            UserResource::collection($paginator->items())->resolve(),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'assignable_roles' => array_map(
                    static fn ($role) => ['value' => $role->value, 'label' => $role->label()],
                    $this->hierarchy->assignableRoles($actor),
                ),
            ],
        );
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->respondSuccess((new UserResource($user))->resolve($request));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->users->create($request->user(), $request->validated());

        return $this->respondCreated(
            (new UserResource($user))->resolve($request),
            'User created.',
        );
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $updated = $this->users->update($request->user(), $user, $request->validated());

        return $this->respondSuccess(
            (new UserResource($updated))->resolve($request),
            'User updated.',
        );
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->users->delete($request->user(), $user);

        return $this->respondSuccess(null, 'User deleted.');
    }
}
