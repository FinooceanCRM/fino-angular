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
    /**
     * @param array<string, mixed> $data
     */
    public function notify(?int $userId, string $type, string $title, ?string $body = null, array $data = []): ?Notification
    {
        if ($userId === null) {
            return null;
        }

        return Notification::query()->create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    /**
     * @param array<int, int|null> $userIds
     * @param array<string, mixed> $data
     */
    public function notifyMany(array $userIds, string $type, string $title, ?string $body = null, array $data = []): void
    {
        foreach (array_unique(array_filter($userIds)) as $userId) {
            $this->notify((int) $userId, $type, $title, $body, $data);
        }
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
