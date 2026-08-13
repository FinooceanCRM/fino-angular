<?php

namespace App\Services;

use App\Models\BankCriteria;
use App\Models\LeadMatch;
use App\Models\LoanLead;
use App\Repositories\Contracts\BankCriteriaRepositoryInterface;

/**
 * Automatic lead-matching engine (Phase 9).
 *
 * A lead is matched against every active bank criteria row for the same loan
 * type. Amount range, income, credit score and the configurable
 * `eligibility_rules` payload decide the match; a score (0-100) ranks results.
 */
class LeadMatchingService extends BaseService
{
    public function __construct(private readonly BankCriteriaRepositoryInterface $criteria)
    {
    }

    /**
     * Evaluate the lead and persist matching banks.
     *
     * @return array<string, mixed>
     */
    public function matchAndStore(LoanLead $lead): array
    {
        $results = $this->evaluate($lead);

        $this->transaction(function () use ($lead, $results): void {
            foreach ($results as $result) {
                if (! $result['eligible']) {
                    continue;
                }

                LeadMatch::query()->updateOrCreate(
                    ['loan_lead_id' => $lead->id, 'bank_criteria_id' => $result['bank_criteria_id']],
                    [
                        'match_score' => $result['score'],
                        'status' => 'matched',
                        'reasons' => $result['reasons'],
                    ],
                );
            }
        });

        $eligible = array_values(array_filter($results, static fn (array $r): bool => $r['eligible']));

        return [
            'lead_id' => $lead->id,
            'evaluated' => count($results),
            'matched' => count($eligible),
            'matches' => $eligible,
            'rejected' => array_values(array_filter($results, static fn (array $r): bool => ! $r['eligible'])),
        ];
    }

    /**
     * Pure evaluation — no writes. Returns every candidate with reasons.
     *
     * @return array<int, array<string, mixed>>
     */
    public function evaluate(LoanLead $lead): array
    {
        $loanType = $lead->loan_type instanceof \BackedEnum ? $lead->loan_type->value : (string) $lead->loan_type;
        $banks = $this->criteria->activeForLoanType($loanType);

        return $banks->map(fn (BankCriteria $bank): array => $this->score($lead, $bank))->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function score(LoanLead $lead, BankCriteria $bank): array
    {
        $reasons = [];
        $failures = [];
        $score = 0;

        $amount = (float) $lead->loan_amount;
        $income = (float) ($lead->monthly_income ?? 0);
        $creditScore = (int) ($lead->credit_score ?? 0);

        // Loan amount range.
        $max = $bank->max_loan_amount !== null ? (float) $bank->max_loan_amount : null;
        if ($amount >= (float) $bank->min_loan_amount && ($max === null || $amount <= $max)) {
            $score += 40;
            $reasons[] = 'Loan amount within the bank range.';
        } else {
            $failures[] = 'Loan amount outside the bank range.';
        }

        // Monthly income.
        if ($income >= (float) $bank->min_monthly_income) {
            $score += 25;
            $reasons[] = 'Monthly income meets the minimum requirement.';
        } else {
            $failures[] = 'Monthly income below the minimum requirement.';
        }

        // Credit score.
        if ($bank->min_credit_score === null || $creditScore >= (int) $bank->min_credit_score) {
            $score += 25;
            $reasons[] = 'Credit score meets the minimum requirement.';
        } else {
            $failures[] = 'Credit score below the minimum requirement.';
        }

        // Employment type.
        if ($bank->employment_type === null || $bank->employment_type === $lead->employment_type) {
            $score += 10;
            $reasons[] = 'Employment type accepted.';
        } else {
            $failures[] = 'Employment type not accepted by this product.';
        }

        // Configurable eligibility rules.
        foreach ($this->rulesFor($bank) as $rule) {
            [$ok, $message] = $this->applyRule($lead, $rule);
            if ($ok) {
                $reasons[] = $message;
            } else {
                $failures[] = $message;
            }
        }

        $eligible = $failures === [];

        return [
            'bank_criteria_id' => $bank->id,
            'bank_name' => $bank->bank_name,
            'product_name' => $bank->product_name,
            'loan_type' => $bank->loan_type,
            'interest_rate' => $bank->interest_rate !== null ? (float) $bank->interest_rate : null,
            'min_loan_amount' => (float) $bank->min_loan_amount,
            'max_loan_amount' => $max,
            'eligible' => $eligible,
            'score' => $eligible ? min(100, $score) : 0,
            'reasons' => $eligible ? $reasons : $failures,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rulesFor(BankCriteria $bank): array
    {
        $rules = $bank->eligibility_rules;

        return is_array($rules) ? array_values(array_filter($rules, 'is_array')) : [];
    }

    /**
     * A rule is `{ field, operator, value, label? }`.
     *
     * @param array<string, mixed> $rule
     * @return array{0: bool, 1: string}
     */
    private function applyRule(LoanLead $lead, array $rule): array
    {
        $field = (string) ($rule['field'] ?? '');
        $operator = (string) ($rule['operator'] ?? '=');
        $expected = $rule['value'] ?? null;
        $label = (string) ($rule['label'] ?? ($field.' '.$operator.' '.(is_array($expected) ? implode('/', $expected) : (string) $expected)));

        $allowed = [
            'loan_amount', 'monthly_income', 'credit_score', 'tenure_months',
            'employment_type', 'city', 'state', 'pincode', 'loan_type',
        ];

        if (! in_array($field, $allowed, true)) {
            return [true, 'Rule skipped (unknown field): '.$label];
        }

        $actual = $lead->{$field};
        if ($actual instanceof \BackedEnum) {
            $actual = $actual->value;
        }

        $passes = match ($operator) {
            '>=' => (float) $actual >= (float) $expected,
            '<=' => (float) $actual <= (float) $expected,
            '>' => (float) $actual > (float) $expected,
            '<' => (float) $actual < (float) $expected,
            '!=' => (string) $actual !== (string) $expected,
            'in' => is_array($expected) && in_array((string) $actual, array_map('strval', $expected), true),
            'not_in' => is_array($expected) && ! in_array((string) $actual, array_map('strval', $expected), true),
            default => (string) $actual === (string) $expected,
        };

        return [$passes, ($passes ? 'Rule met: ' : 'Rule failed: ').$label];
    }
}
