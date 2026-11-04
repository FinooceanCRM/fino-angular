<?php

namespace App\Services;

/**
 * Preliminary, indicative eligibility estimate for the public website.
 *
 * Pure calculation — no persistence, no side effects — so it is trivially
 * unit-testable. Rules live in config/eligibility.php and are placeholders
 * until the business approves them. The result is never a lending decision.
 */
class EligibilityService
{
    public const BAND_LIKELY = 'likely';
    public const BAND_POSSIBLE = 'possible';
    public const BAND_REVIEW = 'needs_review';

    /**
     * Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1).
     * Zero interest degenerates to P / n.
     */
    public static function emi(float $principal, float $annualRatePercent, int $months): float
    {
        if ($principal <= 0 || $months <= 0) {
            return 0.0;
        }

        $r = $annualRatePercent / 12 / 100;
        if ($r <= 0) {
            return round($principal / $months, 2);
        }

        $factor = (1 + $r) ** $months;

        return round($principal * $r * $factor / ($factor - 1), 2);
    }

    /** Principal that a given EMI can service — inverse of {@see emi()}. */
    public static function principalFor(float $emi, float $annualRatePercent, int $months): float
    {
        if ($emi <= 0 || $months <= 0) {
            return 0.0;
        }

        $r = $annualRatePercent / 12 / 100;
        if ($r <= 0) {
            return round($emi * $months, 2);
        }

        $factor = (1 + $r) ** $months;

        return round($emi * ($factor - 1) / ($r * $factor), 2);
    }

    /**
     * @param array<string, mixed> $input loan_type, loan_amount, monthly_income,
     *        existing_emi?, tenure_months?, employment_type?
     * @return array<string, mixed>
     */
    public function check(array $input): array
    {
        $type = (string) $input['loan_type'];
        $rules = array_merge(
            (array) config('eligibility.defaults'),
            (array) config("eligibility.types.{$type}", []),
        );

        $amount = (float) $input['loan_amount'];
        $income = (float) ($input['monthly_income'] ?? 0);
        $existingEmi = (float) ($input['existing_emi'] ?? 0);
        $tenure = (int) ($input['tenure_months'] ?? config('eligibility.default_tenure_months'));
        $tenure = max(6, min($tenure, (int) $rules['max_tenure_months']));
        $rate = (float) $rules['assumed_rate'];
        $foir = (float) config('eligibility.foir');

        $missing = [];
        if ($income <= 0 && (float) $rules['min_income'] > 0) {
            $missing[] = 'monthly_income';
        }

        $estimatedEmi = self::emi($amount, $rate, $tenure);
        $affordableEmi = max(0.0, $income * $foir - $existingEmi);
        $indicativeMax = self::principalFor($affordableEmi, $rate, $tenure);

        $reasons = [];
        if ($income > 0 && $income < (float) $rules['min_income']) {
            $reasons[] = 'Your stated income is below the usual minimum for this product.';
        }
        if ($income > 0 && $estimatedEmi > $affordableEmi) {
            $reasons[] = 'The estimated EMI is high compared with your income after existing obligations.';
        }

        if ($missing !== []) {
            $band = self::BAND_REVIEW;
        } elseif ($reasons === []) {
            $band = self::BAND_LIKELY;
        } elseif ($estimatedEmi <= $affordableEmi * 1.15) {
            $band = self::BAND_POSSIBLE;
        } else {
            $band = self::BAND_REVIEW;
        }

        return [
            'band' => $band,
            'headline' => match ($band) {
                self::BAND_LIKELY => 'You may be eligible',
                self::BAND_POSSIBLE => 'You may be eligible with adjustments',
                default => 'Our team needs to review your profile',
            },
            'estimated_emi' => $estimatedEmi,
            'indicative_max_amount' => $indicativeMax,
            'tenure_months' => $tenure,
            'reasons' => $reasons,
            'missing' => $missing,
            'assumptions' => [
                sprintf('Indicative annual interest rate of %s%% (not a quoted rate)', rtrim(rtrim(number_format($rate, 2), '0'), '.')),
                sprintf('Up to %d%% of monthly income available for EMIs', (int) round($foir * 100)),
                sprintf('Tenure of %d months', $tenure),
            ],
            'next_step' => 'Create a free account to apply, and a FINOOCEAN advisor will call you to review your options.',
            'disclaimer' => 'This is a preliminary estimate, not an approval or a lender decision. Actual eligibility, rates and charges are decided by the lender.',
        ];
    }
}
