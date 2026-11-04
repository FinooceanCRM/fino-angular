/**
 * Content for Calculator, Eligibility, FAQ, Contact, Testimonials, Blog and
 * the home-page extras, transcribed from the approved designs in images/
 * (04_Calculator, 05_Eligibility, 08_FAQ, 09_Testimonials, 10_Blog, 11_Contact,
 * 01_Home).
 *
 * Statistics, ratings, customer quotes, names, article text and partner names
 * are business-supplied from those designs — confirm they are accurate,
 * current and approved for publication before launch. FAQ ANSWERS and a few
 * dropdown options are not shown in the designs; they are drafted here in
 * neutral wording and are marked `drafted: true` for review.
 */

// ───────────────────────── Calculator (04_Calculator/03_Calculator_C) ─────────────────────────
export const CALC = {
  heroTitle: 'Loan Calculator',
  heroSub: 'Plan Smarter. Borrow Better.',
  heroText: 'Calculate your EMI, total interest and repayment schedule before you apply. Make informed financial decisions with Finoocean.',
  heroScript: 'Better Planning Brighter Tomorrow',
  heroChecks: ['Easy to Use', 'Instant Results', 'Plan Your Finances', '100% Free'],
  tabs: [
    { key: 'personal-loan', label: 'Personal Loan', icon: 'person', maxYears: 100 },
    { key: 'business-loan', label: 'Business Loan', icon: 'business', maxYears: 100 },
    { key: 'home-loan', label: 'Home Loan', icon: 'home', maxYears: 100 },
    { key: 'loan-against-property', label: 'Loan Against Property', icon: 'apartment', maxYears: 100 },
    { key: 'car-loan', label: 'Car Loan', icon: 'directions_car', maxYears: 100 },
    { key: 'education-loan', label: 'Education Loan', icon: 'school', maxYears: 100 },
    { key: 'pmegp-loan', label: 'PMEGP Loan', icon: 'account_balance', maxYears: 100 },
    { key: 'mudra-loan', label: 'MUDRA Loan', icon: 'storefront', maxYears: 100 },
  ],
  subtitle: 'Adjust the values below to calculate your EMI, total interest and repayment amount.',
  amount: { min: 50000, max: 5000000, default: 500000, step: 10000 },
  rate: { min: 5, max: 24, default: 12.5, step: 0.5 },
  tenure: { minMonths: 6, defaultYears: 5 },
  cards: [
    { icon: 'description', title: 'Download Amortization Schedule', text: 'Get the complete month-wise breakup of your loan repayment.', cta: 'Download Schedule', action: 'download' },
    { icon: 'share', title: 'Share Your Results', text: 'Share this calculation with your family or advisor.', cta: 'Share Calculator', action: 'share' },
  ],
  quote: { title: 'Need a Personalized Quote?', text: 'Our loan experts can help you with the best interest rates and offers.', cta: 'Talk to an Expert' },
  strip: [
    { icon: 'visibility', title: 'No Hidden Charges', text: 'Transparent Calculations' },
    { icon: 'compare_arrows', title: 'Compare Loan Options', text: 'Find the Best Offer' },
    { icon: 'support_agent', title: 'Expert Guidance', text: 'From Our Loan Specialists' },
    { icon: 'verified_user', title: 'Apply with Confidence', text: '100% Safe & Secure' },
  ],
  faqTitle: 'Frequently Asked Questions',
  faqSub: 'Quick answers to common questions about loan calculation.',
  faqs: [
    { q: 'What is EMI?', a: 'EMI (Equated Monthly Instalment) is the fixed amount you pay every month to repay a loan. It covers part of the principal and the interest for that month.', drafted: true },
    { q: 'Can I prepay my loan?', a: 'Many lenders allow part-payment or full prepayment, sometimes with charges. The terms depend on your lender and loan type, so confirm them before you proceed.', drafted: true },
    { q: 'What is a good interest rate?', a: 'A good rate is one that is competitive for your loan type and profile. Compare offers from several lenders and look at the total cost, not just the rate.', drafted: true },
    { q: 'How is the interest calculated?', a: 'On a reducing balance: each month interest is charged on the outstanding principal, and the EMI is worked out with the standard formula EMI = P × r × (1 + r)^n / ((1 + r)^n − 1).', drafted: true },
    { q: 'Does the EMI change with credit score?', a: 'Your EMI depends on the amount, rate and tenure. A stronger credit profile can help you qualify for a lower rate, which lowers the EMI.', drafted: true },
    { q: 'Can I get a lower interest rate?', a: 'Often yes — by improving your credit score, comparing lenders, choosing a suitable tenure or negotiating. Our experts can guide you.', drafted: true },
  ],
  help: { title: 'Still Have Questions?', text: 'Our experts are here to help you.' },
};

// ───────────────────────── Eligibility (05_Eligibility) ─────────────────────────
export const ELIG = {
  title: ['Check Your', 'Loan Eligibility'],
  sub: 'Take the first step towards your financial goals.',
  text: 'Find out which loans you are eligible for in just a few clicks. Get a personalized recommendation based on your profile, income and requirements.',
  script: 'Right Loan Brighter Tomorrow',
  checks: ['Right Guidance', 'Right Options', 'Right Future'],
  feats: [
    { icon: 'bolt', title: 'Quick & Easy', text: 'Check in 2 minutes' },
    { icon: 'verified_user', title: '100% Secure', text: 'Your data is safe' },
    { icon: 'person', title: 'Expert Guidance', text: 'Get best loan options' },
  ],
  card: { title: 'Check Your Eligibility', sub: 'Get personalized loan options in 2 minutes based on your profile.', badges: ['No Obligation', '100% Secure', 'Free Guidance'] },
  // Income bands are drafted: the design shows only "Select Income Range". `assumed` is the monthly figure the check uses.
  incomeBands: [
    { label: 'Below ₹25,000', assumed: 20000 },
    { label: '₹25,000 – ₹50,000', assumed: 25000 },
    { label: '₹50,000 – ₹1,00,000', assumed: 50000 },
    { label: '₹1,00,000 – ₹2,50,000', assumed: 100000 },
    { label: 'Above ₹2,50,000', assumed: 250000 },
  ],
  cities: ['Nagpur', 'Mumbai', 'Pune', 'Nashik', 'Aurangabad', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Other'],
  strip: [
    { icon: 'savings', value: '15+', label: 'Loan Products' },
    { icon: 'groups', value: '50,000+', label: 'Happy Customers' },
    { icon: 'account_balance', value: '25+', label: 'Banking Partners' },
    { icon: 'handshake', value: '90%', label: 'Approval Assistance' },
    { icon: 'public', value: 'Pan India', label: 'Service' },
  ],
  exploreTitle: 'Explore Your Loan Options',
  exploreSub: 'Check your eligibility for the loan that fits your needs.',
  explore: [
    { slug: 'personal-loan', name: 'Personal Loan', text: 'For your personal needs', icon: 'paid' },
    { slug: 'business-loan', name: 'Business Loan', text: 'For business growth', icon: 'domain' },
    { slug: 'home-loan', name: 'Home Loan', text: 'Your dream home', icon: 'home' },
    { slug: 'loan-against-property', name: 'Loan Against Property', text: 'Unlock property value', icon: 'apartment' },
    { slug: 'car-loan', name: 'Car Loan', text: 'Drive your dream', icon: 'directions_car' },
    { slug: 'education-loan', name: 'Education Loan', text: 'Invest in your future', icon: 'school' },
    { slug: 'stand-up-india', name: 'Stand-Up India Loan', text: 'Empower new enterprises', icon: 'trending_up' },
    { slug: 'project-funding', name: 'Project Funding', text: 'Fund your project', icon: 'engineering' },
    { slug: 'cgtmse-loan', name: 'CGTMSE Loan', text: 'Collateral-free credit', icon: 'verified_user' },
    { slug: 'pmegp-loan', name: 'PMEGP Loan', text: 'Start your enterprise', icon: 'rocket_launch' },
    { slug: 'mudra-loan', name: 'MUDRA Loan', text: 'Micro business funding', icon: 'storefront' },
  ],
  help: { title: 'Need Help Choosing?', text: 'Our loan experts will help you find the best option based on your profile and goals.', cta: 'Talk to Our Experts' },
  how: { title: 'How It Works?', sub: 'Get your loan eligibility in 4 simple steps.', steps: [['Fill Your Details', 'Basic information'], ['Check Eligibility', 'Get instant results'], ['Explore Options', 'Compare loan offers'], ['Talk to Expert', 'Get personalized guidance']] },
  why: { title: 'Why Choose Finoocean?', items: [['Multiple Loan Options', 'layers'], ['Trusted Advisors', 'person'], ['100% Confidential', 'lock'], ['Free Consultation', 'support_agent']] },
  band: { title: 'Your Financial Goals Are Within Reach.', text: 'Let Finoocean help you find the right loan, the right way.', cta: 'Check Your Eligibility Now', trust: ['Trusted by 50,000+ Customers', 'Rated 4.8/5 Across Platforms'] },
};

// ───────────────────────── FAQ (08_FAQ) ─────────────────────────
export const FAQ_PAGE = {
  title: ['Frequently Asked', 'Questions'],
  text: 'Find answers to common questions about our loan products, process, eligibility, documentation and more.',
  script: 'Clear Answers Brighter Financial Future',
  checks: ['Quick Answers', 'Easy Process', 'Expert Support', 'Your Financial Partner'],
  categories: [
    { key: 'general', label: 'General Questions', icon: 'forum' },
    { key: 'personal', label: 'Personal Loan', icon: 'person' },
    { key: 'business', label: 'Business Loan', icon: 'business' },
    { key: 'home', label: 'Home Loan', icon: 'home' },
    { key: 'lap', label: 'Loan Against Property', icon: 'apartment' },
    { key: 'car', label: 'Car Loan', icon: 'directions_car' },
    { key: 'education', label: 'Education Loan', icon: 'school' },
    { key: 'govt', label: 'Government Loans', icon: 'account_balance' },
  ],
  // Questions are from the design; answers are drafted (not shown in the design) and use only figures from the product pages.
  questions: [
    { cat: 'personal', q: 'What is the eligibility criteria for a personal loan?', a: 'Lenders usually look at your income, employment type, existing obligations and credit history. Use our Check Eligibility tool for an indicative result; the lender makes the final decision.', drafted: true },
    { cat: 'general', q: 'What documents are required to apply for a loan?', a: 'Typically identity proof, address proof, income proof and recent bank statements. Each loan page lists what is usually needed, and your advisor will confirm the exact list.', drafted: true },
    { cat: 'general', q: 'How long does it take to get loan approval?', a: 'It depends on the loan type, the completeness of your documents and the lender’s assessment. Your advisor will keep you updated at every step.', drafted: true },
    { cat: 'general', q: 'Can I apply for a loan online?', a: 'Yes. Create a free account, apply for the loan you need, upload your documents and track your application from your dashboard.', drafted: true },
    { cat: 'personal', q: 'What is the interest rate on personal loans?', a: 'Our Personal Loan page shows rates starting from 10.5% p.a. The rate you receive depends on the lender and your profile.', drafted: true },
    { cat: 'business', q: 'Do you provide loans for self-employed individuals?', a: 'Yes. Self-employed individuals and business owners can apply for loans such as the Business Loan, Loan Against Property and Home Loan.', drafted: true },
    { cat: 'business', q: 'What is the maximum loan amount I can get?', a: 'It varies by product — for example, Business Loan up to ₹5 Crore and Home Loan up to ₹10 Crore as shown on each loan page. The amount you qualify for depends on your profile and the lender.', drafted: true },
    { cat: 'lap', q: 'What is a Loan Against Property (LAP)?', a: 'A loan where you pledge a residential or commercial property you own as security, usually giving a higher amount at a lower rate than an unsecured loan.', drafted: true },
    { cat: 'govt', q: 'How does the PMEGP loan scheme work?', a: 'PMEGP is a government scheme that supports setting up new micro-enterprises, with a project-linked subsidy through banks. We help with the project report, documentation and the bank application.', drafted: true },
    { cat: 'general', q: 'Can I foreclose my loan before the tenure ends?', a: 'Many lenders allow foreclosure, sometimes with charges. Check the terms of your sanction letter or ask your advisor.', drafted: true },
  ],
  help: {
    title: 'Still Have Questions?',
    text: 'Our loan experts are here to help you with personalized answers.',
    script: 'We’re Always Here For You!',
    whatsapp: 'Get quick assistance',
  },
  ask: { title: 'Didn’t Find Your Answer?', text: 'Ask us directly. We’ll get back to you shortly.', cta: 'Ask Your Question' },
  strip: [
    { icon: 'verified_user', title: '100% Secure', text: 'Your data is safe' },
    { icon: 'groups', title: 'Expert Support', text: 'Get trusted advice' },
    { icon: 'schedule', title: 'Quick Response', text: 'We value your time' },
    { icon: 'thumb_up', title: 'Trusted by 50,000+', text: 'Happy Customers' },
  ],
};

// ───────────────────────── Contact (11_Contact) ─────────────────────────
export const CONTACT = {
  title: ['Get in Touch', 'with Finoocean'],
  text: 'We’re here to help you with the right loan solutions and expert financial guidance.',
  script: 'Your Goals Our Support Always',
  feats: [
    { icon: 'forum', title: 'Quick Response', text: 'Within 24 Hours' },
    { icon: 'groups', title: 'Expert Support', text: 'From Our Team' },
    { icon: 'verified_user', title: '100% Confidential', text: 'Your Data is Safe' },
    { icon: 'place', title: 'Pan India Service', text: 'We’re Always Near You' },
  ],
  formTitle: 'Send Us a Message',
  formSub: 'Fill in the details below and our team will get back to you shortly.',
  // Offered by the backend (SendContactMessageRequest::TYPES).
  types: ['General Inquiry', 'Personal Loan', 'Business Loan', 'Home Loan', 'Loan Against Property', 'Car Loan', 'Education Loan', 'Government Loans', 'Other'],
  officeTitle: 'Our Office Details',
  officeSub: 'Visit us, call us or drop an email anytime.',
  headOffice: 'Beside Godrej Anandam Word City, Kamptee Road, Model Mill, Nagpur, Maharashtra - 440018',
  hours: 'Monday - Saturday\n10:00 AM - 6:00 PM',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beside+Godrej+Anandam+Word+City+Kamptee+Road+Model+Mill+Nagpur+440018',
  strip: [
    { icon: 'groups', title: 'Talk to Loan Experts', text: 'Get personalized guidance' },
    { icon: 'description', title: 'Discuss Your Requirements', text: 'Find the best loan options' },
    { icon: 'headset_mic', title: 'Get a Free Consultation', text: 'No obligation, just expert advice' },
    { icon: 'rocket_launch', title: 'Start Your Financial Journey', text: 'Take a step towards your goals' },
  ],
  faqTitle: 'Frequently Asked Questions',
  faqSub: 'Quick answers to common questions about contacting us.',
  faqs: [
    { q: 'What are your working hours?', a: 'We are available Monday to Saturday, 10:00 AM – 6:00 PM.', drafted: false },
    { q: 'How soon will I get a response?', a: 'We aim to respond to messages within 24 hours.', drafted: false },
    { q: 'Can I schedule an in-person meeting?', a: 'Yes. Call us or send a message and our team will arrange a time at our Nagpur office.', drafted: true },
    { q: 'Do you provide support for all loan types?', a: 'Yes — Personal, Business, Home, Loan Against Property, Car, Education, Stand-Up India, Project Funding, CGTMSE, PMEGP and MUDRA loans.', drafted: false },
  ],
  assist: { title: 'Need Immediate Assistance?', text: 'Talk to our experts now.' },
};

// ───────────────────────── Testimonials (09_Testimonials) ─────────────────────────
export const TESTIMONIALS = {
  title: ['What Our', 'Customers Say'],
  sub: 'Real people. Real stories. Real progress.',
  text: 'Thousands of individuals and businesses have achieved their financial goals with Finoocean. Here are some of their success stories.',
  script: 'Your Success Our Inspiration',
  heroStats: [
    { icon: 'groups', value: '50,000+', label: 'Happy Customers' },
    { icon: 'star', value: '4.8/5', label: 'Average Rating' },
    { icon: 'verified_user', value: '95%', label: 'Customer Satisfaction' },
    { icon: 'groups', value: 'Trusted Across', label: 'Maharashtra' },
  ],
  tabs: [
    { key: 'all', label: 'All Testimonials' },
    { key: 'personal', label: 'Personal Loan' },
    { key: 'business', label: 'Business Loan' },
    { key: 'home', label: 'Home Loan' },
    { key: 'lap', label: 'Loan Against Property' },
    { key: 'car', label: 'Car Loan' },
    { key: 'education', label: 'Education Loan' },
    { key: 'govt', label: 'Government Loans' },
  ],
  // The design shows these as video cards. No video files exist yet, so they are shown as story cards (no play button).
  stories: [
    { cat: 'business', title: 'Got My Business Loan Easily', name: 'Amit Sharma', place: 'Nagpur, Maharashtra' },
    { cat: 'home', title: 'Home Loan Made Simple', name: 'Priya Deshmukh', place: 'Pune, Maharashtra' },
    { cat: 'education', title: 'Education Loan for My Dreams', name: 'Rahul Patil', place: 'Mumbai, Maharashtra' },
    { cat: 'car', title: 'Car Loan in Just 3 Days', name: 'Sneha More', place: 'Nashik, Maharashtra' },
  ],
  reviews: [
    { cat: 'personal', name: 'Sandeep Kale', place: 'Nagpur, Maharashtra', text: 'Finoocean helped me get a personal loan quickly with minimal documentation. Excellent support throughout the process!' },
    { cat: 'home', name: 'Neha Shah', place: 'Pune, Maharashtra', text: 'Very professional and transparent. I got my home loan approved at a great interest rate. Highly recommended!' },
    { cat: 'business', name: 'Vikram Jadhav', place: 'Aurangabad, Maharashtra', text: 'As a small business owner, Finoocean guided me to the right loan option. The team is knowledgeable and supportive.' },
    { cat: 'education', name: 'Priya Kulkarni', place: 'Mumbai, Maharashtra', text: 'The entire process was smooth and hassle-free. I got my education loan approved without any issues. Thank you Finoocean!' },
    { cat: 'personal', name: 'Rohit Verma', place: 'Nagpur, Maharashtra', text: 'Great experience! Quick approval and excellent customer service. Finoocean truly understands customer needs.' },
  ],
  strip: [
    { icon: 'groups', value: '50,000+', label: 'Happy Customers' },
    { icon: 'star', value: '4.8/5', label: 'Average Rating' },
    { icon: 'handshake', value: '90%+', label: 'Repeat & Referrals' },
    { icon: 'location_city', value: 'Serving 100+', label: 'Cities in Maharashtra' },
  ],
  band: { title: 'Be Our Next Success Story', text: 'Get the right loan. Achieve your dreams with Finoocean.', cta: 'Apply Now', feats: ['Fast Approval', 'Expert Guidance', '100% Secure'] },
};

// ───────────────────────── Blog (10_Blog) ─────────────────────────
export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  catKey: string;
  date: string;
  summary: string;
  icon: string;
  /** Only the first article's full text is in the designs. */
  full?: boolean;
}

export const BLOG = {
  title: 'News & Blog',
  sub: 'Financial Knowledge for a Brighter Tomorrow',
  text: 'Explore expert insights, loan guides, government schemes, financial tips and the latest updates to help you make smarter financial decisions.',
  scripts: ['Learn Plan Grow Succeed', 'Knowledge Today A Better Tomorrow'],
  tabs: [
    { key: 'all', label: 'All Posts' },
    { key: 'personal', label: 'Personal Loan' },
    { key: 'business', label: 'Business Loan' },
    { key: 'home', label: 'Home Loan' },
    { key: 'lap', label: 'LAP Loan' },
    { key: 'education', label: 'Education Loan' },
    { key: 'govt', label: 'Government Schemes' },
    { key: 'tips', label: 'Financial Tips' },
  ],
  posts: [
    { slug: 'personal-loan-vs-home-loan', title: 'Personal Loan vs Home Loan: Which One is Right for You?', category: 'Personal Loan', catKey: 'personal', date: '12 Jan 2026', summary: 'Understand the key differences, benefits and best use cases to choose the right loan for your financial goals.', icon: 'home', full: true },
    { slug: 'business-loan-approved-faster', title: '10 Tips to Get Your Business Loan Approved Faster', category: 'Business Loan', catKey: 'business', date: '10 Jan 2026', summary: 'Follow these expert tips to improve your loan eligibility and get quick approval for your business loan.', icon: 'business_center' },
    { slug: 'education-loan-2026-guide', title: 'Education Loan in 2026: A Complete Guide', category: 'Education Loan', catKey: 'education', date: '08 Jan 2026', summary: 'Know about eligibility, required documents, interest rates and how to apply for an education loan in India.', icon: 'school' },
    { slug: 'mudra-loan-scheme', title: 'MUDRA Loan Scheme: Benefits, Eligibility and How to Apply', category: 'Government Schemes', catKey: 'govt', date: '05 Jan 2026', summary: 'Benefits, eligibility and how to apply for the MUDRA loan scheme.', icon: 'storefront' },
    { slug: 'top-5-benefits-home-loan-2026', title: 'Top 5 Benefits of a Home Loan in 2026', category: 'Home Loan', catKey: 'home', date: '03 Jan 2026', summary: 'The top benefits of choosing a home loan in 2026.', icon: 'home' },
    { slug: 'documents-required-loan-application', title: 'Documents Required for a Loan Application', category: 'Loan Process', catKey: 'tips', date: '28 Dec 2025', summary: 'The documents you need to prepare for a loan application.', icon: 'description' },
    { slug: 'improve-cibil-score', title: 'How to Improve Your CIBIL Score for Better Loan Approval', category: 'Financial Tips', catKey: 'tips', date: '25 Dec 2025', summary: 'Ways to improve your CIBIL score for better loan approval.', icon: 'speed' },
  ] as BlogPost[],
  popular: ['mudra-loan-scheme', 'education-loan-2026-guide', 'top-5-benefits-home-loan-2026', 'personal-loan-vs-home-loan'],
  related: [
    { label: 'Personal Loan', link: '/services/personal-loan' }, { label: 'LAP Loan', link: '/services/loan-against-property' },
    { label: 'Business Loan', link: '/services/business-loan' }, { label: 'Car Loan', link: '/services/car-loan' },
    { label: 'Home Loan', link: '/services/home-loan' }, { label: 'Government Schemes', link: '/services/mudra-loan' },
    { label: 'Education Loan', link: '/services/education-loan' }, { label: 'Financial Advisory', link: '/contact' },
  ],
  newsletter: { title: 'Subscribe to Our Newsletter', text: 'Get the latest financial tips, government updates and loan offers directly in your inbox.' },
  band: { title: 'Knowledge Today. A Stronger Tomorrow.', text: 'Stay informed. Make better financial decisions with Finoocean.', cta: 'Explore More Articles' },
};

export const ARTICLE = {
  slug: 'personal-loan-vs-home-loan',
  author: 'Rohan Deshmukh',
  views: '5.4K Views',
  read: '8 Min Read',
  script: 'Right Loan Brighter Tomorrow',
  takeaways: [
    'Personal loans are unsecured and can be used for multiple purposes.',
    'Home loans are secured loans specifically for purchasing or constructing a property.',
    'Interest rates, tenure and eligibility criteria differ significantly.',
    'Choosing the right loan depends on your financial goals, repayment capacity and needs.',
  ],
  intro:
    'When it comes to achieving your financial goals, loans can be a great helping hand. However, with multiple options available, it’s important to understand which loan suits your needs. Two of the most common types of loans are personal loans and home loans. While both can help you fulfill important life goals, they serve different purposes and come with different features.',
  sections: [
    {
      title: '1. What is a Personal Loan?',
      text: 'A personal loan is an unsecured loan that you can use for a variety of purposes such as medical emergencies, higher education, wedding expenses, travel, debt consolidation and more. Since it does not require any collateral, the approval process is usually faster and simpler.',
      featuresTitle: 'Key Features of Personal Loan:',
      features: ['No collateral required', 'Quick approval', 'Flexible usage', 'Shorter repayment tenure (1 – 5 years)', 'Higher interest rates (typically 10% – 24%)'],
    },
    {
      title: '2. What is a Home Loan?',
      text: 'A home loan is a secured loan specifically designed for purchasing, constructing or renovating a residential property. The property itself acts as collateral, which makes home loans more affordable compared to personal loans. Home loans usually come with longer repayment tenures, making the monthly EMIs more manageable.',
      featuresTitle: 'Key Features of Home Loan:',
      features: ['Property acts as collateral', 'Lower interest rates (typically 8% – 10%)', 'Longer repayment tenure (up to 30 years)', 'Ideal for buying, building or renovating a home', 'Tax benefits under Section 80C and 24(b)'],
    },
  ],
  advice: { title: 'Need Expert Advice?', text: 'Our loan experts can help you choose the right loan based on your needs.' },
  band: { title: 'Still Confused?', text: 'Get personalized loan advice from our experts and take the right step towards your goals.', cta: 'Check Your Loan Eligibility' },
};

// ───────────────────────── Home extras (01_Home) ─────────────────────────
export const HOME_EXTRAS = {
  testimonial: {
    text: 'Finoocean made my home loan journey smooth and stress-free. Their team was supportive throughout the process.',
    name: 'Rahul Deshmukh',
    role: 'Home Loan Customer',
    stars: 5,
  },
  insights: [
    { title: 'RBI New Loan Rules 2026: What It Means for Borrowers', date: 'May 18, 2026' },
    { title: 'Best Mortgage Loan Options for First-Time Homebuyers', date: 'March 6, 2026' },
  ],
  partnersTitle: 'Our Banking & Financial Partners',
  partners: [
    { name: 'SBI', logo: 'sbi.png' },
    { name: 'HDFC Bank', logo: 'hdfc-bank.png' },
    { name: 'ICICI Bank', logo: 'icici-bank.png' },
    { name: 'Axis Bank', logo: 'axis-bank.png' },
    { name: 'Kotak Mahindra Bank', logo: 'kotak-mahindra-bank.png' },
    { name: 'Bank of Baroda', logo: 'bank-of-baroda.png' },
    { name: 'PNB', logo: 'pnb.png' },
    { name: 'LIC', logo: 'lic.png' },
  ],
};

// ───────────────────────── Login / Register (07_Login_Register) ─────────────────────────
export const AUTH_PAGE = {
  title: ['Welcome to', 'Finoocean'],
  text: 'Login or create your account to apply for loans, track your applications, manage your profile and get exclusive offers — all in one place.',
  checks: ['Apply for multiple loan types', 'Track application status', 'Manage documents securely', 'Get personalized offers', 'Dedicated support from our team'],
  script: 'Your Financial Journey Starts Here',
  feats: [
    { icon: 'verified_user', title: '100% Secure', text: 'Your data is safe with us' },
    { icon: 'lock', title: 'Confidential', text: 'We respect your privacy' },
    { icon: 'support_agent', title: 'Expert Support', text: 'Always here to help' },
  ],
  login: { title: 'Login to Your Account', text: 'Access your dashboard and continue your financial journey.' },
  register: { title: 'Create Your Account', text: 'It’s quick, easy and free. Get started in just a few steps.' },
  why: {
    title: 'Why Create a Finoocean Account?',
    text: 'Get a smarter, faster and more personalized loan experience.',
    items: [
      { icon: 'track_changes', title: 'Track Applications', text: 'Check real-time status' },
      { icon: 'upload_file', title: 'Upload Documents', text: 'Secure & easy upload' },
      { icon: 'local_offer', title: 'Get Better Offers', text: 'Personalized for you' },
      { icon: 'manage_accounts', title: 'Manage Profile', text: 'Update anytime' },
    ],
  },
};
