<?php

namespace App\Http\Requests\CustomerDocument;

use App\Enums\DocumentType;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UploadCustomerDocumentRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document_type' => ['required', Rule::in(DocumentType::values())],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
