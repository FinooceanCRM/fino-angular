<?php

namespace App\Http\Requests\RelationshipManager;

use App\Http\Requests\BaseFormRequest;
use App\Models\RelationshipManager;

class UpdateRelationshipManagerProfileRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('updateOwnProfile', RelationshipManager::class);
    }

    /**
     * Role, status, rm_code and the reporting link to a Manager are
     * intentionally absent: an RM may never change them.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            'designation' => ['sometimes', 'nullable', 'string', 'max:150'],
            'branch' => ['sometimes', 'nullable', 'string', 'max:150'],
            'region' => ['sometimes', 'nullable', 'string', 'max:150'],
            'alternate_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address_line1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address_line2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'state' => ['sometimes', 'nullable', 'string', 'max:100'],
            'pincode' => ['sometimes', 'nullable', 'string', 'max:10'],
        ];
    }
}
