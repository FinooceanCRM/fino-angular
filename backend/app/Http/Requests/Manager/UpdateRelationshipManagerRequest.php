<?php

namespace App\Http\Requests\Manager;

use App\Http\Requests\BaseFormRequest;
use App\Models\Manager;
use Illuminate\Validation\Rule;

class UpdateRelationshipManagerRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateRelationshipManager', Manager::class);
    }

    /**
     * Role and reporting links are never editable here; ownership of the
     * target RM is enforced in ManagerService.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $targetId = (int) $this->route('relationship_manager');

        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'email' => [
                'sometimes',
                'email',
                'max:190',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],

            'designation' => ['sometimes', 'nullable', 'string', 'max:150'],
            'branch' => ['sometimes', 'nullable', 'string', 'max:150'],
            'region' => ['sometimes', 'nullable', 'string', 'max:150'],
        ];
    }
}
