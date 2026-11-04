/**
 * Content of the public loan-product pages, transcribed from the approved
 * designs in images/03_Services (and 01_All_Services for the overview cards).
 *
 * All rates, amounts, tenures, statistics, partner names and scheme claims
 * below come from those designs and are business-supplied — confirm they are
 * accurate and approved before launch. Nothing here is computed.
 */

export interface PField {
  /** Maps to an eligibility-check input where one exists (income, emi, amount, tenure, price, down, fees). */
  key: string;
  label: string;
  kind: 'number' | 'select' | 'radio';
  placeholder?: string;
  options?: string[];
}

export interface PEligibility {
  title: string;
  subtitle: string;
  /** Optional two-way toggle shown above the fields (New Car / Used Car, Study in India / Study Abroad). */
  toggle?: string[];
  fields: PField[];
  badges: string[];
  /** hero = card on the right of the hero; body = card in the page body. */
  where: 'hero' | 'body';
  dark?: boolean;
  /** Card above the form that describes a government scheme (CGTMSE / PMEGP / MUDRA). */
  fieldsHeading?: string;
}

export interface PScheme {
  title: string;
  subtitle: string;
  bullets: string[];
}

export interface ProductPage {
  slug: string;
  /** Overview-card text. */
  name: string;
  cardText: string;
  icon: string;
  kicker?: string;
  tagline: string;
  description: string;
  script: string;
  heroFeatures: { icon: string; label: string }[];
  applyLabel: string;
  secondaryCta: string;
  heroSide?: { title: string; subtitle?: string; items: string[] };
  scheme?: PScheme;
  strip: { label: string; value: string; icon?: string }[];
  whyTitle: string;
  whySub: string;
  why: { title: string; text: string; icon?: string }[];
  eligibility: PEligibility;
  quote: { text: string; bullets?: string[]; stats?: { value: string; label: string }[]; footer?: string };
  talk: { title: string; text: string; cta: string; badges: string[]; phoneNote?: boolean };
  how: { title: string; sub: string; steps: { title: string; text: string }[] };
  listTitle: string;
  list: string[];
  partners?: string[];
  band: { title: string; text: string; cta: string };
}

const PHONE_TALK = 'Schedule a Free Consultation';
const yrs = (n: number[]) => n.map((y) => `${y} ${y === 1 ? 'Year' : 'Years'}`);
const steps4 = (a: [string, string], b: [string, string], c: [string, string], d: [string, string]) =>
  [a, b, c, d].map(([title, text]) => ({ title, text }));
const std = (...pairs: [string, string][]) => pairs.map(([title, text]) => ({ title, text }));

export const PRODUCT_PAGES: ProductPage[] = [
  // ───────────────────────── Personal Loan ─────────────────────────
  {
    slug: 'personal-loan',
    name: 'Personal Loan',
    cardText: 'For your personal needs and aspirations.',
    icon: 'description',
    tagline: 'Your Dreams, Our Support',
    description:
      'Get instant financial support for your personal needs with flexible repayment options, minimal documentation and quick approval. Because your dreams shouldn’t wait.',
    script: 'Ideas Happen with the Right Support',
    heroFeatures: [
      { icon: 'bolt', label: 'Quick Approval' },
      { icon: 'description', label: 'Minimal Documents' },
      { icon: 'percent', label: 'Attractive Interest Rates' },
      { icon: 'handshake', label: 'Flexible Repayment' },
    ],
    applyLabel: 'Apply for Personal Loan',
    secondaryCta: 'Check Eligibility',
    heroSide: { title: '', items: ['Travel', 'Wedding', 'Home Renovation', 'Medical Expenses', 'Gadget & Lifestyle', 'And Much More'] },
    strip: [
      { label: 'Loan Amount', value: '₹50,000 – ₹25,00,000' },
      { label: 'Interest Rate', value: 'Starting from 10.5% p.a.' },
      { label: 'Repayment Tenure', value: '12 to 60 Months' },
      { label: 'Processing Fee', value: 'Minimal Charges', icon: 'receipt_long' },
    ],
    whyTitle: 'Why Choose Finoocean for Personal Loan?',
    whySub: 'We make borrowing simple, transparent and hassle-free.',
    why: std(
      ['Fast & Easy Process', 'Get approval in just a few hours.'],
      ['Minimal Documentation', 'Only essential documents required.'],
      ['Competitive Interest Rates', 'Affordable EMIs for your comfort.'],
      ['Flexible Repayment Options', 'Choose a tenure that suits you.'],
      ['Expert Guidance', 'Our loan experts are always here to help.'],
      ['100% Transparent', 'No hidden charges or surprises.'],
    ),
    eligibility: {
      title: 'Check Your Loan Eligibility',
      subtitle: 'Find out how much you can borrow in just 2 minutes.',
      fields: [
        { key: 'income', label: 'Monthly Income', kind: 'number', placeholder: 'Enter your monthly income' },
        { key: 'emi', label: 'Existing EMIs (if any)', kind: 'number', placeholder: 'Enter existing EMI amount' },
      ],
      badges: ['No Obligation', 'Quick Result', '100% Secure'],
      where: 'body',
    },
    quote: { text: 'Financial Freedom is Closer Than You Think', footer: 'Let Our Experts Guide You' },
    talk: { title: '', text: '', cta: 'Talk to an Expert', badges: [] },
    how: {
      title: 'How It Works?',
      sub: 'Get your personal loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Verification', 'We verify your details'], ['Get Approval', 'Receive loan offer'], ['Disbursal', 'Funds in your account']),
    },
    listTitle: 'Common Uses of Personal Loan',
    list: ['Travel', 'Wedding', 'Home Renovation', 'Medical Expenses', 'Education', 'Debt Consolidation'],
    band: { title: 'Ready to Turn Your Plans into Reality?', text: 'Apply now and take the first step towards a brighter tomorrow.', cta: 'Apply for Personal Loan' },
  },

  // ───────────────────────── Business Loan ─────────────────────────
  {
    slug: 'business-loan',
    name: 'Business Loan',
    cardText: 'Fuel your business growth.',
    icon: 'business_center',
    tagline: 'Empower Your Growth with Smart Financing Solutions',
    description:
      'Get the financial support your business needs to expand, manage working capital, purchase equipment, or start a new venture. We help you grow bigger, faster and stronger.',
    script: 'Stronger Businesses Brighter Tomorrows',
    heroFeatures: [
      { icon: 'bolt', label: 'Quick Approval' },
      { icon: 'description', label: 'Minimal Documentation' },
      { icon: 'handshake', label: 'Flexible Repayment' },
      { icon: 'percent', label: 'Competitive Interest Rates' },
    ],
    applyLabel: 'Apply for Business Loan',
    secondaryCta: 'Check Eligibility',
    heroSide: { title: 'Let’s Build Your Success Story', items: ['Working Capital', 'Business Expansion', 'Machinery & Equipment', 'New Business Setup', 'Refinance Existing Loan'] },
    strip: [
      { label: 'Loan Amount', value: '₹50,000 – ₹5 Crore' },
      { label: 'Interest Rate', value: '10.5% p.a. onwards' },
      { label: 'Repayment Tenure', value: '12 – 84 Months' },
      { label: 'Eligible Businesses', value: 'Sole Proprietor, Partnership, Private Limited, LLP & More' },
    ],
    whyTitle: 'Why Choose Finoocean for Business Loan?',
    whySub: 'We understand business. Our experts provide customized loan solutions to help you achieve your business goals.',
    why: std(
      ['Fast & Hassle-Free Process', 'Get approval in minimal time.'],
      ['Minimal Documentation', 'Only essential documents required.'],
      ['Tailored Solutions', 'Customized as per your business needs.'],
      ['Wide Lender Network', 'Partnered with top banks & NBFCs.'],
      ['Expert Guidance', 'End-to-end support from application to disbursal.'],
      ['Transparent Charges', 'No hidden fees. Clear terms and conditions.'],
    ),
    eligibility: {
      title: 'Check Your Business Loan Eligibility',
      subtitle: 'Get an instant estimate in just 2 minutes.',
      fields: [
        { key: 'turnover', label: 'Annual Business Turnover', kind: 'select', placeholder: 'Select turnover range', options: ['Up to ₹10 Lakh', '₹10 Lakh – ₹50 Lakh', '₹50 Lakh – ₹1 Crore', '₹1 Crore – ₹5 Crore', 'Above ₹5 Crore'] },
        { key: 'amount', label: 'Loan Amount Required', kind: 'select', placeholder: 'Select loan amount', options: ['₹5 Lakh', '₹10 Lakh', '₹25 Lakh', '₹50 Lakh', '₹1 Crore', '₹2 Crore', '₹5 Crore'] },
      ],
      badges: ['No Obligation', 'Quick Result', '100% Secure'],
      where: 'body',
      dark: true,
    },
    quote: { text: '“Your Business Growth is Our Priority”', footer: 'Get Expert Consultation Today!' },
    talk: { title: '', text: '', cta: 'Talk to an Expert', badges: [], phoneNote: true },
    how: {
      title: 'How Business Loan Works?',
      sub: 'Get your business loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Verification', 'We verify your details'], ['Get Approval', 'Receive loan offer'], ['Disbursal', 'Funds in your account']),
    },
    listTitle: 'Use Your Business Loan For',
    list: ['Working Capital', 'Business Expansion', 'Machinery & Equipment', 'New Setup', 'Franchise Funding', 'Debt Consolidation'],
    band: { title: 'Big Dreams Deserve the Right Financial Partner', text: 'From startups to established businesses, Finoocean is here to support your journey.', cta: 'Apply for Business Loan' },
  },

  // ───────────────────────── Home Loan ─────────────────────────
  {
    slug: 'home-loan',
    name: 'Home Loan',
    cardText: 'Turn your dream home into reality.',
    icon: 'home',
    kicker: 'Turn your dream home into reality',
    tagline: 'Own a home. Build a better tomorrow.',
    description:
      'Get easy and affordable home loans with competitive interest rates, flexible repayment options and expert guidance — only with Finoocean.',
    script: 'A Stronger Today for a Brighter Tomorrow',
    heroFeatures: [
      { icon: 'percent', label: 'Low Interest Rates' },
      { icon: 'calendar_month', label: 'Flexible Tenure' },
      { icon: 'description', label: 'Minimal Documentation' },
      { icon: 'support_agent', label: 'Expert Support' },
    ],
    applyLabel: 'Apply for Home Loan',
    secondaryCta: 'Check Eligibility',
    strip: [
      { label: 'Loan Amount', value: '₹5 Lakh – ₹10 Crore' },
      { label: 'Interest Rate', value: '8.25% p.a. onwards' },
      { label: 'Repayment Tenure', value: 'Up to 30 Years' },
      { label: 'Eligible', value: 'Salaried, Self-Employed & Business Owners' },
    ],
    whyTitle: 'Why Choose Finoocean for Home Loan?',
    whySub: 'We make your home buying journey simple, transparent and stress-free.',
    why: std(
      ['Competitive Interest Rates', ''],
      ['Minimal Documentation', ''],
      ['Flexible Repayment Options', ''],
      ['Loan for Purchase, Construction & Renovation', ''],
      ['Balance Transfer Facility', ''],
      ['Expert Guidance', 'End-to-End'],
    ),
    eligibility: {
      title: 'Check Your Home Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'income', label: 'Monthly Income (₹)', kind: 'number', placeholder: 'e.g. 50000' },
        { key: 'emi', label: 'Existing EMIs (₹)', kind: 'number', placeholder: 'e.g. 10000' },
        { key: 'amount', label: 'Loan Amount (₹)', kind: 'number', placeholder: 'e.g. 3000000' },
        { key: 'tenure', label: 'Loan Tenure', kind: 'select', placeholder: 'Select Tenure', options: yrs([5, 10, 15, 20, 25, 30]) },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: '“A Home Today for a Brighter Tomorrow”', stats: [{ value: '10,000+', label: 'Happy Families' }, { value: '99%', label: 'Approval Rate' }, { value: '15+', label: 'Bank Partners' }] },
    talk: { title: 'Talk to Our Home Loan Expert', text: 'Get free consultation and the best loan options as per your profile.', cta: 'Talk to an Expert', badges: ['100% Free Consultation', 'Best Loan Options', 'No Hidden Charges'], phoneNote: true },
    how: {
      title: 'How Home Loan Works?',
      sub: 'Get your home loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill simple form'], ['Document Verification', 'We verify your details'], ['Loan Approval', 'Get offer from our partners'], ['Disbursal', 'Funds directly to builder/seller']),
    },
    listTitle: 'Use Your Home Loan For',
    list: ['Buy a New Home', 'Construct Your Home', 'Home Renovation', 'Plot Purchase', 'Balance Transfer'],
    band: { title: 'Your Dream Home is Just a Step Away', text: 'Let Finoocean help you find the best home loan options from top banks & NBFCs.', cta: 'Apply for Home Loan' },
  },

  // ───────────────────────── Loan Against Property ─────────────────────────
  {
    slug: 'loan-against-property',
    name: 'Loan Against Property',
    cardText: 'Unlock the value of your assets.',
    icon: 'apartment',
    kicker: 'Unlock the value of your property',
    tagline: 'Your Property. Our Support. Bigger Possibilities.',
    description:
      'Get higher loan amounts at lower interest rates by leveraging your residential or commercial property. Use the funds for business expansion, education, medical needs, debt consolidation or any personal goal.',
    script: 'Your Property Can Do More!',
    heroFeatures: [
      { icon: 'percent', label: 'Lower Interest Rates' },
      { icon: 'account_balance_wallet', label: 'Higher Loan Amount' },
      { icon: 'event_repeat', label: 'Flexible Repayment' },
      { icon: 'tune', label: 'Multiple Usage Options' },
    ],
    applyLabel: 'Apply for LAP',
    secondaryCta: 'Check Eligibility',
    strip: [
      { label: 'Loan Amount', value: '₹10 Lakh – ₹10 Crore' },
      { label: 'Interest Rate', value: '8.50% p.a. onwards' },
      { label: 'Repayment Tenure', value: 'Up to 20 Years' },
      { label: 'Properties Eligible', value: 'Residential & Commercial' },
    ],
    whyTitle: 'Why Choose Finoocean for Loan Against Property?',
    whySub: 'We provide tailored LAP solutions with quick processing, transparent terms and expert guidance.',
    why: std(
      ['Higher Loan Amount', 'Up to 70% of property value'],
      ['Lower Interest Rates', 'Compared to personal loans'],
      ['Flexible Repayment', 'Tenure up to 20 years'],
      ['Multiple Usage Options', 'Business, education, medical, personal, etc.'],
      ['Minimal Documentation', 'Hassle-free process'],
      ['Expert Support', 'From application to disbursal'],
    ),
    eligibility: {
      title: 'Check Your Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'property', label: 'Property Value (₹)', kind: 'number', placeholder: 'e.g. 5000000' },
        { key: 'amount', label: 'Loan Amount Required (₹)', kind: 'number', placeholder: 'e.g. 2000000' },
        { key: 'purpose', label: 'Purpose of Loan', kind: 'select', placeholder: 'Select Purpose', options: ['Business Expansion', 'Education Expenses', 'Medical Emergencies', 'Debt Consolidation', 'Home Renovation', 'Personal Goals'] },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: '“Leverage Your Property for a Better Tomorrow”', stats: [{ value: '5,000+', label: 'Loans Disbursed' }, { value: '99%', label: 'Customer Satisfaction' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our LAP Expert', text: 'Get personalized guidance based on your property and financial needs.', cta: PHONE_TALK, badges: ['Trusted Experts', 'Best Loan Options', 'No Hidden Charges'], phoneNote: true },
    how: {
      title: 'How Loan Against Property Works?',
      sub: 'Get your loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Property Evaluation', 'We assess your property'], ['Loan Approval', 'Get offer from our partners'], ['Disbursal', 'Funds in your account']),
    },
    listTitle: 'Common Uses of LAP',
    list: ['Business Expansion', 'Education Expenses', 'Medical Emergencies', 'Debt Consolidation', 'Home Renovation', 'Personal Goals'],
    band: { title: 'Your Property Has the Power to Create New Opportunities', text: 'Turn your assets into financial freedom with Finoocean.', cta: 'Apply for Loan Against Property' },
  },

  // ───────────────────────── Car Loan ─────────────────────────
  {
    slug: 'car-loan',
    name: 'Car Loan',
    cardText: 'Drive your dreams today.',
    icon: 'directions_car',
    kicker: 'Drive your dreams today',
    tagline: 'Easy Finance. Hassle-Free Process.',
    description:
      'Get behind the wheel with Finoocean’s car loan. Enjoy competitive interest rates, flexible repayment options and quick approval for a smoother, smarter driving experience.',
    script: 'New Journeys Brighter Tomorrows',
    heroFeatures: [
      { icon: 'bolt', label: 'Quick Approval' },
      { icon: 'percent', label: 'Low Interest Rates' },
      { icon: 'calendar_month', label: 'Flexible Tenure' },
      { icon: 'description', label: 'Minimal Documentation' },
    ],
    applyLabel: 'Apply for Car Loan',
    secondaryCta: 'Check Eligibility',
    strip: [
      { label: 'Loan Amount', value: '₹1 Lakh – ₹5 Crore' },
      { label: 'Interest Rate', value: '8.50% p.a. onwards' },
      { label: 'Repayment Tenure', value: 'Up to 7 Years' },
      { label: 'New & Used Cars', value: 'All Major Brands' },
    ],
    whyTitle: 'Why Choose Finoocean for Car Loan?',
    whySub: 'We make car ownership simple, affordable and stress-free with expert guidance and dedicated support.',
    why: std(
      ['Quick Approval', 'Get loan approval in minimal time.'],
      ['Competitive Interest Rates', 'Lower EMIs for a smoother journey.'],
      ['Minimal Documentation', 'Hassle-free process.'],
      ['Flexible Repayment Options', 'Choose a tenure that suits you.'],
      ['New & Used Car Loans', 'Finance for all major brands.'],
      ['Expert Support', 'End-to-end assistance until disbursal.'],
    ),
    eligibility: {
      title: 'Check Your Car Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      toggle: ['New Car', 'Used Car'],
      fields: [
        { key: 'price', label: 'Car Price (₹)', kind: 'number', placeholder: 'e.g. 1000000' },
        { key: 'down', label: 'Down Payment (₹)', kind: 'number', placeholder: 'e.g. 200000' },
        { key: 'tenure', label: 'Loan Tenure', kind: 'select', placeholder: 'Select Tenure', options: yrs([1, 2, 3, 4, 5, 6, 7]) },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Your Next Ride Is Closer Than You Think', stats: [{ value: '10,000+', label: 'Happy Customers' }, { value: '99%', label: 'Approval Rate' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our Car Loan Expert', text: 'Get free consultation and the best loan options as per your profile.', cta: PHONE_TALK, badges: ['Best Loan Options', 'Trusted Partners', 'No Hidden Charges'], phoneNote: true },
    how: {
      title: 'How Car Loan Works?',
      sub: 'Get your car loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Document Verification', 'We verify your details'], ['Loan Approval', 'Get offer from our partners'], ['Disbursal', 'Funds transferred to dealer']),
    },
    listTitle: 'Popular Car Loan Brands',
    list: ['Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra', 'Toyota', 'Kia'],
    band: { title: 'Drive Your Future with Finoocean', text: 'Whether it’s your first car or an upgrade, we’re here to make it happen.', cta: 'Apply for Car Loan' },
  },

  // ───────────────────────── Education Loan ─────────────────────────
  {
    slug: 'education-loan',
    name: 'Education Loan',
    cardText: 'Invest in a brighter tomorrow.',
    icon: 'school',
    kicker: 'Invest in a Brighter Tomorrow',
    tagline: 'Because every dream deserves a chance.',
    description:
      'Get easy and flexible education loans for higher studies in India and abroad. Finance your future with low interest rates, flexible repayment options and expert guidance.',
    script: 'Dream Learn Grow Succeed',
    heroFeatures: [
      { icon: 'school', label: 'Higher Education Support' },
      { icon: 'percent', label: 'Low Interest Rates' },
      { icon: 'event_repeat', label: 'Flexible Repayment' },
      { icon: 'description', label: 'Minimal Documentation' },
    ],
    applyLabel: 'Apply for Education Loan',
    secondaryCta: 'Check Eligibility',
    strip: [
      { label: 'Loan Amount', value: '₹5 Lakh – ₹1.5 Crore' },
      { label: 'Interest Rate', value: '8.50% p.a. onwards' },
      { label: 'Repayment Tenure', value: 'Up to 15 Years' },
      { label: 'Study in India & Abroad', value: 'Wide Range of Courses' },
    ],
    whyTitle: 'Why Choose Finoocean for Education Loan?',
    whySub: 'We support your academic journey with simple, transparent and student-friendly loan solutions.',
    why: std(
      ['Finance for India & Abroad', 'UG, PG, Diploma, Doctorate'],
      ['Competitive Interest Rates', 'Lower EMIs for your future'],
      ['Flexible Repayment Options', 'Moratorium up to course duration'],
      ['Minimal Documentation', 'Hassle-free process'],
      ['Cover Tuition, Living & More', 'Full education expenses'],
      ['Expert Guidance', 'From application to disbursal'],
    ),
    eligibility: {
      title: 'Check Your Education Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      toggle: ['Study in India', 'Study Abroad'],
      fields: [
        { key: 'level', label: 'Course Level', kind: 'select', placeholder: 'Select Course Level', options: ['UG', 'PG', 'Diploma', 'Doctorate'] },
        { key: 'fees', label: 'Course Fees (₹)', kind: 'number', placeholder: 'e.g. 1000000' },
        { key: 'tenure', label: 'Loan Tenure', kind: 'select', placeholder: 'Select Tenure', options: yrs([5, 7, 10, 12, 15]) },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Big Dreams Need the Right Support', bullets: ['Top Universities', 'Global Opportunities', 'Bright Career Ahead'], stats: [{ value: '10,000+', label: 'Students Supported' }, { value: '99%', label: 'Approval Rate' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our Education Loan Expert', text: 'Get free counselling on courses, universities and loan options as per your profile.', cta: PHONE_TALK, badges: ['Career Guidance', 'University Shortlisting', 'Loan Process Support'], phoneNote: true },
    how: {
      title: 'How Education Loan Works?',
      sub: 'Get your education loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Document Verification', 'We verify your details'], ['Loan Approval', 'Get offer from our partners'], ['Disbursal', 'Funds to your institution']),
    },
    listTitle: 'Popular Study Destinations',
    list: ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany'],
    band: { title: 'Your Education. Our Support. A Brighter Future.', text: 'Let Finoocean help you turn your academic dreams into reality.', cta: 'Apply for Education Loan' },
  },

  // ───────────────────────── Stand-Up India ─────────────────────────
  {
    slug: 'stand-up-india',
    name: 'Stand-Up India Loan',
    cardText: 'Support for entrepreneurs.',
    icon: 'trending_up',
    kicker: 'Empower Entrepreneurs Build a Stronger India',
    tagline: 'Financial support for SC/ST and Women Entrepreneurs to start and grow their business.',
    description:
      'Get bank loans between ₹10 lakh to ₹1 crore under the Stand-Up India scheme. Finoocean helps you with guidance, documentation and end-to-end support to turn your entrepreneurial dreams into reality.',
    script: 'Women Entrepreneurs Stronger India',
    heroFeatures: [
      { icon: 'account_balance', label: 'Government Backed Scheme' },
      { icon: 'percent', label: 'Low Interest Rates' },
      { icon: 'diversity_3', label: 'Handholding Support' },
      { icon: 'description', label: 'Easy Documentation' },
    ],
    applyLabel: 'Apply for Stand-Up India Loan',
    secondaryCta: 'Check Eligibility',
    strip: [
      { label: 'Loan Amount', value: '₹10 Lakh – ₹1 Crore' },
      { label: 'Interest Rates', value: 'Competitive' },
      { label: 'Repayment Tenure', value: 'Up to 7 Years' },
      { label: 'Entrepreneurs Eligible', value: 'SC/ST & Women' },
    ],
    whyTitle: 'Why Choose Finoocean for Stand-Up India Loan?',
    whySub: 'We are committed to supporting first-time entrepreneurs from SC/ST and women communities with the right financial guidance and easy access to institutional credit.',
    why: std(
      ['End-to-End Support', 'From application to disbursal'],
      ['Guidance on Business Plan', 'Expert assistance'],
      ['Tie-ups with Leading Banks', 'Better approval chances'],
      ['Minimal Documentation', 'Hassle-free process'],
      ['Dedicated Support Team', 'Personalized consultation'],
      ['Post-Loan Assistance', 'For business growth'],
    ),
    eligibility: {
      title: 'Stand-Up India Loan Eligibility',
      subtitle: 'Check your basic eligibility in 2 minutes.',
      fields: [
        { key: 'category', label: 'I am a', kind: 'select', placeholder: 'Select Category', options: ['SC/ST Entrepreneur', 'Woman Entrepreneur'] },
        { key: 'btype', label: 'Business Type', kind: 'select', placeholder: 'Select Business Type', options: ['Manufacturing', 'Services', 'Trading', 'Agri & Allied'] },
        { key: 'amount', label: 'Loan Amount Required (₹)', kind: 'number', placeholder: 'e.g. 1000000' },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Empowered Entrepreneurs Build a Brighter India', stats: [{ value: '5,000+', label: 'Entrepreneurs Supported' }, { value: '90%', label: 'Approval Assistance' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our Stand-Up India Expert', text: 'Get free consultation and step-by-step guidance for your business loan.', cta: 'Talk to an Expert', badges: ['Trusted Experts', 'Government Scheme Support', 'No Hidden Charges'], phoneNote: true },
    how: {
      title: 'How Stand-Up India Loan Works?',
      sub: 'Get your loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Document Verification', 'We verify your details'], ['Bank Processing', 'Application to partner bank'], ['Loan Disbursal', 'Get funds to start your business']),
    },
    listTitle: 'Eligible Business Types',
    list: ['Manufacturing', 'Services', 'Trading', 'Agri & Allied', 'Retail & E-commerce', 'Micro Enterprises'],
    band: { title: 'Support Today. Stronger Entrepreneurs Tomorrow.', text: 'Let Finoocean help you be a part of the Stand-Up India mission.', cta: 'Apply for Stand-Up India Loan' },
  },

  // ───────────────────────── Project Funding ─────────────────────────
  {
    slug: 'project-funding',
    name: 'Project Funding',
    cardText: 'Finance your vision.',
    icon: 'engineering',
    kicker: 'Turn Your Vision Into Reality',
    tagline: 'Financial support for your big ideas.',
    description:
      'Get customized project funding for new businesses, expansion, infrastructure, manufacturing, real estate and more. Finoocean helps you secure the right funding with expert guidance, banking partnerships and end-to-end support.',
    script: 'Bigger Projects Stronger Tomorrows',
    heroFeatures: [
      { icon: 'tune', label: 'Tailored Funding Solutions' },
      { icon: 'account_balance', label: 'Support from Leading Banks' },
      { icon: 'fact_check', label: 'Expert Project Evaluation' },
      { icon: 'support_agent', label: 'End-to-End Assistance' },
    ],
    applyLabel: 'Apply for Project Funding',
    secondaryCta: 'Consult an Expert',
    strip: [
      { label: 'Funding Range', value: '₹50 Lakh – ₹100 Crore' },
      { label: 'Interest Rates', value: 'Competitive' },
      { label: 'Repayment Tenure', value: 'Flexible' },
      { label: 'Industries Supported', value: 'All Major Industries' },
    ],
    whyTitle: 'Why Choose Finoocean for Project Funding?',
    whySub: 'We provide end-to-end support to help you secure the right funding for your project, with a faster, transparent and hassle-free process.',
    why: std(
      ['Expert Project Evaluation', 'Detailed feasibility support'],
      ['Customized Funding', 'As per your business needs'],
      ['Tie-ups with Leading Banks', 'Better approval chances'],
      ['Support at Every Stage', 'From proposal to disbursal'],
      ['Minimal Documentation', 'Hassle-free process'],
      ['Dedicated Relationship Manager', 'Personalized assistance'],
    ),
    eligibility: {
      title: 'Check Your Project Funding Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'ptype', label: 'Project Type', kind: 'select', placeholder: 'Select Project Type', options: ['Manufacturing', 'Real Estate', 'Infrastructure', 'Healthcare', 'Education', 'Hospitality', 'Renewable Energy', 'Agri & Allied'] },
        { key: 'cost', label: 'Project Cost (₹)', kind: 'number', placeholder: 'e.g. 5000000' },
        { key: 'amount', label: 'Funding Required (₹)', kind: 'number', placeholder: 'e.g. 3000000' },
        { key: 'stage', label: 'Project Stage', kind: 'select', placeholder: 'Select Stage', options: ['Idea / Planning', 'Under Construction', 'Operational – Expansion'] },
      ],
      badges: ['No Obligation', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Strong Projects Build Stronger India', stats: [{ value: '1,000+', label: 'Projects Supported' }, { value: '95%', label: 'Success Rate' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our Project Funding Expert', text: 'Get free consultation and the best funding options for your project.', cta: PHONE_TALK, badges: ['Expert Advice', 'Banking Network', 'Project Support'], phoneNote: true },
    how: {
      title: 'How Project Funding Works?',
      sub: 'Get your project funding in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Project Evaluation', 'We assess your project'], ['Loan Approval', 'Get offer from our partners'], ['Disbursal', 'Funds to your account']),
    },
    listTitle: 'Industries We Support',
    list: ['Manufacturing', 'Real Estate', 'Infrastructure', 'Healthcare', 'Education', 'Hospitality', 'Renewable Energy', 'Agri & Allied'],
    band: { title: 'Let’s Build a Stronger Tomorrow Together.', text: 'Partner with Finoocean for reliable project funding solutions.', cta: 'Apply for Project Funding' },
  },

  // ───────────────────────── CGTMSE ─────────────────────────
  {
    slug: 'cgtmse-loan',
    name: 'CGTMSE Loan',
    cardText: 'Collateral-free credit for small businesses.',
    icon: 'verified_user',
    kicker: 'Unsecured Loans for a Stronger MSME Sector',
    tagline: 'Big Support for Small Businesses.',
    description:
      'Get collateral-free loans for your business under the Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE). Finoocean helps MSMEs grow with easier access to credit, lower risk and expert guidance.',
    script: 'Empowering MSMEs Building a Stronger India',
    heroFeatures: [
      { icon: 'lock_open', label: 'Collateral Free' },
      { icon: 'percent', label: 'Competitive Rates' },
      { icon: 'description', label: 'Easy Process' },
      { icon: 'domain', label: 'MSME Support' },
    ],
    applyLabel: 'Apply for CGTMSE Loan',
    secondaryCta: 'Check Eligibility',
    scheme: { title: 'CGTMSE', subtitle: 'Ministry of MSME, Government of India', bullets: ['No Collateral', 'Lower Risk for Banks', 'Easier Credit Access', 'Support for MSME Growth'] },
    strip: [
      { label: 'Loan Amount', value: '₹10 Lakh – ₹2 Crore' },
      { label: 'Collateral Free', value: 'No security required' },
      { label: 'Interest Rates', value: 'Competitive' },
      { label: 'MSMEs Across India', value: 'All Sectors Supported' },
    ],
    whyTitle: 'Why Choose Finoocean for CGTMSE Loan?',
    whySub: 'We simplify the CGTMSE loan process and help MSMEs get the financial support they need to grow, without collateral and with expert assistance.',
    why: std(
      ['Collateral-Free Loans', 'No security or asset mortgage'],
      ['Tie-ups with Leading Banks', 'Higher approval chances'],
      ['Easy Documentation', 'Simple and transparent process'],
      ['Lower Risk & Better Terms', 'Backed by Government Guarantee'],
      ['Support from Application to Disbursal', 'End-to-end assistance'],
      ['Dedicated MSME Experts', 'Personalized guidance'],
    ),
    eligibility: {
      title: 'Check Your CGTMSE Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'btype', label: 'Business Type', kind: 'select', placeholder: 'Select Business Type', options: ['Manufacturing', 'Services', 'Trading', 'Retail & E-commerce', 'Agriculture & Allied', 'Healthcare', 'Education', 'Food Processing'] },
        { key: 'turnover', label: 'Annual Turnover (₹)', kind: 'number', placeholder: 'e.g. 5000000' },
        { key: 'amount', label: 'Loan Amount Required (₹)', kind: 'number', placeholder: 'e.g. 2000000' },
        { key: 'purpose', label: 'Purpose of Loan', kind: 'select', placeholder: 'Select Purpose', options: ['Working Capital', 'Business Expansion', 'Machinery & Equipment', 'New Setup'] },
      ],
      badges: ['No Collateral', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Small Businesses Big Dreams Stronger India', stats: [{ value: '5,000+', label: 'MSMEs Supported' }, { value: '92%', label: 'Approval Rate' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our CGTMSE Expert', text: 'Get free consultation and complete guidance on CGTMSE loan for your business.', cta: PHONE_TALK, badges: ['Expert Advice', 'Banking Network', 'MSME Specialists'], phoneNote: true },
    how: {
      title: 'How CGTMSE Loan Works?',
      sub: 'Get your loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Document Verification', 'We verify your details'], ['Loan Approval', 'Get offer from our bank partners'], ['Disbursal', 'Funds to your account']),
    },
    listTitle: 'Business Types We Support',
    list: ['Manufacturing', 'Services', 'Trading', 'Retail & E-commerce', 'Agriculture & Allied', 'Healthcare', 'Education', 'Food Processing'],
    partners: ['SBI', 'HDFC BANK', 'ICICI Bank', 'AXIS BANK', 'Union Bank of India'],
    band: { title: 'Fueling MSME Growth. Enabling a Stronger India.', text: 'With CGTMSE and Finoocean, your business can go further.', cta: 'Apply for CGTMSE Loan' },
  },

  // ───────────────────────── PMEGP ─────────────────────────
  {
    slug: 'pmegp-loan',
    name: 'PMEGP Loan',
    cardText: 'Empowering rural entrepreneurs.',
    icon: 'account_balance',
    kicker: 'Start Your Own Business Build a Better Tomorrow',
    tagline: 'Government Support for Your Entrepreneurial Journey.',
    description:
      'Get financial assistance under the Prime Minister’s Employment Generation Programme (PMEGP). Finoocean helps you with project preparation, documentation and end-to-end support to start your own business.',
    script: 'Small Businesses Stronger India',
    heroFeatures: [
      { icon: 'account_balance', label: 'Govt. Backed Scheme' },
      { icon: 'percent', label: 'Subsidy Support' },
      { icon: 'description', label: 'Easy Application Process' },
      { icon: 'support_agent', label: 'Expert Guidance' },
    ],
    applyLabel: 'Apply for PMEGP Loan',
    secondaryCta: 'Check Eligibility',
    scheme: { title: 'PMEGP', subtitle: 'Ministry of MSME, Government of India', bullets: ['Self-Employment', 'Rural & Urban Areas', 'Manufacturing & Service Sector', 'Subsidy Up to 35%'] },
    strip: [
      { label: 'Project Cost', value: '₹10 Lakh – ₹50 Lakh' },
      { label: 'Government Subsidy', value: '15% – 35%' },
      { label: 'Low Interest Rates', value: 'Through Banks' },
      { label: 'Self-Employment', value: 'Create Jobs for a Better India' },
    ],
    whyTitle: 'Why Choose Finoocean for PMEGP Loan?',
    whySub: 'We make your entrepreneurial journey simple with expert guidance, project report support and complete assistance until loan disbursal.',
    why: std(
      ['Government Scheme Support', 'Complete guidance'],
      ['Project Report Preparation', 'DPR & documentation'],
      ['Bank Tie-ups', 'Faster loan approval'],
      ['Subsidy Assistance', 'Up to 35% subsidy'],
      ['End-to-End Support', 'From application to disbursal'],
      ['Expert Team', 'Personalized consultation'],
    ),
    eligibility: {
      title: 'Check Your PMEGP Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'activity', label: 'Business Activity', kind: 'select', placeholder: 'Select Business Activity', options: ['Manufacturing', 'Agri & Allied', 'Food Processing', 'Retail & Services', 'Handicrafts', 'Rural Industries'] },
        { key: 'cost', label: 'Project Cost (₹)', kind: 'number', placeholder: 'e.g. 1000000' },
        { key: 'location', label: 'Location', kind: 'select', placeholder: 'Select Location', options: ['Maharashtra', 'Other State'] },
        { key: 'area', label: '', kind: 'radio', options: ['Rural Area', 'Urban Area'] },
      ],
      badges: ['No Hidden Charges', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Empowering Entrepreneurs Building a Self-Reliant India', stats: [{ value: '10,000+', label: 'Entrepreneurs Supported' }, { value: '90%', label: 'Approval Assistance' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our PMEGP Expert', text: 'Get free consultation on project planning, eligibility and loan application process.', cta: PHONE_TALK, badges: ['Project Planning', 'Bank Coordination', 'Subsidy Guidance'], phoneNote: true },
    how: {
      title: 'How PMEGP Loan Works?',
      sub: 'Get your loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Project Report', 'We help you prepare DPR'], ['Loan Processing', 'Application to bank'], ['Disbursal', 'Get funds to start your business']),
    },
    listTitle: 'Eligible Business Activities',
    list: ['Manufacturing', 'Agri & Allied', 'Food Processing', 'Retail & Services', 'Handicrafts', 'Rural Industries', 'More Sectors'],
    partners: ['SBI', 'Bank of Baroda', 'Union Bank of India', 'Canara Bank', 'Indian Bank', 'PNB'],
    band: { title: 'Be Your Own Boss. Create Opportunities.', text: 'With PMEGP and Finoocean, turn your ideas into a successful business.', cta: 'Apply for PMEGP Loan' },
  },

  // ───────────────────────── MUDRA ─────────────────────────
  {
    slug: 'mudra-loan',
    name: 'MUDRA Loan',
    cardText: 'Big opportunities for small businesses.',
    icon: 'storefront',
    kicker: 'Small Loans Big Opportunities',
    tagline: 'Powering India’s Small Businesses.',
    description:
      'Get easy and collateral-free loans under the Pradhan Mantri Mudra Yojana (PMMY). Finoocean helps you access Mudra loans to start, grow or expand your business with complete guidance and support.',
    script: 'Small Business Stronger India',
    heroFeatures: [
      { icon: 'lock_open', label: 'No Collateral Required' },
      { icon: 'touch_app', label: 'Easy Application' },
      { icon: 'bolt', label: 'Quick Approval' },
      { icon: 'support_agent', label: 'End-to-End Support' },
    ],
    applyLabel: 'Apply for MUDRA Loan',
    secondaryCta: 'Check Eligibility',
    scheme: { title: 'Pradhan Mantri Mudra Yojana', subtitle: 'Funding the Unfunded', bullets: ['Shishu (Up to ₹50,000)', 'Kishor (₹50,000 - ₹5 Lakh)', 'Tarun (₹5 Lakh - ₹10 Lakh)', 'For Manufacturing, Trading & Services'] },
    strip: [
      { label: 'Loan Amount', value: '₹50,000 – ₹10 Lakh' },
      { label: 'Collateral Free', value: 'No Security Required' },
      { label: 'Interest Rates', value: 'Competitive' },
      { label: 'All Types of Businesses', value: 'Manufacturing, Trading, Services' },
    ],
    whyTitle: 'Why Choose Finoocean for MUDRA Loan?',
    whySub: 'We provide complete support to help you get Mudra loans easily, with expert guidance, documentation support and faster approvals.',
    why: std(
      ['End-to-End Guidance', 'From application to disbursal'],
      ['Minimal Documentation', 'Simple and hassle-free process'],
      ['Tie-ups with Leading Banks', 'Better approval chances'],
      ['Support for All 3 Categories', 'Shishu, Kishor & Tarun'],
      ['Expert Team', 'Personalized assistance'],
      ['Business Growth Support', 'For a stronger tomorrow'],
    ),
    eligibility: {
      title: 'Check Your MUDRA Loan Eligibility',
      subtitle: 'Get an instant estimate in 2 minutes.',
      fields: [
        { key: 'category', label: 'Loan Category', kind: 'select', placeholder: 'Select Loan Category', options: ['Shishu (Up to ₹50,000)', 'Kishor (₹50,000 - ₹5 Lakh)', 'Tarun (₹5 Lakh - ₹10 Lakh)'] },
        { key: 'btype', label: 'Business Type', kind: 'select', placeholder: 'Select Business Type', options: ['Manufacturing', 'Trading', 'Services', 'Retail & E-commerce', 'Food & Beverages', 'Handicrafts', 'Transport'] },
        { key: 'amount', label: 'Loan Amount Required (₹)', kind: 'number', placeholder: 'e.g. 500000' },
        { key: 'location', label: 'Location', kind: 'select', placeholder: 'Select Location', options: ['Maharashtra', 'Other State'] },
      ],
      badges: ['No Collateral', '100% Secure'],
      where: 'hero',
    },
    quote: { text: 'Empowering Entrepreneurs Creating A Stronger India', stats: [{ value: '25,000+', label: 'Businesses Supported' }, { value: '92%', label: 'Approval Rate' }, { value: '15+', label: 'Banking Partners' }] },
    talk: { title: 'Talk to Our MUDRA Loan Expert', text: 'Get free consultation and step-by-step guidance for your Mudra loan application.', cta: PHONE_TALK, badges: ['Loan Guidance', 'Documentation Support', 'Bank Tie-ups'], phoneNote: true },
    how: {
      title: 'How MUDRA Loan Works?',
      sub: 'Get your loan in 4 simple steps.',
      steps: steps4(['Apply Online', 'Fill in a simple form'], ['Document Submission', 'We verify your details'], ['Loan Processing', 'Application to bank'], ['Disbursal', 'Get funds for your business']),
    },
    listTitle: 'Businesses We Support',
    list: ['Manufacturing', 'Trading', 'Services', 'Retail & E-commerce', 'Food & Beverages', 'Handicrafts', 'Transport', 'More Sectors'],
    band: { title: 'Your Business. Our Support. A Stronger India.', text: 'With MUDRA Loan and Finoocean, take the next step towards your dreams.', cta: 'Apply for MUDRA Loan' },
  },
];

/** Overview (Services page) content from images/03_Services/01_All_Services.png. */
export const SERVICES_PAGE = {
  heroTitle: ['Our Loan', 'Services'],
  heroSub: 'Financial Solutions for Every Dream',
  heroText: 'From personal needs to business growth, we offer a wide range of loan solutions designed to support you at every stage of life.',
  heroScript: 'Bigger Dreams Brighter Tomorrows',
  heroFeatures: [
    { icon: 'bolt', label: 'Fast Approval' },
    { icon: 'support_agent', label: 'Expert Guidance' },
    { icon: 'visibility', label: 'Transparent Process' },
  ],
  eyebrow: 'EXPLORE OUR SERVICES',
  heading: ['Choose the ', 'Right Loan', ' for Your Needs'],
  sub: 'Simple. Secure. Supportive. Find the best financial solution from our range of loan services.',
  processTitle: 'Our Simple Loan Process',
  processSub: 'Get your loan in just 4 easy steps',
  process: [
    { title: 'Apply Online', text: 'Fill in a simple form' },
    { title: 'Verification', text: 'We verify your details' },
    { title: 'Get Best Offer', text: 'Compare loan options' },
    { title: 'Disbursal', text: 'Receive funds quickly' },
  ],
  helpTitle: ['Need Help Choosing?', 'Talk to Our Loan Experts'],
  helpText: 'Get personalized advice based on your financial goals.',
  band: { title: 'Ready to Take the Next Step?', text: 'Join thousands of individuals and businesses who trust Finoocean.', cta: 'Apply for a Loan' },
};
