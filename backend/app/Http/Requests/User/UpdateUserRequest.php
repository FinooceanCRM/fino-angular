<?php

namespace App\Http\Requests\User;

use App\Enums\Department;
use App\Enums\UserRole;
use App\Http\Requests\BaseFormRequest;
use App\Models\User;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $target = $this->route('user');
        $userId = $target instanceof User ? $target->id : $target;

        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'max:180', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:8', 'max:100'],
            'role' => ['sometimes', Rule::in(UserRole::values())],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'relationship_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'employee_id' => ['prohibited'],
            'department' => ['nullable', Rule::in(Department::values())],
            'phone' => ['nullable', 'string', 'max:32'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
