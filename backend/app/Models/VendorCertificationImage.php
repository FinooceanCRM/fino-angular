<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One image on a Vendor Certification. Files are stored on the private
 * `local` disk (see VendorCertificationService::DISK) and only served
 * through an owner-checked route.
 */
class VendorCertificationImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_certification_id',
        'image_type',
        'file_path',
        'file_size',
        'original_name',
        'mime_type',
        'width',
        'height',
        'hash',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function certification(): BelongsTo
    {
        return $this->belongsTo(VendorCertification::class, 'vendor_certification_id');
    }
}
