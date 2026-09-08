<?php

namespace App\Http\Requests\Vendor;

use App\Http\Requests\BaseFormRequest;
use App\Services\VendorCertificationService;
use Illuminate\Validation\Rule;

/**
 * One image upload for the Vendor Certification wizard (step 4). Mirrors
 * `helpers/upload-image.php`: `type` selects the slot, `image` is the file.
 * Deep validation (resolution, quality, duplicates) happens in
 * {@see VendorCertificationService::storeImage()}.
 */
class UploadVendorCertificationImageRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['vendor', 'shop', 'product'])],
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ];
    }
}
