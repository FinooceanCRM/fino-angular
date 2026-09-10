<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * In-app notifications for lead assignment, status changes and document
 * uploads (Phase 9).
 */
class NotificationService extends BaseService
{
    public function __construct(private readonly PushService $push)
    {
    }

    /**
     * @param array<string, mixed> $data
     * @param bool $push  send a device push as well as writing the in-app row
     *                    (set false by notifyMany, which pushes once in bulk)
     */
    public function notify(
        ?int $userId,
        string $type,
        string $title,
        ?string $body = null,
        array $data = [],
        bool $push = true,
    ): ?Notification {
        if ($userId === null) {
            return null;
        }

        $notification = Notification::query()->create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        if ($push) {
            $this->push->sendToUsers([$userId], $title, $body, ['type' => $type] + $data);
        }

        return $notification;
    }

    /**
     * @param array<int, int|null> $userIds
     * @param array<string, mixed> $data
     */
    public function notifyMany(array $userIds, string $type, string $title, ?string $body = null, array $data = []): void
    {
        $userIds = array_values(array_unique(array_filter($userIds)));

        foreach ($userIds as $userId) {
            $this->notify((int) $userId, $type, $title, $body, $data, push: false);
        }

        $this->push->sendToUsers($userIds, $title, $body, ['type' => $type] + $data);
    }

    public function paginateFor(User $user, bool $unreadOnly = false, int $perPage = 15): LengthAwarePaginator
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->when($unreadOnly, fn ($q) => $q->whereNull('read_at'))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function unreadCount(User $user): int
    {
        return Notification::query()->where('user_id', $user->id)->whereNull('read_at')->count();
    }

    public function markRead(User $user, int $notificationId): bool
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->whereKey($notificationId)
            ->update(['read_at' => now()]) > 0;
    }

    public function markAllRead(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
