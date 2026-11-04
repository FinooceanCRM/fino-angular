<?php

/*
|--------------------------------------------------------------------------
| Public loan product catalogue
|--------------------------------------------------------------------------
|
| Content for the public website. Deliberately free of interest rates, bank
| names, approval promises and amount limits: those depend on the lender and
| the applicant and must never be invented here. Wording is a business-owned
| placeholder — edit this file (or move it to the settings table later) to
| change what the website shows; no code change is needed.
|
| `loan_type` maps the product onto the closest existing App\Enums\LoanType so
| inquiries route through the existing department rules. The product slug is
| stored on the lead (`details.product`) so nothing is lost for products that
| share a loan type.
*/

$commonDocs = ['Identity proof (Aadhaar / PAN)', 'Address proof', 'Recent bank statements', 'Income proof'];

return [
    'products' => [
        [
            'slug' => 'personal-loan',
            'name' => 'Personal Loan',
            'loan_type' => 'personal',
            'icon' => 'person',
            'tagline' => 'Fuel your personal needs',
            'summary' => 'Flexible unsecured funding for planned or unplanned personal expenses, arranged through our partner lenders.',
            'highlights' => ['Unsecured — no collateral for most profiles', 'Guided documentation', 'Offers compared across lenders'],
            'documents' => $commonDocs,
            'eligibility_notes' => ['Stable salary or business income', 'Healthy repayment history', 'Existing obligations are considered'],
        ],
        [
            'slug' => 'business-loan',
            'name' => 'Business Loan',
            'loan_type' => 'business',
            'icon' => 'business_center',
            'tagline' => 'Fuel your business growth',
            'summary' => 'Working-capital and expansion funding for proprietors, partnerships and companies.',
            'highlights' => ['Working capital and expansion needs', 'Options for varied business profiles', 'Documentation support'],
            'documents' => array_merge($commonDocs, ['Business registration proof', 'GST / ITR records']),
            'eligibility_notes' => ['Operating business history', 'Consistent turnover', 'Repayment capacity from business cash flow'],
        ],
        [
            'slug' => 'home-loan',
            'name' => 'Home Loan',
            'loan_type' => 'home',
            'icon' => 'home',
            'tagline' => 'Turn your dream home into reality',
            'summary' => 'Funding to buy, build or extend a home, with guidance from application to disbursal.',
            'highlights' => ['Purchase, construction and extension', 'Long repayment tenures', 'Property document guidance'],
            'documents' => array_merge($commonDocs, ['Property documents']),
            'eligibility_notes' => ['Stable income', 'Property legally verifiable', 'Existing obligations are considered'],
        ],
        [
            'slug' => 'loan-against-property',
            'name' => 'Loan Against Property',
            'loan_type' => 'loan_against_property',
            'icon' => 'apartment',
            'tagline' => 'Unlock the value of your assets',
            'summary' => 'Raise funds against residential or commercial property you own.',
            'highlights' => ['Secured by your property', 'Personal or business use', 'Property document guidance'],
            'documents' => array_merge($commonDocs, ['Property ownership documents']),
            'eligibility_notes' => ['Clear-title property', 'Repayment capacity', 'Property valuation by the lender'],
        ],
        [
            'slug' => 'car-loan',
            'name' => 'Car Loan',
            'loan_type' => 'auto',
            'icon' => 'directions_car',
            'tagline' => 'Drive your dreams today',
            'summary' => 'Finance for new or used cars through partner lenders.',
            'highlights' => ['New and used vehicles', 'Guided documentation', 'Offers compared across lenders'],
            'documents' => $commonDocs,
            'eligibility_notes' => ['Stable income', 'Vehicle details and quotation', 'Existing obligations are considered'],
        ],
        [
            'slug' => 'education-loan',
            'name' => 'Education Loan',
            'loan_type' => 'education',
            'icon' => 'school',
            'tagline' => 'Invest in a brighter tomorrow',
            'summary' => 'Funding for higher education in India or abroad.',
            'highlights' => ['Domestic and overseas study', 'Co-applicant guidance', 'Documentation support'],
            'documents' => array_merge($commonDocs, ['Admission letter', 'Co-applicant income proof']),
            'eligibility_notes' => ['Admission to a recognised institution', 'Co-applicant with income', 'Academic record'],
        ],
        [
            'slug' => 'stand-up-india',
            'name' => 'Stand-Up India Loan',
            'loan_type' => 'business',
            'icon' => 'trending_up',
            'tagline' => 'Support for first-time entrepreneurs',
            'summary' => 'Scheme-based funding for eligible first-time entrepreneurs. Scheme terms are set by the government and lenders.',
            'highlights' => ['Scheme-backed funding', 'Documentation support', 'Eligibility confirmed by the lender'],
            'documents' => array_merge($commonDocs, ['Project / business plan']),
            'eligibility_notes' => ['Scheme eligibility criteria apply', 'Confirmed by the lender'],
        ],
        [
            'slug' => 'project-funding',
            'name' => 'Project Funding',
            'loan_type' => 'project_loan',
            'icon' => 'engineering',
            'tagline' => 'Finance your vision',
            'summary' => 'Structured funding for new projects and capacity expansion.',
            'highlights' => ['Project-specific structuring', 'Detailed appraisal support', 'Lender coordination'],
            'documents' => array_merge($commonDocs, ['Project report', 'Financial projections']),
            'eligibility_notes' => ['Viable project plan', 'Promoter track record', 'Lender appraisal'],
        ],
        [
            'slug' => 'cgtmse-loan',
            'name' => 'CGTMSE Loan',
            'loan_type' => 'business',
            'icon' => 'verified_user',
            'tagline' => 'Collateral-free credit for small businesses',
            'summary' => 'Credit for eligible micro and small enterprises under the credit-guarantee scheme. Scheme terms are set by the lender.',
            'highlights' => ['Scheme-backed credit', 'Documentation support', 'Eligibility confirmed by the lender'],
            'documents' => array_merge($commonDocs, ['Udyam registration', 'Business proof']),
            'eligibility_notes' => ['Scheme eligibility criteria apply', 'Confirmed by the lender'],
        ],
        [
            'slug' => 'pmegp-loan',
            'name' => 'PMEGP Loan',
            'loan_type' => 'micro_loan',
            'icon' => 'account_balance',
            'tagline' => 'Empowering rural entrepreneurs',
            'summary' => 'Government-supported funding to set up micro enterprises. Scheme terms are set by the government and lenders.',
            'highlights' => ['Scheme-backed funding', 'Documentation support', 'Eligibility confirmed by the lender'],
            'documents' => array_merge($commonDocs, ['Project report']),
            'eligibility_notes' => ['Scheme eligibility criteria apply', 'Confirmed by the lender'],
        ],
        [
            'slug' => 'mudra-loan',
            'name' => 'MUDRA Loan',
            'loan_type' => 'mudra_loan',
            'icon' => 'storefront',
            'tagline' => 'Support for small businesses',
            'summary' => 'Small-business funding under the MUDRA scheme through participating lenders.',
            'highlights' => ['Scheme-backed funding', 'Documentation support', 'Eligibility confirmed by the lender'],
            'documents' => array_merge($commonDocs, ['Business proof']),
            'eligibility_notes' => ['Scheme eligibility criteria apply', 'Confirmed by the lender'],
        ],
        [
            'slug' => 'gold-loan',
            'name' => 'Gold Loan',
            'loan_type' => 'gold_loan',
            'icon' => 'savings',
            'tagline' => 'Quick funds against your gold',
            'summary' => 'Short-tenure funding secured against gold ornaments.',
            'highlights' => ['Secured by gold', 'Minimal documentation', 'Short and flexible tenures'],
            'documents' => ['Identity proof (Aadhaar / PAN)', 'Address proof'],
            'eligibility_notes' => ['Gold of acceptable purity', 'Valuation by the lender'],
        ],
    ],

    // Frontend shows these under every product page; kept here so legal /
    // business can edit wording without a frontend release.
    'disclaimer' => 'Information on this website is indicative. Interest rates, charges, eligibility and approval are decided by the lender after assessing your application. FINOOCEAN is a loan facilitator and does not guarantee approval.',
];
