<?php

namespace App\Models;

use App\Enums\VendorCertificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A Vendor Certification survey — the Fino-native rebuild of the source
 * "Customer Survey" record. Belongs 1:many to a vendor (a user with the
 * `vendor` role); `vendor_id` is always set server-side from the
 * authenticated user.
 */
class VendorCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'certificate_number',
        // personal
        'full_name', 'guardian_name', 'gender', 'age', 'dob', 'mobile', 'alt_mobile',
        'email', 'aadhaar_number', 'occupation', 'education', 'category', 'social_category',
        // business
        'shop_name', 'business_type', 'vendor_category', 'years_in_business', 'ownership',
        'gst_number', 'license_number', 'daily_income', 'monthly_income', 'employees',
        'seasonal_business', 'business_open_time', 'business_close_time', 'weekly_holiday',
        // location / gps
        'gps_latitude', 'gps_longitude', 'accuracy', 'gps_heading', 'gps_speed',
        'gps_captured_at', 'location_verified', 'location_mode',
        // address
        'house_no', 'building', 'street', 'area', 'village', 'address', 'landmark',
        'city', 'district', 'state', 'pin_code', 'country',
        // declarations
        'declaration_truth', 'declaration_submit',
        // meta
        'status', 'remarks', 'submitted_at', 'ip_address', 'device', 'browser', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorCertificationStatus::class,
            'dob' => 'date',
            'age' => 'integer',
            'years_in_business' => 'integer',
            'employees' => 'integer',
            'daily_income' => 'decimal:2',
            'monthly_income' => 'decimal:2',
            'gps_latitude' => 'decimal:7',
            'gps_longitude' => 'decimal:7',
            'accuracy' => 'decimal:2',
            'gps_heading' => 'decimal:2',
            'gps_speed' => 'decimal:2',
            'gps_captured_at' => 'datetime',
            'location_verified' => 'boolean',
            'declaration_truth' => 'boolean',
            'declaration_submit' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function statusEnum(): VendorCertificationStatus
    {
        return $this->status instanceof VendorCertificationStatus
            ? $this->status
            : VendorCertificationStatus::from((string) $this->status);
    }

    /** The owning vendor (a `users` row with role = vendor). */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(VendorCertificationImage::class);
    }

    public function vendorPhoto(): HasMany
    {
        return $this->images()->where('image_type', 'vendor');
    }

    public function shopPhoto(): HasMany
    {
        return $this->images()->where('image_type', 'shop');
    }

    public function productPhotos(): HasMany
    {
        return $this->images()->where('image_type', 'product');
    }
}
