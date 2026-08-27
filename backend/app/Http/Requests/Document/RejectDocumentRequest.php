<?php

namespace App\Http\Requests\Document;

use App\Http\Requests\BaseFormRequest;

class RejectDocumentRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // The uploader needs to know why — mandatory, same as
            // RejectAccessRequestRequest / RejectApprovalRequest.
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
