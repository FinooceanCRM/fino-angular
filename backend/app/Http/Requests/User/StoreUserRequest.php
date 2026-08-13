<?php

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:100'],
            'role' => ['required', Rule::in(UserRole::values())],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'relationship_manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
