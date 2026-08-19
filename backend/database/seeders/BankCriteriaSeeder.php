<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\BankCriteria;
use App\Models\User;
use Illuminate\Database\Seeder;

class BankCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $banker1 = User::query()->where('email', 'banker1@finoocean.test')->first();
        $banker2 = User::query()->where('email', 'banker2@finoocean.test')->first();

        $rows = [
            ['HDFC Bank', 'Home Loan Prime', 'home', 500000, 20000000, 40000, 720, 8.6, $banker1?->id],
            ['ICICI Bank', 'Personal Loan Express', 'personal', 100000, 2500000, 30000, 700, 11.5, $banker2?->id],
            ['Axis Bank', 'Business Growth Loan', 'business', 300000, 10000000, 60000, 680, 13.2, null],
            ['SBI', 'Auto Loan Classic', 'auto', 150000, 3000000, 25000, 650, 9.4, null],
        ];

        foreach ($rows as [$bank, $product, $type, $min, $max, $income, $score, $rate, $bankerId]) {
            BankCriteria::query()->updateOrCreate(
                ['bank_name' => $bank, 'product_name' => $product],
                [
                    'loan_type' => $type,
                    'min_loan_amount' => $min,
                    'max_loan_amount' => $max,
                    'min_monthly_income' => $income,
                    'min_credit_score' => $score,
                    'min_age' => 21,
                    'max_age' => 60,
                    'employment_type' => 'salaried',
                    'interest_rate' => $rate,
                    'is_active' => true,
                    'banker_id' => $bankerId,
                ],
            );
        }
    }
}
