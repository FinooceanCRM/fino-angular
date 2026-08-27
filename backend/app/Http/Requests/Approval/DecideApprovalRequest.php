<?php

namespace App\Http\Requests\Approval;

use App\Http\Requests\BaseFormRequest;

class DecideApprovalRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
