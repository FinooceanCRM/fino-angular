<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:5000'],
            'lead_id' => ['nullable', 'numeric'],
            'priority' => ['sometimes', 'required', Rule::in(['low', 'medium', 'high'])],
            'due_at' => ['sometimes', 'required', 'date'],
            'assigned_to' => ['sometimes', 'required', 'numeric'],
        ];
    }
}
