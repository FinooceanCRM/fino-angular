<?php

namespace App\Http\Requests\Task;

use App\Http\Requests\BaseFormRequest;

class RescheduleTaskRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'due_at' => ['required', 'date'],
        ];
    }
}
