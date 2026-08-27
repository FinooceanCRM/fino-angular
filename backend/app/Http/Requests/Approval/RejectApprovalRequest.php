<?php

namespace App\Http\Requests\Approval;

use App\Http\Requests\BaseFormRequest;

class RejectApprovalRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // A reason is mandatory — matches AccessRequest's reject and the
            // mock's ReasonDialogComponent, which always collects one.
            'remarks' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
