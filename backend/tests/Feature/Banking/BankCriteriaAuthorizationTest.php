<?php

namespace Tests\Feature\Banking;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BankCriteriaAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_banker_can_create_criteria_owned_by_themselves(): void
    {
        $banker = User::factory()->role(UserRole::Banker)->create();
        Sanctum::actingAs($banker);

        $this->postJson('/api/v1/banks', [
            'bank_name' => 'Fino Bank',
            'product_name' => 'Home Loan',
            'loan_type' => 'home',
            'min_loan_amount' => 100000,
            'min_monthly_income' => 25000,
        ])
            ->assertCreated()
            ->assertJsonPath('data.banker_id', $banker->id);
    }

    public function test_banker_can_update_and_delete_only_their_own_criteria(): void
    {
        $banker = User::factory()->role(UserRole::Banker)->create();
        $otherBanker = User::factory()->role(UserRole::Banker)->create();
        $own = BankCriteria::factory()->create(['banker_id' => $banker->id]);
        $foreign = BankCriteria::factory()->create(['banker_id' => $otherBanker->id]);
        Sanctum::actingAs($banker);

        $this->putJson("/api/v1/banks/{$own->id}", ['bank_name' => 'Updated Bank'])
            ->assertOk();
        $this->putJson("/api/v1/banks/{$foreign->id}", ['bank_name' => 'Not Allowed'])
            ->assertForbidden();
        $this->deleteJson("/api/v1/banks/{$own->id}")->assertOk();
        $this->deleteJson("/api/v1/banks/{$foreign->id}")->assertForbidden();
    }
}
