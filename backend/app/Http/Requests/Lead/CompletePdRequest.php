<?php

namespace App\Http\Requests\Lead;

use App\Http\Requests\BaseFormRequest;

class CompletePdRequest extends BaseFormRequest
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
