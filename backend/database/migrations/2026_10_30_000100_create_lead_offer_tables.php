<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Offer-based lead generation for guest website visitors.
 *
 *  - lead_offers      the offers an admin creates (headline, validity, image…)
 *  - offer_settings   one row: popup on/off, delay (15–20 min), cooldown, pages
 *  - offer_events     anonymous funnel counters (impression → click → landing visit → lead); no personal data
 *  - loan_leads       gets `offer_id` + `visitor_id` so offer leads live in the EXISTING lead table
 *                     (sources `offer_popup` / `offer_landing`) and reach the telecaller Customer Inquiries queue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_offers', function (Blueprint $table): void {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 150);
            $table->string('type', 32)->default('free_consultation');
            $table->string('badge_text', 60)->nullable();
            $table->string('headline', 200);
            $table->text('description');
            $table->json('benefits')->nullable();
            $table->string('cta_text', 60)->default('Claim My Offer');
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('show_popup')->default(true);
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'show_popup']);
        });

        Schema::create('offer_settings', function (Blueprint $table): void {
            $table->id();
            $table->boolean('popup_enabled')->default(false);
            $table->unsignedTinyInteger('popup_delay_minutes')->default(15);
            $table->unsignedSmallInteger('cooldown_days')->default(7);
            /** Page patterns the popup may appear on, e.g. ["/", "/services/*"]; empty = every website page. */
            $table->json('pages')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('offer_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('offer_id')->nullable()->constrained('lead_offers')->cascadeOnDelete();
            $table->string('visitor_id', 64)->nullable()->index();
            $table->string('type', 16);
            $table->string('page', 190)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['offer_id', 'type', 'created_at']);
            $table->index(['type', 'created_at']);
        });

        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->unsignedBigInteger('offer_id')->nullable()->after('customer_id');
            $table->string('visitor_id', 64)->nullable()->after('offer_id');
            $table->index('offer_id');
            $table->index('visitor_id');
        });
    }

    public function down(): void
    {
        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropIndex(['offer_id']);
            $table->dropIndex(['visitor_id']);
            $table->dropColumn(['offer_id', 'visitor_id']);
        });
        Schema::dropIfExists('offer_events');
        Schema::dropIfExists('offer_settings');
        Schema::dropIfExists('lead_offers');
    }
};
