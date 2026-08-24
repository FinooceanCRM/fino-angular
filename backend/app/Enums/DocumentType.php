<?php

namespace App\Enums;

enum DocumentType: string
{
    case Aadhaar = 'aadhaar';
    case AadhaarFront = 'aadhaar_front';
    case AadhaarBack = 'aadhaar_back';
    case Pan = 'pan';
    case PanCard = 'pan_card';
    case BankStatement = 'bank_statement';
    case IncomeProof = 'income_proof';
    case Other = 'other';

    // Loan-type-conditional documents from the legacy WordPress lead form
    // (Fluent Form #26) — see lead-form.component.ts's document-slot
    // visibility rules for which loan type/employment type shows each one.
    case Form16TwoYears = 'form_16_two_years';
    case ThreeYearItr = 'three_year_itr';
    case SixMonthBankStatement = 'six_month_bank_statement';
    case JoiningLetter = 'joining_letter';
    case Gumasta = 'gumasta';
    case ElectricityBill = 'electricity_bill';
    case Udyam = 'udyam';
    case SalarySlip3Months = 'salary_slip_3_months';
    case CompanyRegistration = 'company_registration';
    case GstCertificate = 'gst_certificate';

    public function label(): string
    {
        return match ($this) {
            self::Aadhaar => 'Aadhaar',
            self::AadhaarFront => 'Aadhaar Front',
            self::AadhaarBack => 'Aadhaar Back',
            self::Pan => 'PAN',
            self::PanCard => 'PAN Card',
            self::BankStatement => 'Bank Statement',
            self::IncomeProof => 'Income Proof',
            self::Other => 'Other Document',
            self::Form16TwoYears => 'Form 16 (2 yrs)',
            self::ThreeYearItr => '3 Yr ITR',
            self::SixMonthBankStatement => '6 Month Bank Statement',
            self::JoiningLetter => 'Joining Letter',
            self::Gumasta => 'Gumasta',
            self::ElectricityBill => 'Electricity Bill',
            self::Udyam => 'Udyam',
            self::SalarySlip3Months => '3 Months Salary Slip',
            self::CompanyRegistration => 'Company Registration',
            self::GstCertificate => 'GST Certificate',
        };
    }

    /** The three document types every lead-creation flow must collect (Attach Documents step). */
    public static function leadCreationRequiredTypes(): array
    {
        return [self::AadhaarFront, self::AadhaarBack, self::PanCard];
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
