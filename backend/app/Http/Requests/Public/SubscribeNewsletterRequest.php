<?php

namespace App\Http\Requests\Public;

use App\Http\Requests\BaseFormRequest;

class SubscribeNewsletterRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:191'],
            'website' => ['nullable', 'string', 'max:255'],
        ];
    }
}
