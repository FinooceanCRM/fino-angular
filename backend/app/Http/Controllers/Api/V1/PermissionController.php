<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Permission;
use App\Services\AuditLogService;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends BaseApiController
{
    public function __construct(
        private readonly RolePermissionService $permissions,
        private readonly AuditLogService $audit,
    ) {
    }

    public function matrix(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        return $this->respondSuccess($this->permissions->matrix());
    }

    public function update(Request $request, string $role, string $module, string $action): JsonResponse
    {
        $this->authorize('manage', Permission::class);

        $granted = $request->boolean('granted');

        $result = $this->permissions->toggle($role, $module, $action, $granted);
        $moduleLabel = ucfirst(str_replace('_', ' ', $module));

        $this->audit->record(
            $request->user(),
            $granted ? 'Granted' : 'Revoked',
            'Permission',
            sprintf('%s · %s', $result['role']->name, $moduleLabel),
            sprintf(
                '%s %s %s access to %s for the %s role.',
                $request->user()->name,
                $granted ? 'granted' : 'revoked',
                $action,
                $moduleLabel,
                $result['role']->name,
            ),
            'permission_change',
        );

        return $this->respondSuccess(
            $this->permissions->matrix(),
            $granted ? 'Permission granted.' : 'Permission revoked.',
        );
    }
}
