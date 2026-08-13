<?php

namespace Database\Seeders;

use App\Enums\LeadStatus;
use App\Enums\UserRole;
use App\Models\LeadStatusHistory;
use App\Models\LoanLead;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo leads spread across the hierarchy so every dashboard has data.
 */
class LoanLeadSeeder extends Seeder
{
    public function run(): void
    {
        $connector = User::query()->where('role', UserRole::Connector->value)->first();
        $employees = User::query()->where('role', UserRole::Employee->value)->orderBy('id')->get();

        if ($employees->isEmpty()) {
            return;
        }

        $samples = [
            ['Anita Sharma', 'home', 3500000, 'Pune', 'Maharashtra', 95000, 780, LeadStatus::New],
            ['Rahul Verma', 'personal', 600000, 'Indore', 'Madhya Pradesh', 55000, 720, LeadStatus::Assigned],
            ['Kiran Patel', 'business', 2500000, 'Ahmedabad', 'Gujarat', 140000, 690, LeadStatus::InProgress],
            ['Mohit Rao', 'auto', 900000, 'Hyderabad', 'Telangana', 70000, 705, LeadStatus::DocumentsPending],
            ['Sneha Iyer', 'home', 5200000, 'Chennai', 'Tamil Nadu', 180000, 800, LeadStatus::UnderReview],
            ['Deepak Singh', 'personal', 350000, 'Lucknow', 'Uttar Pradesh', 42000, 660, LeadStatus::Approved],
            ['Priya Nair', 'education', 1200000, 'Kochi', 'Kerala', 60000, 710, LeadStatus::Rejected],
            ['Arjun Mehta', 'business', 4500000, 'Jaipur', 'Rajasthan', 210000, 750, LeadStatus::Disbursed],
        ];

        foreach ($samples as $index => [$name, $type, $amount, $city, $state, $income, $score, $status]) {
            $employee = $employees[$index % $employees->count()];

            $lead = LoanLead::query()->updateOrCreate(
                ['applicant_email' => Str::slug($name, '.').'@example.test'],
                [
                    'reference' => 'LD-'.strtoupper(Str::padLeft((string) ($index + 1), 6, '0')),
                    'applicant_name' => $name,
                    'applicant_phone' => '9'.str_pad((string) (100000000 + $index), 9, '0', STR_PAD_LEFT),
                    'loan_type' => $type,
                    'loan_amount' => $amount,
                    'tenure_months' => 60,
                    'monthly_income' => $income,
                    'credit_score' => $score,
                    'employment_type' => 'salaried',
                    'city' => $city,
                    'state' => $state,
                    'pincode' => '400001',
                    'status' => $status->value,
                    'created_by' => $connector?->id ?? $employee->id,
                    'updated_by' => $employee->id,
                    'connector_id' => $connector?->id,
                    'assigned_employee_id' => $employee->id,
                    'assigned_relationship_manager_id' => $employee->relationship_manager_id,
                    'assigned_manager_id' => $employee->manager_id,
                    'notes' => 'Seeded demo lead.',
                ],
            );

            LeadStatusHistory::query()->firstOrCreate([
                'loan_lead_id' => $lead->id,
                'to_status' => $status->value,
            ], [
                'from_status' => null,
                'changed_by' => $employee->id,
                'remarks' => 'Seeded status.',
            ]);
        }
    }
}
