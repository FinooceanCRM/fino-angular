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

        // KYC identity scans (Aadhaar front/back, PAN) are always photos or a
        // single-page scan, so they're held to a tighter file contract than
        // the general document upload (which also accepts spreadsheets/docs
        // for things like bank statements): images or PDF only, 5 MB cap.
        $isIdentityDocument = in_array(
            $this->input('document_type'),
            array_map(static fn (DocumentType $t): string => $t->value, DocumentType::leadCreationRequiredTypes()),
            true,
        );

        return [
            'document_type' => ['required', Rule::in(DocumentType::values())],
            'file' => [
                'required',
                'file',
                $isIdentityDocument ? 'max:5120' : 'max:10240',
                $isIdentityDocument ? 'mimes:pdf,jpg,jpeg,png' : 'mimes:pdf,jpg,jpeg,png,webp,doc,docx,xls,xlsx',
            ],
            'remarks' => [$remarksRequired ? 'required' : 'nullable', 'string', 'max:2000'],
        ];
    }
}
