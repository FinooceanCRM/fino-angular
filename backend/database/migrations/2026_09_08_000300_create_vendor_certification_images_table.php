<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Images attached to a Vendor Certification — the Fino-native equivalent of
 * the source app's `customer_survey_images`. `vendor` and `shop` are the two
 * mandatory photos; `product` is the optional extra-shop-photos gallery
 * (capped at 5 in the service). Files live on the private `local` disk (same
 * as lead documents) and are only ever served through an owner-checked
 * route.
 *
 * `hash` is the md5 of the stored file, used for the "this photo has already
 * been uploaded" duplicate check, mirroring `helpers/upload-image.php`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_certification_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('vendor_certification_id')
                ->constrained('vendor_certifications')
                ->cascadeOnDelete();
            $table->enum('image_type', ['vendor', 'shop', 'product'])->default('product');
            $table->string('file_path', 255);
            $table->unsignedInteger('file_size')->nullable();
            $table->string('original_name', 180)->nullable();
            $table->string('mime_type', 60)->nullable();
            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();
            $table->string('hash', 64)->nullable();
            $table->timestamps();

            // Explicit short name — the auto-generated
            // `vendor_certification_images_vendor_certification_id_image_type_index`
            // is 66 chars and exceeds MySQL's 64-char identifier limit.
            $table->index(['vendor_certification_id', 'image_type'], 'vci_images_cert_type_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_certification_images');
    }
};
