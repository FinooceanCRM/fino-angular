<?php

namespace App\Http\Requests\Manager;

use App\Enums\Department;
use App\Http\Requests\BaseFormRequest;
use App\Models\Manager;
use Illuminate\Validation\Rule;

class StoreRelationshipManagerRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('createRelationshipManager', Manager::class);
    }

    /**
     * `role`, `manager_id` and `relationship_manager_id` are intentionally
     * absent: the new user is always a Relationship Manager attached to the
     * acting Manager.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
            // Each RM runs exactly one of the Manager's departments (PL/HL/ML).
            'department' => ['required', Rule::in(Department::values())],

            'designation' => ['sometimes', 'nullable', 'string', 'max:150'],
            'branch' => ['sometimes', 'nullable', 'string', 'max:150'],
            'region' => ['sometimes', 'nullable', 'string', 'max:150'],
        ];
    }
}
