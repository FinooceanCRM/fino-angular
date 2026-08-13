<?php

namespace App\Http\Requests\Lead;

use App\Http\Requests\BaseFormRequest;

class AssignLeadRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'assignee_id' => ['required', 'integer', 'exists:users,id'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
