<?php

namespace App\Http\Requests\SuperAdmin;

use App\Http\Requests\BaseFormRequest;

class RejectConnectorPayoutRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // The connector needs to know why — mandatory, same as
            // RejectAffiliatePayoutRequest.
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
