<?php

namespace App\Http\Resources;

use App\Models\VendorCertificationImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VendorCertificationImage
 */
class VendorCertificationImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_type' => $this->image_type,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'width' => $this->width,
            'height' => $this->height,
            // Relative-to-apiBaseUrl path for the owner-checked, bearer-gated
            // stream route. The Angular side fetches it as a blob (auth
            // header attached) and shows an object URL — never a direct
            // storage path, never a query-string token.
            'path' => 'vendors/certifications/'.$this->vendor_certification_id.'/images/'.$this->id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
