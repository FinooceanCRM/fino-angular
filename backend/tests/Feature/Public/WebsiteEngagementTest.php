<?php

namespace Tests\Feature\Public;

use App\Enums\UserRole;
use App\Models\ContactMessage;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\TestCase;

class WebsiteEngagementTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function message(array $o = []): array
    {
        return array_merge([
            'name' => 'Asha Patil',
            'email' => 'asha@example.test',
            'phone' => '9876543210',
            'inquiry_type' => 'Home Loan',
            'message' => 'I would like to know more about home loans.',
            'consent' => true,
        ], $o);
    }

    public function test_contact_message_is_stored_and_alerts_telecallers_and_super_admins_only(): void
    {
        $admin = User::factory()->role(UserRole::SuperAdmin)->create();
        $tele = User::factory()->role(UserRole::Telecaller)->create();
        $manager = User::factory()->role(UserRole::Manager)->create();

        $this->postJson('/api/v1/public/contact', $this->message())->assertCreated();

        $this->assertSame(1, ContactMessage::query()->count());
        $this->assertSame('Home Loan', ContactMessage::query()->value('inquiry_type'));
        $this->assertDatabaseHas('notifications', ['user_id' => $admin->id, 'type' => 'contact.message']);
        $this->assertDatabaseHas('notifications', ['user_id' => $tele->id, 'type' => 'contact.message']);
        $this->assertDatabaseMissing('notifications', ['user_id' => $manager->id, 'type' => 'contact.message']);
    }

    public function test_contact_validation_and_honeypot(): void
    {
        // Many requests in one test: the per-minute throttle is covered separately by its own limiter.
        $this->withoutMiddleware(ThrottleRequests::class);

        $this->postJson('/api/v1/public/contact', $this->message(['email' => 'nope']))->assertStatus(422);
        $this->postJson('/api/v1/public/contact', $this->message(['phone' => 'abc']))->assertStatus(422);
        $this->postJson('/api/v1/public/contact', $this->message(['inquiry_type' => 'Made Up']))->assertStatus(422);
        $this->postJson('/api/v1/public/contact', $this->message(['consent' => false]))->assertStatus(422);
        $this->postJson('/api/v1/public/contact', $this->message(['message' => '']))->assertStatus(422);

        // A bot filling the honeypot sees success, but nothing is stored.
        $this->postJson('/api/v1/public/contact', $this->message(['website' => 'http://spam']))->assertCreated();
        $this->assertSame(0, ContactMessage::query()->count());
    }

    public function test_newsletter_signup_is_idempotent_and_validated(): void
    {
        $this->postJson('/api/v1/public/newsletter', ['email' => 'Reader@Example.test'])->assertCreated();
        $this->postJson('/api/v1/public/newsletter', ['email' => 'reader@example.test'])->assertCreated();
        $this->assertSame(1, NewsletterSubscriber::query()->count());
        $this->assertSame('reader@example.test', NewsletterSubscriber::query()->value('email'));

        $this->postJson('/api/v1/public/newsletter', ['email' => 'bad'])->assertStatus(422);
        $this->postJson('/api/v1/public/newsletter', ['email' => 'bot@example.test', 'website' => 'x'])->assertCreated();
        $this->assertSame(1, NewsletterSubscriber::query()->count());
    }
}
