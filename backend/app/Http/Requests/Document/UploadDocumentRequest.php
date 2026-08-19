<?php

namespace App\Http\Requests\Document;

use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UploadDocumentRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // An Employee's only avenue of leaving context on a lead once it's
        // restricted to documents-only (see LoanLeadPolicy::changeStatus())
        // is a remark on each upload, so it's required for them; everyone
        // else may leave one but isn't forced to.
        $remarksRequired = $this->user()?->roleEnum() === UserRole::Employee;

        return [
            'document_type' => ['required', Rule::in(DocumentType::values())],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx'],
            'remarks' => [$remarksRequired ? 'required' : 'nullable', 'string', 'max:2000'],
        ];
    }
}
