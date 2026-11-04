<?php

namespace App\Http\Requests\Portal;

use App\Http\Requests\BaseFormRequest;

class RegisterCustomerRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:191'],
            'email' => ['required', 'email:rfc', 'max:191', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^[0-9+\-\s()]{10,16}$/'],
            'password' => ['required', 'confirmed', 'string', 'min:8', 'max:100'],
            'terms' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Enter a valid mobile number.',
            'terms.accepted' => 'Please accept the Terms and Privacy Policy.',
        ];
    }
}
