<?php

namespace App\Http\Requests\Approval;

use App\Http\Requests\BaseFormRequest;

class StoreApprovalCommentRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
        ];
    }
}
