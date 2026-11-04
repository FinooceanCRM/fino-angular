<?php

namespace App\Http\Requests\Portal;

use App\Http\Requests\BaseFormRequest;

class LoginCustomerRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
