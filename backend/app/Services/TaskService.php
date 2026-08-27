<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Tasks (Phase 4): row-scoped Calls/Meetings/Tasks/Reminders, replacing both
 * the mock `TaskDataProvider` (Tasks module, every role) and the mock
 * `RelationshipManagerActivityDataProvider` (RM Activities tabs — a filtered
 * view over this same table via the `assigned_to=team` filter, not a
 * separate feature). Visibility scoping lives in
 * {@see \App\Repositories\EloquentTaskRepository}; this service replicates
 * the mock's exact create/complete/cancel/reschedule behaviour and counts.
 */
class TaskService extends BaseService
{
    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
        private readonly AuditLogService $auditLog,
    ) {
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(User $actor, array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->tasks->paginateVisible($actor, $filters, $perPage);
    }

    public function findVisible(User $actor, int $id): Task
    {
        $task = $this->tasks->findVisible($actor, $id);

        if ($task === null) {
            throw new DomainException('Task not found or not visible to you.', 404);
        }

        return $task;
    }

    /**
     * Matches the mock's `counts()` exactly: computed over the actor's
     * visible set, optionally narrowed to one activity type.
     *
     * @return array{open: int, overdue: int, dueToday: int, completed: int}
     */
    public function counts(User $actor, ?string $type = null): array
    {
        $query = $this->tasks->visibleQuery($actor);

        if ($type !== null) {
            $query->where('type', $type);
        }

        $tasks = $query->get();

        return [
            'open' => $tasks->where('status', 'pending')->count(),
            'overdue' => $tasks->filter(fn (Task $task): bool => $task->displayStatus() === 'overdue')->count(),
            'dueToday' => $tasks->filter(fn (Task $task): bool => $task->displayStatus() === 'due_today')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
        ];
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function create(User $actor, array $attributes): Task
    {
        return $this->transaction(function () use ($actor, $attributes): Task {
            $attributes['assigned_to'] = $attributes['assigned_to'] ?? $actor->id;
            $attributes['created_by'] = $actor->id;
            $attributes['status'] = 'pending';
            $attributes['completed_at'] = null;

            $task = $this->tasks->create($attributes);

            $this->auditLog->record(
                $actor,
                'Created',
                'Task',
                $task->title,
                sprintf('%s created %s "%s".', $actor->name, $task->type, $task->title),
                'other',
                $task->id,
            );

            return $task;
        });
    }

    public function complete(User $actor, Task $task): Task
    {
        $updated = $this->tasks->update($task, [
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->auditLog->record(
            $actor,
            'Completed',
            'Task',
            $updated->title,
            sprintf('%s marked "%s" complete.', $actor->name, $updated->title),
            'other',
            $updated->id,
        );

        return $updated;
    }

    public function cancel(User $actor, Task $task): Task
    {
        $updated = $this->tasks->update($task, ['status' => 'cancelled']);

        $this->auditLog->record(
            $actor,
            'Cancelled',
            'Task',
            $updated->title,
            sprintf('%s cancelled "%s".', $actor->name, $updated->title),
            'other',
            $updated->id,
        );

        return $updated;
    }

    /** Rescheduling forces status back to 'pending', matching the mock's exact behaviour. */
    public function reschedule(User $actor, Task $task, string $dueAt): Task
    {
        $updated = $this->tasks->update($task, [
            'due_at' => $dueAt,
            'status' => 'pending',
        ]);

        $this->auditLog->record(
            $actor,
            'Rescheduled',
            'Task',
            $updated->title,
            sprintf('%s rescheduled "%s".', $actor->name, $updated->title),
            'other',
            $updated->id,
        );

        return $updated;
    }

    public function delete(Task $task): bool
    {
        return $this->tasks->delete($task);
    }
}
