<?php

namespace Tests\Feature\Offers;

use App\Enums\LeadStatus;
use App\Models\LeadOffer;
use App\Models\LoanLead;
use App\Models\Notification;
use App\Models\OfferEvent;
use App\Models\OfferSetting;
use App\Models\User;
use App\Services\Contracts\CaptchaVerifierInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Offer-based lead generation: popup rules, landing page, lead capture, telecaller queue, admin and analytics. */
class OfferLeadSystemTest extends TestCase
{
    use RefreshDatabase;

    private const VISITOR = '3f2b8c1e-9d4a-4e7b-a1c2-5d6e7f8a9b0c';

    private function offer(array $o = []): LeadOffer
    {
        return LeadOffer::query()->create(array_merge([
            'slug' => 'free-consultation', 'name' => 'Free Consultation', 'type' => 'free_consultation', 'badge_text' => 'Limited time',
            'headline' => 'Get a free loan consultation', 'description' => 'Talk to an expert about the best loan for you.',
            'benefits' => ['Expert advice', 'No obligation'], 'cta_text' => 'Claim My Offer', 'is_active' => true, 'show_popup' => true,
        ], $o));
    }

    private function enablePopup(array $o = []): OfferSetting
    {
        $s = OfferSetting::current();
        $s->update(array_merge(['popup_enabled' => true, 'callback_enabled' => false, 'first_delay_seconds' => 15, 'second_delay_seconds' => 120, 'repeat_gap_seconds' => 900, 'pages' => []], $o));

        return $s;
    }

    private function role(string $role): User
    {
        return User::factory()->create(['role' => $role]);
    }

    /** @return array<string, mixed> */
    private function form(array $o = []): array
    {
        return array_merge([
            'name' => 'Rohan Sharma', 'phone' => '9876543210', 'email' => 'rohan@example.test', 'city' => 'Nagpur',
            'privacy_consent' => true, 'visitor_id' => self::VISITOR, 'entry' => 'landing', 'elapsed_ms' => 8000,
        ], $o);
    }

    private function claim(LeadOffer $offer, array $o = [])
    {
        return $this->postJson("/api/v1/public/offers/{$offer->slug}/leads", $this->form($o));
    }

    // ═════════ popup configuration ═════════

    public function test_by_default_only_the_details_form_is_offered_and_the_offer_popup_stays_off(): void
    {
        $this->offer();
        $d = $this->getJson('/api/v1/public/offers/popup')->assertOk()->json('data');
        $this->assertTrue($d['enabled']);
        $this->assertTrue($d['callback_enabled']);
        $this->assertNull($d['offer']);   // offers wait for the admin to switch the popup on
    }

    public function test_the_popup_stays_off_when_no_offer_is_live(): void
    {
        $this->enablePopup();
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', false);

        $this->offer(['is_active' => false]);
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', false);
    }

    public function test_an_enabled_popup_returns_the_offer_schedule_and_pages(): void
    {
        $this->enablePopup(['first_delay_seconds' => 3, 'second_delay_seconds' => 20, 'repeat_gap_seconds' => 300, 'pages' => ['/', '/services/*']]);
        $this->offer();
        $d = $this->getJson('/api/v1/public/offers/popup')->assertOk()->json('data');
        $this->assertTrue($d['enabled']);
        $this->assertSame([3, 20, 300], [$d['first_delay_seconds'], $d['second_delay_seconds'], $d['repeat_gap_seconds']]);
        $this->assertSame(['/', '/services/*'], $d['pages']);
        $this->assertSame('Get a free loan consultation', $d['offer']['headline']);
        $this->assertSame('Claim My Offer', $d['offer']['cta_text']);
        $this->assertSame(['Expert advice', 'No obligation'], $d['offer']['benefits']);
        $this->assertSame('free-consultation', $d['offer']['slug']);
    }

    public function test_the_default_schedule_is_15_seconds_then_2_minutes_then_every_15_minutes(): void
    {
        $this->offer();
        $s = $this->enablePopup();
        $d = $this->getJson('/api/v1/public/offers/popup')->json('data');
        $this->assertSame([15, 120, 900], [$d['first_delay_seconds'], $d['second_delay_seconds'], $d['repeat_gap_seconds']]);

        $s->update(['second_delay_seconds' => 0, 'repeat_gap_seconds' => 1, 'first_delay_seconds' => 999999]);
        $d = $this->getJson('/api/v1/public/offers/popup')->json('data');
        $this->assertSame([3600, 5, 30], [$d['first_delay_seconds'], $d['second_delay_seconds'], $d['repeat_gap_seconds']]);
    }

    public function test_only_live_popup_offers_are_chosen_and_the_first_by_order_wins(): void
    {
        $this->enablePopup();
        $this->offer(['slug' => 'expired', 'name' => 'Expired', 'valid_until' => now()->subDay()]);
        $this->offer(['slug' => 'future', 'name' => 'Future', 'valid_from' => now()->addDay()]);
        $this->offer(['slug' => 'no-popup', 'name' => 'No popup', 'show_popup' => false]);
        $this->offer(['slug' => 'second', 'name' => 'Second', 'sort_order' => 5]);
        $this->offer(['slug' => 'first', 'name' => 'First', 'sort_order' => 1]);
        $this->assertSame('first', $this->getJson('/api/v1/public/offers/popup')->json('data.offer.slug'));
    }

    public function test_a_visitor_who_submitted_the_form_is_never_offered_the_popup_again(): void
    {
        $this->enablePopup();
        $offer = $this->offer();
        $other = '9a8b7c6d-1111-4222-8333-444455556666';

        $this->getJson('/api/v1/public/offers/popup?visitor_id='.self::VISITOR)->assertJsonPath('data.enabled', true);
        $this->postJson("/api/v1/public/offers/{$offer->slug}/leads", $this->form())->assertCreated();

        $this->getJson('/api/v1/public/offers/popup?visitor_id='.self::VISITOR)->assertJsonPath('data.enabled', false);
        $this->getJson('/api/v1/public/offers/popup?visitor_id='.$other)->assertJsonPath('data.enabled', true);   // other visitors are unaffected
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', true);
        $this->getJson('/api/v1/public/offers/popup?visitor_id=<script>')->assertJsonPath('data.enabled', true);  // junk ids are ignored

        // a repeat submission (same phone) counts too
        $this->postJson("/api/v1/public/offers/{$offer->slug}/leads", $this->form(['visitor_id' => $other]))->assertCreated();
        $this->getJson('/api/v1/public/offers/popup?visitor_id='.$other)->assertJsonPath('data.enabled', false);
    }

    public function test_an_offer_is_live_only_inside_its_validity_window(): void
    {
        $offer = $this->offer(['valid_from' => now()->subDay(), 'valid_until' => now()->addDay()]);
        $this->getJson("/api/v1/public/offers/{$offer->slug}")->assertOk();
        $this->travel(2)->days();
        $this->getJson("/api/v1/public/offers/{$offer->slug}")->assertNotFound();
    }

    public function test_a_plain_end_date_means_the_whole_day(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        $this->travelTo(now()->setTime(15, 30));
        $id = $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['valid_from' => now()->toDateString(), 'valid_until' => now()->toDateString()]))->assertCreated()->json('data.id');
        $slug = LeadOffer::query()->find($id)->slug;

        $this->getJson("/api/v1/public/offers/{$slug}")->assertOk();                      // live from the start of the day
        $this->travelTo(now()->setTime(23, 50));
        $this->getJson("/api/v1/public/offers/{$slug}")->assertOk();                      // still live late in its last day
        $this->travelTo(now()->addDay()->setTime(0, 5));
        $this->getJson("/api/v1/public/offers/{$slug}")->assertNotFound();                // over the next morning
    }

    public function test_the_landing_page_content_is_public_and_hides_internal_fields(): void
    {
        $offer = $this->offer();
        $d = $this->getJson("/api/v1/public/offers/{$offer->slug}")->assertOk()->json('data');
        $this->assertSame('Free Consultation', $d['name']);
        $this->assertSame('Free Consultation', $d['type_label']);
        $this->assertArrayNotHasKey('is_active', $d);
        $this->assertArrayNotHasKey('created_by', $d);
    }

    public function test_inactive_expired_or_unknown_offers_have_no_landing_page(): void
    {
        $this->offer(['slug' => 'off', 'is_active' => false]);
        $this->offer(['slug' => 'old', 'name' => 'Old', 'valid_until' => now()->subMinute()]);
        foreach (['off', 'old', 'nope'] as $slug) {
            $this->getJson("/api/v1/public/offers/{$slug}")->assertNotFound();
        }
    }

    public function test_the_offer_image_is_served_only_when_one_was_uploaded(): void
    {
        Storage::fake('local');
        $offer = $this->offer();
        $this->get("/api/v1/public/offers/{$offer->slug}/image")->assertNotFound();

        Sanctum::actingAs($this->role('super_admin'));
        $this->post("/api/v1/super-admin/offers/{$offer->id}/image", ['file' => UploadedFile::fake()->create('banner.png', 100, 'image/png')], ['Accept' => 'application/json'])->assertOk();
        $this->get("/api/v1/public/offers/{$offer->slug}/image")->assertOk();
    }

    // ═════════ anonymous funnel events ═════════

    public function test_the_three_public_funnel_events_are_recorded(): void
    {
        $offer = $this->offer();
        foreach (['impression', 'click', 'landing_visit'] as $type) {
            $this->postJson('/api/v1/public/offers/events', ['type' => $type, 'offer_id' => $offer->id, 'visitor_id' => self::VISITOR, 'page' => '/services'])
                ->assertOk()->assertJsonPath('data.recorded', true);
        }
        $this->assertSame(3, OfferEvent::query()->count());
        $this->assertSame('/services', OfferEvent::query()->where('type', 'click')->value('page'));
    }

    public function test_visitors_cannot_report_server_only_events_or_invalid_data(): void
    {
        $offer = $this->offer();
        foreach (['lead', 'duplicate', 'hack'] as $type) {
            $this->postJson('/api/v1/public/offers/events', ['type' => $type, 'offer_id' => $offer->id])->assertStatus(422);
        }
        $this->postJson('/api/v1/public/offers/events', ['type' => 'impression', 'offer_id' => $offer->id, 'visitor_id' => 'not valid!'])->assertStatus(422);
        $this->postJson('/api/v1/public/offers/events', ['type' => 'impression'])->assertStatus(422);
        $this->assertSame(0, OfferEvent::query()->count());
    }

    public function test_events_for_unknown_or_inactive_offers_are_ignored(): void
    {
        $off = $this->offer(['is_active' => false]);
        $this->postJson('/api/v1/public/offers/events', ['type' => 'impression', 'offer_id' => $off->id])->assertOk()->assertJsonPath('data.recorded', false);
        $this->postJson('/api/v1/public/offers/events', ['type' => 'impression', 'offer_id' => 99999])->assertOk()->assertJsonPath('data.recorded', false);
        $this->assertSame(0, OfferEvent::query()->count());
    }

    public function test_reloading_does_not_inflate_the_funnel_but_other_visitors_count(): void
    {
        $offer = $this->offer();
        $send = fn (string $v) => $this->postJson('/api/v1/public/offers/events', ['type' => 'impression', 'offer_id' => $offer->id, 'visitor_id' => $v]);
        $send(self::VISITOR);
        $this->assertFalse($send(self::VISITOR)->json('data.recorded'));
        $this->assertTrue($send('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')->json('data.recorded'));
        $this->assertSame(2, OfferEvent::query()->count());

        $this->travel(31)->minutes();
        $this->assertTrue($send(self::VISITOR)->json('data.recorded'));
    }

    // ═════════ the lead form ═════════

    public function test_a_valid_submission_saves_a_lead_in_the_existing_lead_table(): void
    {
        $offer = $this->offer();
        $res = $this->claim($offer)->assertCreated();
        $this->assertMatchesRegularExpression('/^OFR-\d{6}-[A-Z0-9]{5}$/', $res->json('data.reference'));
        $this->assertStringContainsString('Thank you', $res->json('message'));

        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('Rohan Sharma', $lead->applicant_name);
        $this->assertSame('9876543210', $lead->applicant_phone);
        $this->assertSame('rohan@example.test', $lead->applicant_email);
        $this->assertSame('Nagpur', $lead->city);
        $this->assertSame('offer_landing', $lead->source);
        $this->assertSame('new', $lead->inquiry_status);
        $this->assertSame(LeadStatus::New, $lead->statusEnum());
        $this->assertSame($offer->id, $lead->offer_id);
        $this->assertSame(self::VISITOR, $lead->visitor_id);
        $this->assertEquals(0, $lead->loan_amount);
        $this->assertNull($lead->customer_id);
        $this->assertNotNull($lead->created_at);
        $this->assertSame('guest', $lead->details['offer']['account_status']);
        $this->assertSame('Free Consultation', $lead->details['offer']['name']);
        $this->assertFalse($lead->details['offer']['marketing_consent']);
        $this->assertNotEmpty($lead->details['offer']['privacy_consent_at']);
    }

    public function test_the_entry_decides_the_lead_source(): void
    {
        $offer = $this->offer();
        $this->claim($offer, ['entry' => 'popup', 'phone' => '9876500001'])->assertCreated();
        $this->claim($offer, ['entry' => 'landing', 'phone' => '9876500002'])->assertCreated();
        $this->claim($offer, ['entry' => null, 'phone' => '9876500003'])->assertCreated();
        $this->assertSame(['offer_popup', 'offer_landing', 'offer_landing'], LoanLead::query()->orderBy('id')->pluck('source')->all());
    }

    public function test_optional_fields_and_the_separate_marketing_consent_are_stored(): void
    {
        $offer = $this->offer();
        $this->claim($offer, ['interested_service' => 'home-loan', 'message' => 'Call me after 5 pm.', 'marketing_consent' => true])->assertCreated();
        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('home', $lead->loan_type);
        $this->assertSame('Home Loan', $lead->details['offer']['interested_service']);
        $this->assertSame('Call me after 5 pm.', $lead->details['offer']['message']);
        $this->assertTrue($lead->details['offer']['marketing_consent']);
    }

    public function test_phone_numbers_are_cleaned_to_ten_digits(): void
    {
        $offer = $this->offer();
        foreach (['+91 98765 43210', '09876543210', '98765-43210', '(91) 9876543210'] as $i => $phone) {
            LoanLead::query()->delete();
            $this->claim($offer, ['phone' => $phone])->assertCreated();
            $this->assertSame('9876543210', LoanLead::query()->value('applicant_phone'), $phone);
        }
    }

    public function test_every_required_field_is_enforced(): void
    {
        $offer = $this->offer();
        foreach (['name', 'phone', 'email', 'city', 'privacy_consent'] as $field) {
            $this->postJson("/api/v1/public/offers/{$offer->slug}/leads", array_diff_key($this->form(), [$field => 1]))
                ->assertStatus(422)->assertJsonValidationErrors($field);
        }
        $this->assertSame(0, LoanLead::query()->count());
    }

    public function test_invalid_values_are_refused(): void
    {
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        $offer = $this->offer();
        $bad = [
            ['phone' => '12345'], ['phone' => '5876543210'], ['phone' => 'abcdefghij'], ['phone' => '98765432101234'],
            ['email' => 'not-an-email'], ['email' => 'a@'], ['name' => 'R'], ['name' => 'Rohan 123'], ['name' => '12345'],
            ['city' => 'N'], ['city' => 'Nagpur 440001'], ['message' => str_repeat('x', 501)], ['interested_service' => 'bitcoin-loan'],
            ['privacy_consent' => false], ['visitor_id' => 'bad id!'], ['entry' => 'hack'],
        ];
        foreach ($bad as $b) {
            $this->claim($offer, $b)->assertStatus(422);
        }
        $this->assertSame(0, LoanLead::query()->count());
    }

    public function test_markup_in_text_fields_is_removed(): void
    {
        $offer = $this->offer();
        $this->claim($offer, ['name' => '<b>Rohan</b> Sharma', 'city' => '<i>Nagpur</i>', 'message' => 'Hi <script>alert(1)</script>there'])->assertCreated();
        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('Rohan Sharma', $lead->applicant_name);
        $this->assertSame('Nagpur', $lead->city);
        $this->assertStringNotContainsString('<', $lead->details['offer']['message']);
    }

    public function test_bots_get_the_normal_answer_but_nothing_is_saved(): void
    {
        $offer = $this->offer();
        $this->claim($offer, ['website' => 'http://spam.example'])->assertCreated()->assertJsonPath('data.reference', null);
        $this->claim($offer, ['elapsed_ms' => 400])->assertCreated()->assertJsonPath('data.reference', null);
        $this->assertSame(0, LoanLead::query()->count());
        $this->assertSame(0, Notification::query()->count());
    }

    public function test_an_expired_or_deactivated_offer_refuses_leads(): void
    {
        $offer = $this->offer();
        $offer->update(['is_active' => false]);
        $this->claim($offer)->assertNotFound();
        $offer->update(['is_active' => true, 'valid_until' => now()->subMinute()]);
        $this->claim($offer)->assertNotFound();
        $this->claim($this->offer(['slug' => 'missing']), [])->assertCreated();
        $this->postJson('/api/v1/public/offers/does-not-exist/leads', $this->form())->assertNotFound();
        $this->assertSame(1, LoanLead::query()->count());
    }

    public function test_a_failed_captcha_stops_a_guest_when_a_captcha_is_configured(): void
    {
        config(['services.captcha.secret' => 'secret']);
        $this->app->bind(CaptchaVerifierInterface::class, fn () => new class implements CaptchaVerifierInterface {
            public function verify(string $token, ?string $ip = null): bool
            {
                return $token === 'good';
            }
        });
        $offer = $this->offer();
        $this->claim($offer, ['captcha_token' => 'bad'])->assertStatus(422);
        $this->claim($offer)->assertStatus(422);
        $this->claim($offer, ['captcha_token' => 'good'])->assertCreated();
        $this->assertSame(1, LoanLead::query()->count());
    }

    public function test_the_lead_form_is_rate_limited_per_visitor_address(): void
    {
        $offer = $this->offer();
        for ($i = 0; $i < 8; $i++) {
            $this->claim($offer, ['phone' => '98765000'.str_pad((string) $i, 2, '0', STR_PAD_LEFT)])->assertCreated();
        }
        $this->claim($offer, ['phone' => '9876599999'])->assertStatus(429);
    }

    // ═════════ duplicates ═════════

    public function test_the_same_number_again_is_noted_on_the_open_lead_not_duplicated(): void
    {
        $offer = $this->offer();
        $this->claim($offer)->assertCreated();
        $telecaller = $this->role('telecaller');
        Notification::query()->delete();

        $res = $this->claim($offer, ['name' => 'Rohan S', 'phone' => '+91 98765 43210'])->assertCreated();
        $this->assertNull($res->json('data.reference'), 'a repeat never reveals the existing reference');
        $this->assertSame(1, LoanLead::query()->count());
        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame(1, $lead->resubmission_count);
        $this->assertSame(1, $lead->inquiryActivities()->where('type', 'resubmission')->count());
        $this->assertSame(1, OfferEvent::query()->where('type', 'duplicate')->count());
        $this->assertTrue(Notification::query()->where('user_id', $telecaller->id)->where('type', 'inquiry.resubmitted')->exists());
    }

    public function test_a_repeat_through_a_different_offer_is_also_caught(): void
    {
        $this->claim($this->offer())->assertCreated();
        $this->claim($this->offer(['slug' => 'free-demo', 'name' => 'Free Demo']))->assertCreated();
        $this->assertSame(1, LoanLead::query()->count());
    }

    public function test_a_closed_lead_does_not_block_a_new_one(): void
    {
        $offer = $this->offer();
        $this->claim($offer)->assertCreated();
        LoanLead::query()->update(['status' => LeadStatus::Closed->value]);
        $this->claim($offer)->assertCreated();
        $this->assertSame(2, LoanLead::query()->count());
    }

    public function test_the_same_number_after_30_days_is_a_new_lead(): void
    {
        $offer = $this->offer();
        $this->claim($offer)->assertCreated();
        $this->travel(31)->days();
        $this->claim($offer)->assertCreated();
        $this->assertSame(2, LoanLead::query()->count());
    }

    public function test_a_different_number_is_a_different_lead(): void
    {
        $offer = $this->offer();
        $this->claim($offer)->assertCreated();
        $this->claim($offer, ['phone' => '9123456780'])->assertCreated();
        $this->assertSame(2, LoanLead::query()->count());
    }

    // ═════════ guest vs registered ═════════

    public function test_a_signed_in_customer_is_marked_registered_and_linked_to_their_account(): void
    {
        $this->postJson('/api/v1/customer/auth/register', ['name' => 'Rohan Sharma', 'email' => 'cust@example.test', 'phone' => '9876543210', 'password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh', 'terms' => true])->assertCreated();
        $customer = User::query()->where('email', 'cust@example.test')->firstOrFail();
        Sanctum::actingAs($customer);

        $this->claim($this->offer(), ['phone' => '9000000001'])->assertCreated();
        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('registered', $lead->details['offer']['account_status']);
        $this->assertNotNull($lead->customer_id);
    }

    public function test_a_staff_token_never_counts_as_a_registered_customer(): void
    {
        Sanctum::actingAs($this->role('employee'));
        $this->claim($this->offer())->assertCreated();
        $lead = LoanLead::query()->firstOrFail();
        $this->assertSame('guest', $lead->details['offer']['account_status']);
        $this->assertNull($lead->customer_id);
    }

    // ═════════ telecaller dashboard ═════════

    public function test_a_new_lead_reaches_every_telecaller_and_admin_as_a_notification(): void
    {
        $t1 = $this->role('telecaller');
        $t2 = $this->role('telecaller');
        $admin = $this->role('super_admin');
        $other = $this->role('manager');
        $inactive = User::factory()->create(['role' => 'telecaller', 'is_active' => false]);

        $this->claim($this->offer())->assertCreated();
        foreach ([$t1, $t2, $admin] as $u) {
            $n = Notification::query()->where('user_id', $u->id)->where('type', 'inquiry.new')->first();
            $this->assertNotNull($n, 'notification for user '.$u->id);
            $this->assertStringContainsString('Free Consultation', (string) $n->body);
            $this->assertStringContainsString('Nagpur', (string) $n->body);
        }
        $this->assertFalse(Notification::query()->where('user_id', $other->id)->exists());
        $this->assertFalse(Notification::query()->where('user_id', $inactive->id)->exists());
    }

    public function test_the_lead_shows_up_in_the_existing_customer_inquiries_queue(): void
    {
        $offer = $this->offer();
        $this->claim($offer, ['entry' => 'popup', 'interested_service' => 'business-loan', 'message' => 'Evenings please'])->assertCreated();
        Sanctum::actingAs($this->role('telecaller'));

        $row = $this->getJson('/api/v1/inquiries')->assertOk()->json('data.0');
        $this->assertSame('offer_popup', $row['source']);
        $this->assertSame('Guest Visitor Popup', $row['source_label']);
        $this->assertSame('new', $row['inquiry_status']);
        $this->assertSame('Free Consultation', $row['offer']['name']);
        $this->assertSame('guest', $row['offer']['account_status']);
        $this->assertSame('Rohan Sharma', $row['applicant_name']);
        $this->assertSame('9876543210', $row['applicant_phone']);
    }

    public function test_the_lead_detail_gives_the_telecaller_everything_to_call_back(): void
    {
        $this->claim($this->offer(), ['interested_service' => 'home-loan', 'message' => 'Call after 5', 'marketing_consent' => true])->assertCreated();
        Sanctum::actingAs($this->role('telecaller'));
        $id = LoanLead::query()->value('id');

        $d = $this->getJson("/api/v1/inquiries/{$id}")->assertOk()->json('data');
        $this->assertSame('Home Loan', $d['offer']['interested_service']);
        $this->assertSame('Call after 5', $d['offer']['message']);
        $this->assertTrue($d['offer']['marketing_consent']);
        $this->assertSame(self::VISITOR, $d['offer']['visitor_id']);
        $this->assertSame('OFR-', substr($d['reference'], 0, 4));
    }

    public function test_the_queue_can_be_filtered_by_offer_and_source(): void
    {
        $a = $this->offer();
        $b = $this->offer(['slug' => 'free-demo', 'name' => 'Free Demo']);
        $this->claim($a, ['phone' => '9876500001', 'entry' => 'popup'])->assertCreated();
        $this->claim($b, ['phone' => '9876500002'])->assertCreated();
        Sanctum::actingAs($this->role('telecaller'));

        $this->assertCount(1, $this->getJson('/api/v1/inquiries?offer_id='.$a->id)->json('data'));
        $this->assertCount(1, $this->getJson('/api/v1/inquiries?source=offer_landing')->json('data'));
        $this->assertCount(2, $this->getJson('/api/v1/inquiries')->json('data'));

        $meta = $this->getJson('/api/v1/inquiries/meta')->json('data');
        $this->assertContains('offer_popup', collect($meta['sources'])->pluck('value')->all());
        $this->assertContains('offer_landing', collect($meta['sources'])->pluck('value')->all());
        $this->assertContains('Free Demo', collect($meta['offers'])->pluck('name')->all());
    }

    public function test_the_telecaller_can_work_the_lead_through_every_status(): void
    {
        $this->claim($this->offer())->assertCreated();
        $telecaller = $this->role('telecaller');
        Sanctum::actingAs($telecaller);
        $id = LoanLead::query()->value('id');

        $this->postJson("/api/v1/inquiries/{$id}/claim")->assertOk();
        $this->assertSame($telecaller->id, LoanLead::query()->find($id)->assigned_telecaller_id);

        $this->postJson("/api/v1/inquiries/{$id}/activities", ['type' => 'contact', 'body' => 'Spoke to the customer, wants a callback.'])->assertCreated();
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'follow_up'])->assertStatus(422);
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'follow_up', 'next_follow_up_at' => now()->addDay()->toIso8601String(), 'remarks' => 'Call tomorrow'])->assertOk();
        $this->assertNotNull(LoanLead::query()->find($id)->next_follow_up_at);

        foreach (['contacted', 'interested', 'not_interested', 'converted'] as $status) {
            $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => $status])->assertOk();
            $this->assertSame($status, LoanLead::query()->find($id)->inquiry_status);
        }
        $this->assertNull(LoanLead::query()->find($id)->next_follow_up_at, 'a converted lead has no pending follow-up');
        $this->assertSame('Converted', collect($this->getJson('/api/v1/inquiries/meta')->json('data.statuses'))->firstWhere('value', 'converted')['label']);
        $this->assertSame(1, $this->getJson('/api/v1/inquiries/stats')->json('data.by_status.converted'));
    }

    public function test_another_telecaller_cannot_take_over_a_claimed_lead(): void
    {
        $this->claim($this->offer())->assertCreated();
        $id = LoanLead::query()->value('id');
        Sanctum::actingAs($this->role('telecaller'));
        $this->postJson("/api/v1/inquiries/{$id}/claim")->assertOk();
        Sanctum::actingAs($this->role('telecaller'));
        $this->putJson("/api/v1/inquiries/{$id}/status", ['inquiry_status' => 'contacted'])->assertStatus(409);
    }

    public function test_offer_leads_are_hidden_from_roles_outside_the_queue(): void
    {
        $this->claim($this->offer())->assertCreated();
        foreach (['manager', 'employee', 'banker'] as $role) {
            Sanctum::actingAs($this->role($role));
            $this->getJson('/api/v1/inquiries')->assertForbidden();
        }
    }

    // ═════════ admin: offers ═════════

    public function test_offer_management_is_for_the_super_admin_only(): void
    {
        $this->postJson('/api/v1/customer/auth/register', ['name' => 'Cust Omer', 'email' => 'c@example.test', 'phone' => '9876543210', 'password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh', 'terms' => true])->assertCreated();
        $offer = $this->offer();
        $calls = [['getJson', '/api/v1/super-admin/offers'], ['postJson', '/api/v1/super-admin/offers'], ['putJson', "/api/v1/super-admin/offers/{$offer->id}"],
            ['deleteJson', "/api/v1/super-admin/offers/{$offer->id}"], ['getJson', '/api/v1/super-admin/offers/settings'], ['putJson', '/api/v1/super-admin/offers/settings'],
            ['getJson', '/api/v1/super-admin/offers/analytics'], ['getJson', '/api/v1/super-admin/offers/meta']];
        foreach ($calls as [$m, $url]) {
            $this->{$m}($url)->assertUnauthorized();
        }
        foreach (['telecaller', 'manager', 'employee', 'accounts'] as $role) {
            Sanctum::actingAs($this->role($role));
            foreach ($calls as [$m, $url]) {
                $this->{$m}($url)->assertForbidden();
            }
        }
        Sanctum::actingAs(User::query()->where('email', 'c@example.test')->firstOrFail());
        $this->getJson('/api/v1/super-admin/offers')->assertForbidden();
    }

    private function newOffer(array $o = []): array
    {
        return array_merge([
            'name' => 'Free Demo', 'type' => 'free_demo', 'headline' => 'See it in action', 'description' => 'A full walkthrough of how we work with you.',
            'benefits' => ['Live walkthrough', 'Q&A with an expert'], 'cta_text' => 'Book my demo', 'badge_text' => 'This month', 'is_active' => true, 'show_popup' => true,
        ], $o);
    }

    public function test_the_admin_can_create_edit_deactivate_and_remove_an_offer(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        $id = $this->postJson('/api/v1/super-admin/offers', $this->newOffer())->assertCreated()->json('data.id');
        $this->assertSame('free-demo', LeadOffer::query()->find($id)->slug);
        $this->getJson('/api/v1/public/offers/free-demo')->assertOk();

        $this->putJson("/api/v1/super-admin/offers/{$id}", ['headline' => 'New headline', 'cta_text' => 'Go', 'valid_until' => now()->addDays(10)->toDateString()])->assertOk();
        $this->assertSame('New headline', $this->getJson('/api/v1/public/offers/free-demo')->json('data.headline'));

        $this->putJson("/api/v1/super-admin/offers/{$id}", ['is_active' => false])->assertOk();
        $this->getJson('/api/v1/public/offers/free-demo')->assertNotFound();
        $this->assertFalse($this->getJson("/api/v1/super-admin/offers/{$id}")->json('data.is_live'));

        $this->deleteJson("/api/v1/super-admin/offers/{$id}")->assertOk();
        $this->assertSoftDeleted('lead_offers', ['id' => $id]);
        $this->assertSame([], $this->getJson('/api/v1/super-admin/offers')->json('data'));
    }

    public function test_offer_validation(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        foreach (['name', 'type', 'headline', 'description'] as $f) {
            $this->postJson('/api/v1/super-admin/offers', array_diff_key($this->newOffer(), [$f => 1]))->assertStatus(422)->assertJsonValidationErrors($f);
        }
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['type' => 'nonsense']))->assertStatus(422);
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['benefits' => array_fill(0, 7, 'x')]))->assertStatus(422);
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['valid_from' => '2026-12-31', 'valid_until' => '2026-01-01']))->assertStatus(422);
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['description' => 'short']))->assertStatus(422);
        $this->assertSame(0, LeadOffer::query()->count());
    }

    public function test_slugs_are_unique_and_markup_is_stripped_from_offer_text(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer())->assertCreated();
        $this->postJson('/api/v1/super-admin/offers', $this->newOffer(['headline' => '<script>alert(1)</script>Hello there']))->assertCreated();
        $this->assertSame(['free-demo', 'free-demo-2'], LeadOffer::query()->orderBy('id')->pluck('slug')->all());
        $this->assertSame('alert(1)Hello there', LeadOffer::query()->where('slug', 'free-demo-2')->value('headline'));
    }

    public function test_deleting_an_offer_keeps_the_leads_it_generated(): void
    {
        $offer = $this->offer();
        $this->claim($offer)->assertCreated();
        Sanctum::actingAs($this->role('super_admin'));
        $this->deleteJson("/api/v1/super-admin/offers/{$offer->id}")->assertOk();
        $this->assertSame(1, LoanLead::query()->count());

        Sanctum::actingAs($this->role('telecaller'));
        $this->assertSame('Free Consultation', $this->getJson('/api/v1/inquiries')->json('data.0.offer.name'));
    }

    public function test_image_upload_rules(): void
    {
        Storage::fake('local');
        $offer = $this->offer();
        Sanctum::actingAs($this->role('super_admin'));
        $post = fn (UploadedFile $f) => $this->post("/api/v1/super-admin/offers/{$offer->id}/image", ['file' => $f], ['Accept' => 'application/json']);

        $post(UploadedFile::fake()->create('a.png', 100, 'image/png'))->assertOk();
        $first = $offer->fresh()->image_path;
        Storage::disk('local')->assertExists($first);
        $post(UploadedFile::fake()->create('b.jpg', 100, 'image/jpeg'))->assertOk();
        $post(UploadedFile::fake()->create('c.webp', 100, 'image/webp'))->assertOk();
        Storage::disk('local')->assertMissing($first);

        $post(UploadedFile::fake()->create('big.png', 2049, 'image/png'))->assertStatus(422);
        $post(UploadedFile::fake()->create('x.gif', 10, 'image/gif'))->assertStatus(422);
        $post(UploadedFile::fake()->create('x.exe', 10, 'application/x-msdownload'))->assertStatus(422);
        $post(UploadedFile::fake()->create('x.pdf', 10, 'application/pdf'))->assertStatus(422);
        $this->post("/api/v1/super-admin/offers/{$offer->id}/image", [], ['Accept' => 'application/json'])->assertStatus(422);

        $current = $offer->fresh()->image_path;
        $this->deleteJson("/api/v1/super-admin/offers/{$offer->id}/image")->assertOk();
        Storage::disk('local')->assertMissing($current);
        $this->assertNull($offer->fresh()->image_path);
    }

    public function test_the_admin_list_shows_live_status_and_funnel_counts_per_offer(): void
    {
        $offer = $this->offer();
        $this->postJson('/api/v1/public/offers/events', ['type' => 'impression', 'offer_id' => $offer->id, 'visitor_id' => self::VISITOR]);
        $this->postJson('/api/v1/public/offers/events', ['type' => 'click', 'offer_id' => $offer->id, 'visitor_id' => self::VISITOR]);
        $this->claim($offer)->assertCreated();
        Sanctum::actingAs($this->role('super_admin'));

        $row = $this->getJson('/api/v1/super-admin/offers')->json('data.0');
        $this->assertSame(1, $row['impressions']);
        $this->assertSame(1, $row['clicks']);
        $this->assertSame(1, $row['leads']);
        $this->assertTrue($row['is_live']);
    }

    // ═════════ the small "share your details" popup ═════════

    /** @return array<string, mixed> */
    private function callbackForm(array $o = []): array
    {
        return array_merge(['name' => 'Asha Verma', 'phone' => '9123456780', 'city' => 'Nagpur', 'privacy_consent' => true, 'visitor_id' => self::VISITOR, 'elapsed_ms' => 6000], $o);
    }

    public function test_the_callback_popup_needs_no_offer_and_can_be_switched_off(): void
    {
        $s = $this->enablePopup(['callback_enabled' => true]);
        $d = $this->getJson('/api/v1/public/offers/popup')->assertOk()->json('data');
        $this->assertTrue($d['enabled']);
        $this->assertTrue($d['callback_enabled']);
        $this->assertNull($d['offer']);

        $s->update(['callback_enabled' => false]);
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', false);

        $this->offer();
        $s->update(['callback_enabled' => true, 'popup_enabled' => false]);   // the main switch governs offers only
        $d = $this->getJson('/api/v1/public/offers/popup')->json('data');
        $this->assertTrue($d['enabled']);
        $this->assertTrue($d['callback_enabled']);
        $this->assertNull($d['offer']);

        $s->update(['callback_enabled' => false]);
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', false);
    }

    public function test_a_callback_request_becomes_a_lead_for_the_telecallers(): void
    {
        $tele = $this->role('telecaller');
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm())->assertCreated();

        $lead = LoanLead::query()->where('source', 'callback_popup')->sole();
        $this->assertSame(['Asha Verma', '9123456780', 'Nagpur', 'new', null], [$lead->applicant_name, $lead->applicant_phone, $lead->city, $lead->inquiry_status->value ?? $lead->inquiry_status, $lead->offer_id]);
        $this->assertStringStartsWith('CBK-', $lead->reference);
        $this->assertSame(1, Notification::query()->where('user_id', $tele->id)->where('type', 'inquiry.new')->where('title', 'New website details')->count());

        $this->claim($this->offer(), ['phone' => '9000011111'])->assertCreated();   // a list with several leads (offer + call-back) must render without lazy loading
        Sanctum::actingAs($tele);
        $this->assertCount(2, $this->getJson('/api/v1/inquiries')->assertOk()->json('data'));
        $row = collect($this->getJson('/api/v1/inquiries')->json('data'))->firstWhere('source', 'callback_popup');
        $this->assertSame('Website Details Popup', $row['source_label']);
        $this->assertSame('callback', $row['offer']['kind']);
        $d = $this->getJson("/api/v1/inquiries/{$lead->id}")->assertOk()->assertJsonPath('data.offer.kind', 'callback')->json('data');
        $this->assertNotNull($d['consent_at']);
    }

    public function test_the_callback_form_is_validated_and_sanitised(): void
    {
        foreach ([['name' => ''], ['name' => 'R2'], ['phone' => '12345'], ['phone' => '5876543210'], ['city' => ''], ['city' => '12'], ['privacy_consent' => false]] as $bad) {
            $this->withoutMiddleware(IlluminateRoutingMiddlewareThrottleRequests::class)->postJson('/api/v1/public/offers/callback', $this->callbackForm($bad))->assertStatus(422);
        }
        $this->withoutMiddleware(IlluminateRoutingMiddlewareThrottleRequests::class)->postJson('/api/v1/public/offers/callback', $this->callbackForm(['phone' => '+91 91234-56780', 'name' => '<b>Asha</b> Verma']))->assertCreated();
        $lead = LoanLead::query()->where('source', 'callback_popup')->sole();
        $this->assertSame(['9123456780', 'Asha Verma'], [$lead->applicant_phone, $lead->applicant_name]);
    }

    public function test_callback_bots_and_repeats_do_not_create_extra_leads(): void
    {
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm(['website' => 'http://spam']))->assertCreated();
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm(['elapsed_ms' => 100]))->assertCreated();
        $this->assertSame(0, LoanLead::query()->count());

        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm())->assertCreated();
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm(['name' => 'Asha V']))->assertCreated();
        $this->assertSame(1, LoanLead::query()->count());
        $this->assertSame(1, (int) LoanLead::query()->first()->resubmission_count);
    }

    public function test_after_a_callback_request_the_callback_popup_stops_but_offers_continue(): void
    {
        $this->enablePopup(['callback_enabled' => true]);
        $this->offer();
        $this->getJson('/api/v1/public/offers/popup?visitor_id='.self::VISITOR)->assertJsonPath('data.callback_enabled', true);
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm())->assertCreated();

        $d = $this->getJson('/api/v1/public/offers/popup?visitor_id='.self::VISITOR)->json('data');
        $this->assertTrue($d['enabled']);
        $this->assertFalse($d['callback_enabled']);
        $this->assertSame('free-consultation', $d['offer']['slug']);
    }

    public function test_callback_requests_are_counted_in_the_analytics(): void
    {
        $this->postJson('/api/v1/public/offers/callback', $this->callbackForm())->assertCreated();
        Sanctum::actingAs($this->role('super_admin'));
        $this->assertSame(1, $this->getJson('/api/v1/super-admin/offers/analytics')->json('data.totals.callback_requests'));
    }

    // ═════════ admin: popup settings ═════════

    public function test_popup_settings_default_save_and_apply_to_the_public_popup(): void
    {
        $this->offer();
        Sanctum::actingAs($this->role('super_admin'));
        $d = $this->getJson('/api/v1/super-admin/offers/settings')->assertOk()->json('data');
        $this->assertFalse($d['popup_enabled']);
        $this->assertSame([15, 120, 900], [$d['first_delay_seconds'], $d['second_delay_seconds'], $d['repeat_gap_seconds']]);

        $this->putJson('/api/v1/super-admin/offers/settings', ['popup_enabled' => true, 'first_delay_seconds' => 5, 'second_delay_seconds' => 30, 'repeat_gap_seconds' => 600, 'pages' => ['/', '/services/*', '/calculator']])->assertOk();
        $pub = $this->getJson('/api/v1/public/offers/popup')->json('data');
        $this->assertTrue($pub['enabled']);
        $this->assertSame([5, 30, 600], [$pub['first_delay_seconds'], $pub['second_delay_seconds'], $pub['repeat_gap_seconds']]);
        $this->assertSame(['/', '/services/*', '/calculator'], $pub['pages']);

        $this->putJson('/api/v1/super-admin/offers/settings', ['popup_enabled' => false, 'callback_enabled' => false])->assertOk();
        $this->assertFalse($this->getJson('/api/v1/public/offers/popup')->json('data.enabled'));
    }

    public function test_popup_settings_validation(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        foreach ([['first_delay_seconds' => -1], ['first_delay_seconds' => 3601], ['second_delay_seconds' => 4], ['repeat_gap_seconds' => 29], ['repeat_gap_seconds' => 'soon'], ['repeat_gap_seconds' => 86401],
            ['pages' => ['services']], ['pages' => ['<script>']], ['pages' => 'all'], ['pages' => array_fill(0, 41, '/x')], ['popup_enabled' => 'maybe']] as $bad) {
            $this->putJson('/api/v1/super-admin/offers/settings', $bad)->assertStatus(422);
        }
        $this->putJson('/api/v1/super-admin/offers/settings', ['first_delay_seconds' => 0])->assertOk();
        $this->putJson('/api/v1/super-admin/offers/settings', ['repeat_gap_seconds' => 86400, 'second_delay_seconds' => 5, 'pages' => ['*']])->assertOk();
    }

    // ═════════ admin: analytics ═════════

    private function funnel(LeadOffer $offer, int $impressions, int $clicks, int $visits, int $leads, ?string $at = null): void
    {
        $make = fn (string $type, int $n) => collect(range(1, $n))->each(fn () => OfferEvent::query()->create(['offer_id' => $offer->id, 'visitor_id' => self::VISITOR, 'type' => $type, 'created_at' => $at ?? now()]));
        $make('impression', $impressions);
        $make('click', $clicks);
        $make('landing_visit', $visits);
        for ($i = 0; $i < $leads; $i++) {
            $lead = LoanLead::query()->create([
                'reference' => 'OFR-T'.$offer->id.$i.rand(100, 999), 'applicant_name' => 'T', 'applicant_phone' => '90000'.$offer->id.str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'loan_type' => 'personal', 'loan_amount' => 0, 'status' => 'new', 'source' => $i % 2 === 0 ? 'offer_popup' : 'offer_landing',
                'offer_id' => $offer->id, 'inquiry_status' => $i === 0 ? 'converted' : 'new',
            ]);
            $lead->forceFill(['created_at' => $at ?? now()])->save();
        }
    }

    public function test_analytics_totals_and_percentages(): void
    {
        $a = $this->offer();
        $this->funnel($a, 100, 20, 16, 4);
        Sanctum::actingAs($this->role('super_admin'));

        $t = $this->getJson('/api/v1/super-admin/offers/analytics')->assertOk()->json('data.totals');
        $this->assertSame(100, $t['impressions']);
        $this->assertSame(20, $t['clicks']);
        $this->assertSame(16, $t['landing_visits']);
        $this->assertSame(4, $t['leads']);
        $this->assertEquals(20.0, $t['click_through_percent']);
        $this->assertEquals(25.0, $t['conversion_percent']);
        $this->assertEquals(4.0, $t['overall_percent']);
    }

    public function test_analytics_with_no_data_has_no_percentages_and_no_division_by_zero(): void
    {
        Sanctum::actingAs($this->role('super_admin'));
        $t = $this->getJson('/api/v1/super-admin/offers/analytics')->assertOk()->json('data.totals');
        $this->assertSame(0, $t['leads']);
        $this->assertNull($t['conversion_percent']);
        $this->assertNull($t['click_through_percent']);
        $this->assertNull($t['overall_percent']);
    }

    public function test_best_performing_offers_are_ranked_by_leads(): void
    {
        $a = $this->offer();
        $b = $this->offer(['slug' => 'free-demo', 'name' => 'Free Demo']);
        $this->funnel($a, 50, 10, 10, 1);
        $this->funnel($b, 80, 30, 25, 5);
        Sanctum::actingAs($this->role('super_admin'));

        $best = $this->getJson('/api/v1/super-admin/offers/analytics')->json('data.best_offers');
        $this->assertSame(['Free Demo', 'Free Consultation'], collect($best)->pluck('name')->all());
        $this->assertEquals(20.0, $best[0]['conversion_percent']);
        $this->assertEquals(10.0, $best[1]['conversion_percent']);
    }

    public function test_analytics_sources_and_lead_statuses(): void
    {
        $this->funnel($this->offer(), 10, 5, 5, 4);
        Sanctum::actingAs($this->role('super_admin'));
        $d = $this->getJson('/api/v1/super-admin/offers/analytics')->json('data');

        $src = collect($d['sources'])->pluck('count', 'value')->all();
        $this->assertSame(['offer_popup' => 2, 'offer_landing' => 2], $src);
        $st = collect($d['statuses'])->pluck('count', 'value')->all();
        $this->assertSame(1, $st['converted']);
        $this->assertSame(3, $st['new']);
        $this->assertNotEmpty($d['leads_by_day']);
    }

    public function test_analytics_respects_the_date_range_and_the_offer_filter(): void
    {
        $a = $this->offer();
        $b = $this->offer(['slug' => 'free-demo', 'name' => 'Free Demo']);
        $this->funnel($a, 10, 2, 2, 1, now()->subDays(40)->toDateTimeString());
        $this->funnel($a, 20, 4, 4, 2);
        $this->funnel($b, 30, 6, 6, 3);
        Sanctum::actingAs($this->role('super_admin'));

        $this->assertSame(5, $this->getJson('/api/v1/super-admin/offers/analytics')->json('data.totals.leads'), 'default range is the last 30 days');
        $all = $this->getJson('/api/v1/super-admin/offers/analytics?from='.now()->subDays(60)->toDateString().'&to='.now()->toDateString())->json('data.totals');
        $this->assertSame(6, $all['leads']);
        $this->assertSame(60, $all['impressions']);
        $this->assertSame(2, $this->getJson('/api/v1/super-admin/offers/analytics?offer_id='.$a->id)->json('data.totals.leads'));
        $this->getJson('/api/v1/super-admin/offers/analytics?from=2026-05-01&to=2026-04-01')->assertStatus(422);
        $this->getJson('/api/v1/super-admin/offers/analytics?from=garbage')->assertStatus(422);
    }

    public function test_a_real_visitor_journey_shows_up_in_the_analytics(): void
    {
        $offer = $this->offer();
        $this->enablePopup();
        $ev = fn (string $t) => $this->postJson('/api/v1/public/offers/events', ['type' => $t, 'offer_id' => $offer->id, 'visitor_id' => self::VISITOR, 'page' => '/']);
        $this->getJson('/api/v1/public/offers/popup')->assertJsonPath('data.enabled', true);
        $ev('impression');
        $ev('click');
        $ev('landing_visit');
        $this->claim($offer, ['entry' => 'popup'])->assertCreated();
        $this->claim($offer, ['entry' => 'popup'])->assertCreated(); // same number again -> duplicate

        Sanctum::actingAs($this->role('super_admin'));
        $t = $this->getJson('/api/v1/super-admin/offers/analytics')->json('data.totals');
        $this->assertSame([1, 1, 1, 1, 1], [$t['impressions'], $t['clicks'], $t['landing_visits'], $t['leads'], $t['duplicates']]);
        $this->assertEquals(100.0, $t['conversion_percent']);
    }
}
