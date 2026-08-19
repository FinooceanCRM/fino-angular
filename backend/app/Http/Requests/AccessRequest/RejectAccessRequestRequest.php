<?php

namespace App\Http\Requests\AccessRequest;

use App\Http\Requests\BaseFormRequest;

class RejectAccessRequestRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // A reason is mandatory — the banker needs to know why.
            'remarks' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
