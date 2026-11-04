/**
 * Business-owned website content that is not served by the API.
 *
 * Contact details below come from the approved design mockups — confirm them
 * with the business before launch. Nothing here is a rate, offer, partner or
 * performance claim.
 */
export const WEBSITE = {
  brand: 'FINOOCEAN',
  tagline: 'Your trusted financial partner',
  phone: '+91 7776 000353',
  phoneHref: 'tel:+917776000353',
  whatsappHref: 'https://wa.me/917776000353',
  email: 'contact@finoocean.com',
  hours: 'Mon – Sat · 10:00 AM – 6:00 PM',
  address: 'Nagpur, Maharashtra',
  legalName: 'Das Aanandam Financial Services Private Limited',
};

/**
 * Header navigation. The "More Services" dropdown is rendered right after
 * "Services" (see website-layout) — it has no page of its own, only the
 * items in MORE_SERVICES below.
 */
export const MAIN_NAV = [
  { label: 'Home', link: '/', exact: true },
  { label: 'About Us', link: '/about', exact: false },
  { label: 'Services', link: '/services', exact: false },
  // "More Services" (dropdown) is inserted here by the layout.
  { label: 'News', link: '/blog', exact: false },
  { label: 'Contact Us', link: '/contact', exact: false },
];

export const MORE_SERVICES = [
  { label: 'EMI Calculator', link: '/calculator', icon: 'calculate', hint: 'Estimate your monthly instalment' },
  { label: 'Check Eligibility', link: '/eligibility', icon: 'fact_check', hint: 'Indicative result in a minute' },
  { label: 'FAQs', link: '/faq', icon: 'help_outline', hint: 'Answers to common questions' },
  { label: 'Testimonials', link: '/testimonials', icon: 'reviews', hint: 'Stories from our customers' },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What does FINOOCEAN do?',
    a: 'We are a loan facilitator. We help you compare options across lending partners, prepare your documents and follow your application through to the lender’s decision. We do not lend money ourselves.',
  },
  {
    q: 'Is the eligibility check a loan approval?',
    a: 'No. It is an indicative estimate based on the details you enter and simple assumptions. Only the lender can approve a loan, after assessing your documents and credit profile.',
  },
  {
    q: 'Do I need an account to check eligibility?',
    a: 'No. The eligibility check and EMI calculator are open to everyone and nothing is saved. To apply for a loan you create a free account, so your application, documents and progress all live in one dashboard.',
  },
  {
    q: 'What happens after I apply?',
    a: 'A FINOOCEAN advisor will call you to understand your requirement and explain your options. You can then upload documents and track your application from your dashboard.',
  },
  {
    q: 'Which documents will I need?',
    a: 'It depends on the product, but typically identity proof, address proof, income proof and recent bank statements. Each product page lists what is usually required.',
  },
  {
    q: 'Are the EMI figures exact?',
    a: 'The calculator uses the standard EMI formula with the rate and tenure you enter. Actual rates, charges and repayment terms are set by the lender and may differ.',
  },
  {
    q: 'Is there a fee to apply through FINOOCEAN?',
    a: 'Checking eligibility and creating an account are free. Please confirm any charges with your advisor and the lender before you proceed.',
  },
  {
    q: 'How is my information used?',
    a: 'Your details are used to contact you about your request and to process your application with lenders you choose to proceed with. See our Privacy Policy for details.',
  },
];

export const HOW_IT_WORKS = [
  { icon: 'edit_note', title: 'Share your requirement', text: 'Tell us the loan you need and a few details.' },
  { icon: 'call', title: 'Talk to an advisor', text: 'We call you to understand your needs and explain options.' },
  { icon: 'fact_check', title: 'Submit documents', text: 'Upload documents securely from your account.' },
  { icon: 'track_changes', title: 'Track progress', text: 'Follow your application until the lender’s decision.' },
];

export const WHY_US = [
  { icon: 'support_agent', title: 'Expert guidance', text: 'A dedicated advisor walks you through every step.' },
  { icon: 'hub', title: 'Multiple lenders', text: 'We work with several banks and financial institutions.' },
  { icon: 'visibility', title: 'Transparent process', text: 'Clear communication and status updates as things move.' },
  { icon: 'headset_mic', title: 'Ongoing support', text: 'Help available from first inquiry to final decision.' },
];

/** Tenure options shown in the quick eligibility box (years). */
export const TENURE_YEARS = [1, 2, 3, 4, 5, 7, 10, 15, 20, 30];

/**
 * About page content, taken word-for-word from the approved design
 * (images/02_About.png). The figures are company claims supplied by the
 * business — confirm they are current and substantiated before launch.
 */
export const ABOUT = {
  heroSubtitle: 'Empowering Financial Growth with Trust and Transparency',
  heroText:
    'At Finoocean, we believe financial empowerment can create a brighter, more secure future for every individual and business. We are committed to making your financial journey simple, transparent and stress-free.',
  heroQuote: 'Better Finances Brighter Futures',
  whoText:
    'Finoocean is a brand of Das Aanandam Financial Services Private Limited, based in Nagpur, Maharashtra. We specialize in providing smart, secure and reliable financial solutions to individuals and businesses. Our goal is to make access to loans, banking services and financial advisory simple, transparent and hassle-free.',
  features: [
    { icon: 'groups', title: 'Individual & Business Solutions' },
    { icon: 'verified_user', title: 'Transparent Process' },
    { icon: 'headset_mic', title: 'Expert Guidance' },
    { icon: 'trending_up', title: 'Long-Term Financial Growth' },
  ],
  stats: [
    { icon: 'groups', value: '8,900+', label: 'Happy Customers' },
    { icon: 'description', value: '₹90 Crore+', label: 'Loans Disbursed' },
    { icon: 'account_balance', value: '20+', label: 'Banking & NBFC Partners' },
    { icon: 'workspace_premium', value: '99%', label: 'Customer Satisfaction' },
  ],
  buildTitle: 'Building Financially Stronger India',
  buildText: 'We are on a mission to make financial freedom accessible to every individual and business across India.',
  mission: 'To provide easy, reliable and personalized financial solutions that help individuals and businesses achieve their dreams.',
  vision: 'To be India’s most trusted financial platform, known for integrity, innovation and customer-centricity.',
  values: [
    ['Trust', 'Transparency', 'Customer First'],
    ['Innovation', 'Social Responsibility'],
  ],
  leader: {
    quote:
      'Our focus has always been to put our customers first. At Finoocean, we don’t just provide loans — we create opportunities for a better and brighter future.',
    name: 'Sumedh Ghutke',
    role: 'Director',
  },
};
