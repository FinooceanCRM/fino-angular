<?php

namespace Tests\Feature\Customer;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_any_authenticated_role_can_create_a_customer(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);

        $response = $this->actingAs($employee, 'sanctum')->postJson('/api/v1/customers', [
            'name' => 'Rohan Kulkarni',
            'email' => 'rohan.kulkarni@example.com',
            'phone' => '+91 90101 20006',
            'segment' => 'SME',
        ]);

        $response->assertCreated();
        $this->assertSame('prospect', $response->json('data.status'));
        $this->assertSame($employee->id, $response->json('data.created_by.id'));

        $this->assertDatabaseHas('customers', [
            'name' => 'Rohan Kulkarni',
            'created_by' => $employee->id,
            'status' => 'prospect',
        ]);

        $customer = Customer::query()->latest('id')->first();
        $this->assertDatabaseHas('customer_interactions', [
            'customer_id' => $customer->id,
            'icon' => 'person_add',
            'title' => 'Customer created',
        ]);
    }

    public function test_a_user_sees_their_own_customer_but_not_an_unrelated_users_customer(): void
    {
        $employeeA = User::factory()->create(['role' => UserRole::Employee->value]);
        $employeeB = User::factory()->create(['role' => UserRole::Employee->value]);

        $ownCustomer = Customer::factory()->create(['created_by' => $employeeA->id]);
        Customer::factory()->create(['created_by' => $employeeB->id]);

        $list = $this->actingAs($employeeA, 'sanctum')->getJson('/api/v1/customers');
        $list->assertOk();
        $this->assertCount(1, $list->json('data'));
        $this->assertSame($ownCustomer->id, $list->json('data.0.id'));

        // The show endpoint 404s (not visible) for employeeB's own customer
        // when requested by employeeA, and employeeA's own customer is not
        // reachable by employeeB either.
        $other = Customer::query()->where('created_by', $employeeB->id)->firstOrFail();
        $this->actingAs($employeeA, 'sanctum')
            ->getJson("/api/v1/customers/{$other->id}")
            ->assertNotFound();

        $this->actingAs($employeeB, 'sanctum')
            ->getJson("/api/v1/customers/{$ownCustomer->id}")
            ->assertNotFound();
    }

    public function test_a_manager_sees_a_customer_linked_to_a_lead_visible_to_them(): void
    {
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
        $otherEmployee = User::factory()->create(['role' => UserRole::Employee->value]);

        $lead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);

        $customer = Customer::factory()->create(['created_by' => $otherEmployee->id]);
        $customer->leads()->attach($lead->id);

        // Manager can see it — it's linked to a lead visible through their RM.
        $this->actingAs($manager, 'sanctum')
            ->getJson("/api/v1/customers/{$customer->id}")
            ->assertOk();

        // An unrelated employee (no hierarchy relation to the lead or the customer) cannot.
        $unrelated = User::factory()->create(['role' => UserRole::Employee->value]);
        $this->actingAs($unrelated, 'sanctum')
            ->getJson("/api/v1/customers/{$customer->id}")
            ->assertNotFound();
    }

    public function test_only_hierarchy_roles_may_delete_a_customer(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $manager = User::factory()->create(['role' => UserRole::Manager->value]);
        $customer = Customer::factory()->create(['created_by' => $employee->id]);

        // Employee owns the customer but isn't a hierarchy role — delete is forbidden.
        $this->actingAs($employee, 'sanctum')
            ->deleteJson("/api/v1/customers/{$customer->id}")
            ->assertForbidden();

        // A manager can't even reach it via findVisible unless it's visible to them,
        // so link it to a lead the manager can see first.
        $rm = User::factory()->create([
            'role' => UserRole::RelationshipManager->value,
            'manager_id' => $manager->id,
        ]);
        $lead = LoanLead::factory()->create(['assigned_relationship_manager_id' => $rm->id]);
        $customer->leads()->attach($lead->id);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/customers/{$customer->id}")
            ->assertOk();

        $this->assertSoftDeleted('customers', ['id' => $customer->id]);
    }

    public function test_adding_a_note_also_logs_an_interaction(): void
    {
        $employee = User::factory()->create(['role' => UserRole::Employee->value]);
        $customer = Customer::factory()->create(['created_by' => $employee->id]);

        $response = $this->actingAs($employee, 'sanctum')
            ->postJson("/api/v1/customers/{$customer->id}/notes", ['body' => 'Prefers WhatsApp updates.']);

        $response->assertCreated();
        $this->assertSame($employee->name, $response->json('data.author'));

        $this->assertDatabaseHas('customer_notes', [
            'customer_id' => $customer->id,
            'body' => 'Prefers WhatsApp updates.',
        ]);
        $this->assertDatabaseHas('customer_interactions', [
            'customer_id' => $customer->id,
            'icon' => 'edit_note',
            'title' => 'Note added',
        ]);
    }
}
