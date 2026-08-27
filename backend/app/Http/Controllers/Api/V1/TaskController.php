<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Task\RescheduleTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tasks API (Phase 4). Every read is hierarchy-scoped via {@see TaskService},
 * the same shape as {@see CustomerController}. Backs both the Tasks module
 * (every role) and — via the `assigned_to=team` filter — the Relationship
 * Manager module's Activities tabs.
 */
class TaskController extends BaseApiController
{
    public function __construct(private readonly TaskService $tasks) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);
        $actor = $request->user();

        $paginator = $this->tasks->paginate($actor, [
            'type' => $request->query('type'),
            'status' => $request->query('status'),
            'priority' => $request->query('priority'),
            'due' => $request->query('due'),
            'assigned_to' => $request->query('assigned_to'),
        ], (int) $request->query('per_page', 15));

        return $this->respondSuccess(
            TaskResource::collection($paginator->items())->resolve($request),
            null,
            [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        );
    }

    public function counts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);

        return $this->respondSuccess(
            $this->tasks->counts($request->user(), $request->query('type')),
        );
    }

    public function show(Request $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('view', $model);

        return $this->respondSuccess((new TaskResource($model))->resolve($request));
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $task = $this->tasks->create($request->user(), $this->mapPayload($request->validated()));
        $task->load(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name']);

        return $this->respondCreated((new TaskResource($task))->resolve($request), 'Task created.');
    }

    public function update(UpdateTaskRequest $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('update', $model);

        $model->fill($this->mapPayload($request->validated()))->save();
        $model->load(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name']);

        return $this->respondSuccess((new TaskResource($model))->resolve($request), 'Task updated.');
    }

    public function destroy(Request $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('delete', $model);

        $this->tasks->delete($model);

        return $this->respondSuccess(null, 'Task deleted.');
    }

    public function complete(Request $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('update', $model);

        $updated = $this->tasks->complete($request->user(), $model);
        $updated->load(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name']);

        return $this->respondSuccess((new TaskResource($updated))->resolve($request), 'Task marked complete.');
    }

    public function cancel(Request $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('update', $model);

        $updated = $this->tasks->cancel($request->user(), $model);
        $updated->load(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name']);

        return $this->respondSuccess((new TaskResource($updated))->resolve($request), 'Task cancelled.');
    }

    public function reschedule(RescheduleTaskRequest $request, int $task): JsonResponse
    {
        $model = $this->tasks->findVisible($request->user(), $task);
        $this->authorize('update', $model);

        $updated = $this->tasks->reschedule($request->user(), $model, $request->validated('due_at'));
        $updated->load(['assignee:id,name,email,role', 'creator:id,name,email,role', 'lead:id,reference,applicant_name']);

        return $this->respondSuccess((new TaskResource($updated))->resolve($request), 'Task rescheduled.');
    }

    /**
     * Maps the request's public field names (`lead_id`) onto the model's
     * storage column (`loan_lead_id`).
     *
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated): array
    {
        if (array_key_exists('lead_id', $validated)) {
            $validated['loan_lead_id'] = $validated['lead_id'];
            unset($validated['lead_id']);
        }

        return $validated;
    }
}
