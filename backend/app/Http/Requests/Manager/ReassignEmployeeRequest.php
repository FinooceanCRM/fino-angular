<?php

namespace App\Http\Requests\Manager;

use App\Http\Requests\BaseFormRequest;
use App\Models\Manager;

class ReassignEmployeeRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->can('reassignEmployee', Manager::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'relationship_manager_id' => ['required', 'integer'],
            'remarks' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
