<?php

namespace App\Http\Requests\Lead;

use App\Enums\LeadStatus;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadStatusRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(LeadStatus::values())],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
