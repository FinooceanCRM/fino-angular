<?php

namespace App\Http\Requests\Inquiry;

use App\Http\Requests\BaseFormRequest;

/** POST inquiries/{id}/assign */
class AssignInquiryRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'manager_id' => ['required', 'integer'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
