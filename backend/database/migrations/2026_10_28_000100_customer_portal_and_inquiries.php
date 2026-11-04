<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Customer portal + website inquiry queue.
 *
 *  - widens the real MySQL ENUM on `users.role` with `customer`
 *    (same technique as 2026_09_08_000000_add_vendor_role_to_users_table)
 *  - links a self-registered portal account to its `customers` row
 *  - tags every lead with where it came from (`source`) and, for website /
 *    portal inquiries, the telecaller processing state, follow-up markers,
 *    idempotency key and customer link
 *  - inquiry activity timeline (notes, contacts, status, assignments)
 *  - loan-department -> manager routing rules
 *
 * Purely additive; existing rows default to source = 'internal'.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $values = implode(',', array_map(
                static fn (string $value): string => "'{$value}'",
                UserRole::values(),
            ));
            DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
        }

        Schema::table('customers', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
        });

        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->string('source', 32)->default('internal')->index();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('inquiry_status', 32)->nullable()->index();
            $table->string('inquiry_key', 64)->nullable()->unique();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamp('next_follow_up_at')->nullable()->index();
            $table->unsignedInteger('resubmission_count')->default(0);
            $table->index(['source', 'created_at']);
        });

        Schema::create('inquiry_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_lead_id')->constrained('loan_leads')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 24);
            $table->text('body')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['loan_lead_id', 'created_at']);
        });

        Schema::create('inquiry_routing_rules', function (Blueprint $table): void {
            $table->id();
            $table->string('department', 32);
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['department', 'manager_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inquiry_routing_rules');
        Schema::dropIfExists('inquiry_activities');

        Schema::table('loan_leads', function (Blueprint $table): void {
            $table->dropIndex(['source', 'created_at']);
            $table->dropIndex(['source']);
            $table->dropIndex(['inquiry_status']);
            $table->dropUnique(['inquiry_key']);
            $table->dropIndex(['next_follow_up_at']);
            $table->dropConstrainedForeignId('customer_id');
            $table->dropColumn([
                'source', 'inquiry_status', 'inquiry_key',
                'last_contacted_at', 'next_follow_up_at', 'resubmission_count',
            ]);
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_id');
        });

        if (DB::getDriverName() === 'mysql') {
            $values = implode(',', array_map(
                static fn (string $value): string => "'{$value}'",
                array_values(array_filter(UserRole::values(), static fn (string $v): bool => $v !== UserRole::Customer->value)),
            ));
            DB::statement("ALTER TABLE users MODIFY role ENUM({$values}) NOT NULL");
        }
    }
};
