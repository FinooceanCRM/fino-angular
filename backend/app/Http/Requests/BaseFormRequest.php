<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base class for all API form requests. Concrete requests are added
 * alongside their feature modules in later phases.
 */
abstract class BaseFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    abstract public function rules(): array;
}
