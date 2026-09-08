<?php

namespace App\Http\Requests\Banker;

use App\Http\Requests\BaseFormRequest;

class VerifyBankerOtpRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:180'],
            'otp' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'otp.regex' => 'Enter the 6-digit code.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }
}
