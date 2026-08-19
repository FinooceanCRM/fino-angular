<?php

namespace App\Http\Requests\AccessRequest;

use App\Http\Requests\BaseFormRequest;

class CreateAccessRequestRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
