<?php

namespace App\Http\Requests\Portal;

use App\Http\Requests\BaseFormRequest;

/** Send (phone only) or verify (phone + 6-digit code) a mobile-number one-time code. */
class OtpRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
            'code' => [$this->routeIs('*otp.verify') ? 'required' : 'nullable', 'digits:6'],
        ];
    }
}
