<?php

namespace App\Http\Requests\Inquiry;

use App\Http\Requests\BaseFormRequest;

/** POST inquiries/{id}/activities — a note or a logged customer contact. */
class AddInquiryActivityRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:note,contact'],
            'body' => ['required', 'string', 'min:2', 'max:2000'],
            'next_follow_up_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
