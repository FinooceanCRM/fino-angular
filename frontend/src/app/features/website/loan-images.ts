/** Loan artwork cropped from the design references (public/images/all), keyed by product slug. */
const FILES: Record<string, string> = {
  'personal-loan': 'personal_loan',
  'business-loan': 'business_loan',
  'home-loan': 'home_loan',
  'loan-against-property': 'lap_loan',
  'car-loan': 'car_loan',
  'education-loan': 'education_loan',
  'stand-up-india': 'standup_loan',
  'project-funding': 'project_loan',
  'cgtmse-loan': 'cgtmse_loan',
  'pmegp-loan': 'pmegp_loan',
  'mudra-loan': 'mudra_loan',
};

const BASE = '/images/all/';

/** Small coloured icon (~40px) for a product, or null when there is none. */
export function loanIcon(slug: string): string | null {
  return FILES[slug] ? `${BASE}icon_${FILES[slug]}.png` : null;
}

/** Larger square illustration (~72–100px) for a product, or null when there is none. */
export function loanSquare(slug: string): string | null {
  return FILES[slug] ? `${BASE}square_${FILES[slug]}.png` : null;
}

export const IMG = {
  expert: `${BASE}square_expert_woman.png`,
  businessExpert: `${BASE}square_business_expert_woman.png`,
  avatar: `${BASE}square_customer_avatar.png`,
  blogThumbs: [`${BASE}square_blog_thumb_1.png`, `${BASE}square_blog_thumb_2.png`],
};

const BLOG_FILES: Record<string, string> = {
  'personal-loan-vs-home-loan': 'personal_vs_home',
  'business-loan-approved-faster': 'business_plan',
  'education-loan-2026-guide': 'education_loan',
  'mudra-loan-scheme': 'mudra_scheme',
  'top-5-benefits-home-loan-2026': 'home_loan_benefits',
  'documents-required-loan-application': 'loan_documents',
  'improve-cibil-score': 'cibil_score',
};

/** Wide article image (~180–260px) for a blog post, or null when there is none. */
export function blogImage(slug: string): string | null {
  return BLOG_FILES[slug] ? `${BASE}blog_${BLOG_FILES[slug]}.png` : null;
}

/** Square article thumbnail (56–102px) for a blog post, or null when there is none. */
export function blogThumb(slug: string): string | null {
  return BLOG_FILES[slug] ? `${BASE}square_blog_${BLOG_FILES[slug]}.png` : null;
}

export const BLOG_BANNERS = {
  hero: '/images/blog/banner_blog_house_coins.png',
  cta: '/images/blog/banner_blog_cta_sunrise.png',
};
