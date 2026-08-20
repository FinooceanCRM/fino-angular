<?php

namespace App\Http\Requests\TelecallerFollowUp;

use App\Http\Requests\BaseFormRequest;

class RescheduleTelecallerFollowUpRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'next_follow_up_at' => ['required', 'date'],
        ];
    }
}
