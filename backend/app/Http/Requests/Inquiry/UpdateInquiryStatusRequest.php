<?php

namespace App\Http\Requests\Inquiry;

use App\Http\Requests\BaseFormRequest;

/** PUT inquiries/{id}/status */
class UpdateInquiryStatusRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'inquiry_status' => ['required', 'string', 'max:32'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'next_follow_up_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
