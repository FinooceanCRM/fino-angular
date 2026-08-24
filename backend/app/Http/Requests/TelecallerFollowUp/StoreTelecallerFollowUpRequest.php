<?php

namespace App\Http\Requests\TelecallerFollowUp;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreTelecallerFollowUpRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['call', 'meeting', 'reminder', 'note'])],
            'priority' => ['sometimes', 'string', Rule::in(['low', 'medium', 'high'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'next_follow_up_at' => ['nullable', 'date'],
        ];
    }
}
