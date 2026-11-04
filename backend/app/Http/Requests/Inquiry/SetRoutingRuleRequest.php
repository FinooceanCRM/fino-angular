<?php

namespace App\Http\Requests\Inquiry;

use App\Http\Requests\BaseFormRequest;

/** PUT inquiries/routing-rules/{department} */
class SetRoutingRuleRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'manager_ids' => ['present', 'array'],
            'manager_ids.*' => ['integer'],
        ];
    }
}
