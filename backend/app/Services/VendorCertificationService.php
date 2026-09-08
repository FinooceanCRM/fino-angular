<?php

namespace App\Services;

use App\Enums\VendorCertificationStatus;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Models\VendorCertification;
use App\Models\VendorCertificationImage;
use App\Support\ImageQuality;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Business rules for the Vendor Certification workflow — the Fino-native
 * rebuild of the reference Customer Survey (customer-survey/ PHP app).
 *
 * The wizard's step sequence, field set, validation, image rules,
 * duplicate detection, draft behaviour, submission and certificate
 * generation are all reproduced here; the ONLY deliberate deviations are
 * the ones needed to make it a Fino feature:
 *   - ownership is the authenticated user (`vendor_id`), never a browser value
 *   - the draft is a DB row (Fino is stateless) rather than a PHP session
 *   - files live on the private `local` disk, same as lead documents
 */
class VendorCertificationService extends BaseService
{
    /** Same private disk lead documents use (storage/app/private). */
    private const DISK = 'local';

    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

    /** Survey columns writable from the wizard / draft save — mirrors survey_columns(). */
    public function writableColumns(): array
    {
        return [
            'full_name', 'guardian_name', 'gender', 'age', 'dob', 'mobile', 'alt_mobile', 'email',
            'aadhaar_number', 'occupation', 'education', 'category', 'social_category',
            'shop_name', 'business_type', 'vendor_category', 'years_in_business', 'ownership',
            'gst_number', 'license_number', 'daily_income', 'monthly_income', 'employees',
            'seasonal_business', 'business_open_time', 'business_close_time', 'weekly_holiday',
            'gps_latitude', 'gps_longitude', 'accuracy', 'gps_heading', 'gps_speed',
            'gps_captured_at', 'location_verified', 'location_mode',
            'house_no', 'building', 'street', 'area', 'village',
            'address', 'landmark', 'city', 'district', 'state', 'pin_code', 'country',
            'declaration_truth', 'declaration_submit',
        ];
    }

    /* ----------------------------------------------------------------- reads */

    /** @return Collection<int, VendorCertification> */
    public function listFor(User $user)
    {
        return VendorCertification::query()
            ->where('vendor_id', $user->id)
            ->with('images')
            ->orderByDesc('created_at')
            ->get();
    }

    public function findForOwner(User $user, int $id): VendorCertification
    {
        $certification = VendorCertification::query()
            ->where('vendor_id', $user->id)
            ->with('images')
            ->find($id);

        if ($certification === null) {
            throw new DomainException('Certification not found.', 404);
        }

        return $certification;
    }

    /** The vendor's single open draft, created on first access. */
    public function draftFor(User $user): VendorCertification
    {
        $draft = VendorCertification::query()
            ->where('vendor_id', $user->id)
            ->where('status', VendorCertificationStatus::Draft->value)
            ->with('images')
            ->latest('id')
            ->first();

        if ($draft === null) {
            $draft = VendorCertification::query()->create([
                'vendor_id' => $user->id,
                'status' => VendorCertificationStatus::Draft->value,
                'country' => 'India',
            ]);
            $draft->setRelation('images', $draft->images()->getRelated()->newCollection());
        }

        return $draft;
    }

    /* --------------------------------------------------------------- writes */

    /**
     * Upsert the whitelisted survey fields onto the vendor's draft.
     *
     * @param  array<string, mixed>  $data
     */
    public function saveDraft(User $user, array $data): VendorCertification
    {
        $draft = $this->draftFor($user);

        $payload = array_intersect_key($data, array_flip($this->writableColumns()));

        // GPS capture timestamp is accepted only when well formed (mirrors submit.php).
        if (array_key_exists('gps_captured_at', $payload)) {
            $value = trim((string) ($payload['gps_captured_at'] ?? ''));
            $payload['gps_captured_at'] = preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/', $value) === 1
                ? str_replace('T', ' ', $value)
                : null;
        }

        $draft->fill($payload)->save();

        return $draft->fresh('images');
    }

    /* --------------------------------------------------------------- images */

    /**
     * Validate + store one uploaded image against its profile, then attach it
     * to the draft. `vendor` / `shop` replace any existing photo of that
     * type; `product` appends up to the profile's max_files.
     */
    public function storeImage(User $user, string $type, UploadedFile $file): VendorCertificationImage
    {
        $profile = config("vendors.image_profiles.$type");
        if ($profile === null) {
            throw new DomainException('Unknown image type.', 422);
        }

        $draft = $this->draftFor($user);

        // Location gate — no photograph without a confirmed pin (upload-image.php).
        if ($draft->gps_latitude === null || $draft->gps_longitude === null) {
            throw new DomainException('Please complete the location step before uploading photographs.', 422);
        }

        $label = (string) $profile['label'];

        if ($file->getSize() > (int) $profile['max_bytes']) {
            throw new DomainException(sprintf(
                '%s is too large. Maximum allowed is %d MB.',
                $label,
                (int) round($profile['max_bytes'] / 1048576),
            ), 422);
        }

        $info = @getimagesize($file->getRealPath());
        if ($info === false || empty($info[0]) || empty($info[1])) {
            throw new DomainException($label.' is corrupted or is not a real image file.', 422);
        }
        [$width, $height] = [(int) $info[0], (int) $info[1]];

        $mime = (string) $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIME, true)) {
            throw new DomainException('Unsupported format. Please upload a JPG, PNG or WEBP image.', 422);
        }

        // Reject anything carrying embedded scripting even with an image MIME.
        $head = (string) @file_get_contents($file->getRealPath(), false, null, 0, 512);
        if (preg_match('/<\?php|<script\b/i', $head) === 1) {
            throw new DomainException('This file was rejected for security reasons.', 422);
        }

        if ($width < (int) $profile['min_width'] || $height < (int) $profile['min_height']) {
            throw new DomainException(sprintf(
                '%s resolution is too small (%d x %d). Minimum is %d x %d pixels.',
                $label, $width, $height, (int) $profile['min_width'], (int) $profile['min_height'],
            ), 422);
        }

        $qualityProblem = ImageQuality::rejectionReason($file->getRealPath(), $label);
        if ($qualityProblem !== null) {
            throw new DomainException($qualityProblem, 422);
        }

        // Duplicate protection across every slot (helpers/upload-image.php):
        // reject a file whose md5 already exists on this draft — unless it is
        // the same-type slot being re-uploaded (replace is allowed).
        $hash = (string) @md5_file($file->getRealPath());
        if ($hash !== '' && $draft->images()->where('hash', $hash)->where('image_type', '!=', $type)->exists()) {
            throw new DomainException('This photo has already been uploaded. Please choose a different image.', 422);
        }
        if ($hash !== '' && $type === 'product' && $draft->images()->where('hash', $hash)->where('image_type', 'product')->exists()) {
            throw new DomainException('This photo has already been uploaded. Please choose a different image.', 422);
        }

        if ($type === 'product') {
            $count = $draft->images()->where('image_type', 'product')->count();
            if ($count >= (int) ($profile['max_files'] ?? 5)) {
                throw new DomainException('You can upload up to 5 extra shop photos.', 422);
            }
        }

        return $this->transaction(function () use ($draft, $type, $file, $profile, $mime, $width, $height, $hash): VendorCertificationImage {
            // vendor / shop are single-slot: drop the previous file + row first.
            if ($type !== 'product') {
                foreach ($draft->images()->where('image_type', $type)->get() as $existing) {
                    Storage::disk(self::DISK)->delete($existing->file_path);
                    $existing->delete();
                }
            }

            $ext = match ($mime) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                default => 'jpg',
            };
            $name = $type.'_'.now()->format('Ymd').'_'.bin2hex(random_bytes(4)).'.'.$ext;
            $path = $file->storeAs(
                'vendor-certifications/'.$draft->id.'/'.$profile['folder'],
                $name,
                self::DISK,
            );

            return $draft->images()->create([
                'image_type' => $type,
                'file_path' => $path,
                'file_size' => Storage::disk(self::DISK)->size($path),
                'original_name' => Str::limit($file->getClientOriginalName(), 175, ''),
                'mime_type' => $mime,
                'width' => $width,
                'height' => $height,
                'hash' => $hash,
            ]);
        });
    }

    public function deleteImage(User $user, int $imageId): void
    {
        $draft = $this->draftFor($user);
        $image = $draft->images()->find($imageId);

        if ($image === null) {
            throw new DomainException('That image is no longer available.', 404);
        }

        Storage::disk(self::DISK)->delete($image->file_path);
        $image->delete();
    }

    /* ------------------------------------------------------------- download */

    public function streamImage(User $user, int $certificationId, int $imageId): StreamedResponse
    {
        $certification = $this->findForOwner($user, $certificationId);
        $image = $certification->images()->find($imageId);

        if ($image === null || ! Storage::disk(self::DISK)->exists($image->file_path)) {
            throw new DomainException('Image not found.', 404);
        }

        return Storage::disk(self::DISK)->response($image->file_path);
    }

    /* --------------------------------------------------------------- submit */

    /**
     * Finalise the draft into a completed certification.
     * Field validation has already run in SubmitVendorCertificationRequest;
     * here we apply the survey's own server-side gates: both mandatory
     * photos present, the soft duplicate window, and the certificate number.
     *
     * @param  array<string, mixed>  $data  validated survey payload
     * @param  array<string, string|null>  $meta  ip / device / browser / user_agent
     */
    public function submit(User $user, array $data, array $meta): VendorCertification
    {
        // Soft duplicate protection (pages/submit.php): if this vendor
        // already submitted a certification for the same mobile + shop name
        // within the window (e.g. a double-tap), return that one instead of
        // creating another. Checked FIRST, against the payload, before the
        // draft is touched.
        $window = (int) config('vendors.duplicate_window_minutes', 10);
        $duplicate = VendorCertification::query()
            ->where('vendor_id', $user->id)
            ->where('status', '!=', VendorCertificationStatus::Draft->value)
            ->where('mobile', $data['mobile'] ?? null)
            ->where('shop_name', $data['shop_name'] ?? null)
            ->where('submitted_at', '>=', now()->subMinutes($window))
            ->latest('id')
            ->first();

        if ($duplicate !== null) {
            return $duplicate->load('images');
        }

        $draft = $this->draftFor($user);

        $this->saveDraft($user, $data);
        $draft->refresh()->load('images');

        if ($draft->images()->where('image_type', 'vendor')->doesntExist()) {
            throw new DomainException('The vendor passport photo is mandatory.', 422);
        }
        if ($draft->images()->where('image_type', 'shop')->doesntExist()) {
            throw new DomainException('The shop front image is mandatory.', 422);
        }

        if (! $draft->declaration_truth || ! $draft->declaration_submit) {
            throw new DomainException('Please accept both declarations before submitting.', 422);
        }

        return $this->transaction(function () use ($draft, $meta): VendorCertification {
            $draft->forceFill([
                'certificate_number' => $this->nextCertificateNumber(),
                'status' => VendorCertificationStatus::Completed->value,
                'submitted_at' => now(),
                'ip_address' => $meta['ip_address'] ?? null,
                'device' => $meta['device'] ?? null,
                'browser' => $meta['browser'] ?? null,
                'user_agent' => $meta['user_agent'] ?? null,
            ])->save();

            return $draft->fresh('images');
        });
    }

    /** Next sequential certificate number (VC0000001). Mirrors next_survey_number(). */
    public function nextCertificateNumber(): string
    {
        $prefix = (string) config('vendors.certificate.number_prefix', 'VC');
        $pad = (int) config('vendors.certificate.number_pad', 7);

        $last = (string) (VendorCertification::query()
            ->whereNotNull('certificate_number')
            ->orderByDesc('id')
            ->value('certificate_number') ?? '');

        $seq = $last !== '' ? (int) preg_replace('/\D/', '', $last) : 0;

        return $prefix.str_pad((string) ($seq + 1), $pad, '0', STR_PAD_LEFT);
    }

    /* ---------------------------------------------------------- certificate */

    /** Verification code printed under the QR block. Mirrors certificate_verification_code(). */
    public function verificationCode(VendorCertification $certification): string
    {
        return strtoupper(substr(hash(
            'sha256',
            $certification->certificate_number.'|'.($certification->submitted_at?->toDateTimeString() ?? ''),
        ), 0, 12));
    }

    /**
     * Everything the Angular certificate view needs to render the
     * government-style certificate and its PDF.
     *
     * @return array<string, mixed>
     */
    public function certificateData(VendorCertification $certification): array
    {
        $certification->loadMissing('images');

        return [
            'org' => config('vendors.certificate.org'),
            'department' => config('vendors.certificate.department'),
            'officer' => config('vendors.certificate.officer'),
            'verification_code' => $this->verificationCode($certification),
        ];
    }
}
