<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends BaseApiController
{
    public function __construct(private readonly NotificationService $notifications)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $paginator = $this->notifications->paginateFor(
            $user,
            filter_var($request->query('unread', false), FILTER_VALIDATE_BOOLEAN),
            (int) $request->query('per_page', 15),
        );

        return $this->respondSuccess(
            NotificationResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'unread_count' => $this->notifications->unreadCount($user),
            ],
        );
    }

    public function markRead(Request $request, int $notification): JsonResponse
    {
        $this->notifications->markRead($request->user(), $notification);

        return $this->respondSuccess(null, 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notifications->markAllRead($request->user());

        return $this->respondSuccess(['updated' => $count], 'All notifications marked as read.');
    }
}
