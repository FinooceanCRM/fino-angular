<?php

namespace App\Enums;

/**
 * Loan-product departments (workflow alignment, Phase 2).
 *
 * Department lives at the Relationship Manager level, not the Manager: one
 * Manager runs Personal Loan, Home Loan and Mortgage Loan simultaneously,
 * split across separate RMs (one RM per department), and each Employee
 * belongs to exactly one department, inherited from their own RM. A
 * Telecaller also belongs to exactly one department, chosen explicitly.
 * Manager, Super Admin, Connector and Banker have none of their own —
 * Manager because they span every department, the rest because they stay
 * outside departments the same way they stay outside the reporting
 * hierarchy.
 */
enum Department: string
{
    case PersonalLoan = 'personal_loan';
    case HomeLoan = 'home_loan';
    case MortgageLoan = 'mortgage_loan';

    public function label(): string
    {
        return match ($this) {
            self::PersonalLoan => 'Personal Loan (PL)',
            self::HomeLoan => 'Home Loan (HL)',
            self::MortgageLoan => 'Mortgage Loan (ML)',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $d): string => $d->value, self::cases());
    }

    /**
     * @return array<int, array<string, string>>
     */
    public static function catalogue(): array
    {
        return array_map(static fn (self $d): array => [
            'value' => $d->value,
            'label' => $d->label(),
        ], self::cases());
    }

    /**
     * Every lead's department is derived from its loan_type, not chosen
     * independently, so the two taxonomies can never drift apart.
     */
    public static function fromLoanType(LoanType $type): self
    {
        return match ($type) {
            LoanType::Home => self::HomeLoan,
            LoanType::LoanAgainstProperty => self::MortgageLoan,
            LoanType::Personal, LoanType::Business, LoanType::Auto, LoanType::Education => self::PersonalLoan,
        };
    }
}
