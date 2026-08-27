<?php

namespace App\Http\Requests\Approval;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class StoreApprovalRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['banker', 'lead', 'document'])],
            'title' => ['required', 'string', 'max:191'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'loan_lead_id' => ['nullable', 'numeric'],
        ];
    }
}
