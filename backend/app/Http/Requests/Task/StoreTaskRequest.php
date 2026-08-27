<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['call', 'meeting', 'task', 'reminder'])],
            'title' => ['required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:5000'],
            'lead_id' => ['nullable', 'numeric'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'due_at' => ['required', 'date'],
            'assigned_to' => ['nullable', 'numeric'],
        ];
    }
}
