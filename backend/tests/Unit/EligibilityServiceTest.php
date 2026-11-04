<?php

namespace Tests\Unit;

use App\Services\EligibilityService;
use Tests\TestCase;

class EligibilityServiceTest extends TestCase
{
    public function test_emi_matches_the_standard_formula(): void
    {
        // 10,00,000 @ 10% for 5 years ≈ 21,247 (the textbook reference value).
        $this->assertEqualsWithDelta(21247.0, EligibilityService::emi(1000000, 10, 60), 1.0);
    }

    public function test_zero_interest_and_invalid_inputs(): void
    {
        $this->assertSame(1000.0, EligibilityService::emi(12000, 0, 12));
        $this->assertSame(0.0, EligibilityService::emi(0, 10, 12));
        $this->assertSame(0.0, EligibilityService::emi(1000, 10, 0));
        $this->assertSame(0.0, EligibilityService::emi(-5, 10, 12));
    }

    public function test_principal_for_is_the_inverse_of_emi(): void
    {
        $emi = EligibilityService::emi(750000, 11, 48);
        $this->assertEqualsWithDelta(750000.0, EligibilityService::principalFor($emi, 11, 48), 5.0);
    }

    public function test_missing_income_needs_review_and_result_is_always_labelled_indicative(): void
    {
        $r = (new EligibilityService())->check(['loan_type' => 'personal', 'loan_amount' => 200000]);

        $this->assertSame(EligibilityService::BAND_REVIEW, $r['band']);
        $this->assertContains('monthly_income', $r['missing']);
        $this->assertStringContainsString('not an approval', $r['disclaimer']);
    }

    public function test_existing_obligations_reduce_the_indicative_amount(): void
    {
        $svc = new EligibilityService();
        $clean = $svc->check(['loan_type' => 'personal', 'loan_amount' => 100000, 'monthly_income' => 50000, 'existing_emi' => 0]);
        $loaded = $svc->check(['loan_type' => 'personal', 'loan_amount' => 100000, 'monthly_income' => 50000, 'existing_emi' => 20000]);

        $this->assertGreaterThan($loaded['indicative_max_amount'], $clean['indicative_max_amount']);
    }
}
