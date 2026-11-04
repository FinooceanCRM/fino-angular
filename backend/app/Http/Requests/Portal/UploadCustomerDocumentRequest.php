<?php

namespace App\Http\Requests\Portal;

use App\Http\Requests\BaseFormRequest;

class UploadCustomerDocumentRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', 'max:64'],
            // Extension AND sniffed MIME must both be on the list; 5 MB cap.
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png'],
        ];
    }
}
