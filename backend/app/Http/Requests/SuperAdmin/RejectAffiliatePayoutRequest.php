<?php

namespace App\Http\Requests\SuperAdmin;

use App\Http\Requests\BaseFormRequest;

class RejectAffiliatePayoutRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // The affiliate needs to know why — mandatory, same as
            // RejectAccessRequestRequest.
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
