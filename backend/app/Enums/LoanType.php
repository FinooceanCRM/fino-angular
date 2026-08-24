<?php

namespace App\Enums;

enum LoanType: string
{
    case Home = 'home';
    case Personal = 'personal';
    case Business = 'business';
    case Auto = 'auto';
    case Education = 'education';
    case LoanAgainstProperty = 'loan_against_property';

    // Added to mirror the full 20-option Loan Type dropdown from the legacy
    // WordPress lead form (Fluent Form #26); see docs/pd-workflow.md's
    // sibling note in lead-form.component.ts for the department mapping.
    case InstantLoan = 'instant_loan';
    case MicroLoan = 'micro_loan';
    case GoldLoan = 'gold_loan';
    case MudraLoan = 'mudra_loan';
    case Overdraft = 'overdraft';
    case CashCredit = 'cash_credit';
    case DroplineOd = 'dropline_od';
    case ProjectLoan = 'project_loan';
    case CommercialProperty = 'commercial_property';
    case LoanBalanceTransfer = 'loan_bt';
    case Insurance = 'insurance';
    case LoanAgainstFd = 'loan_against_fd';
    case LoanAgainstMutualFund = 'loan_against_mutual_fund';
    case LoanAgainstPension = 'loan_against_pension';

    public function label(): string
    {
        return match ($this) {
            self::Home => 'Home Loan',
            self::Personal => 'Personal Loan',
            self::Business => 'Business Loan',
            // Relabelled from "Auto Loan" to match the source form's exact
            // wording; the stored value stays 'auto', so no data migration.
            self::Auto => 'Car Loan',
            self::Education => 'Education Loan',
            self::LoanAgainstProperty => 'Mortgage Loan / LAP',
            self::InstantLoan => 'Instant Loan',
            self::MicroLoan => 'Micro Loan',
            self::GoldLoan => 'Gold Loan',
            self::MudraLoan => 'Mudra Loan',
            self::Overdraft => 'Overdraft (OD)',
            self::CashCredit => 'Cash Credit (CC)',
            self::DroplineOd => 'Dropline OD',
            self::ProjectLoan => 'Project Loan',
            self::CommercialProperty => 'Commercial Property',
            self::LoanBalanceTransfer => 'Loan Balance Transfer',
            self::Insurance => 'Insurance',
            self::LoanAgainstFd => 'Loan Against FD',
            self::LoanAgainstMutualFund => 'Loan Against Mutual Fund',
            self::LoanAgainstPension => 'Loan Against Pension',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $t): string => $t->value, self::cases());
    }

    /**
     * @return array<int, array<string, string>>
     */
    public static function catalogue(): array
    {
        return array_map(static fn (self $t): array => [
            'value' => $t->value,
            'label' => $t->label(),
        ], self::cases());
    }
}
