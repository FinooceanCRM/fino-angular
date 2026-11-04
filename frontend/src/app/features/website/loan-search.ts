import { PRODUCT_PAGES, ProductPage } from './product-pages.data';

/** Everyday words people type for each loan, on top of the loan's own name and text. */
const KEYWORDS: Record<string, string> = {
  'personal-loan': 'personal wedding marriage medical travel holiday vacation emergency instant cash salary renovation debt consolidation',
  'business-loan': 'business shop store trade msme sme working capital expansion startup self employed merchant inventory machinery',
  'home-loan': 'home house flat apartment property buy construction plot purchase housing mortgage dream',
  'loan-against-property': 'lap mortgage property against collateral plot land commercial office shop secured',
  'car-loan': 'car vehicle auto automobile four wheeler new used bike two wheeler suv',
  'education-loan': 'education student study studies college university abroad course fees tuition school masters degree',
  'stand-up-india': 'standup stand up women woman sc st entrepreneur greenfield first time government scheme',
  'project-funding': 'project funding infrastructure industrial plant factory construction capex term loan',
  'cgtmse-loan': 'cgtmse cgtmse collateral free guarantee credit guarantee msme without security government scheme',
  'pmegp-loan': 'pmegp prime minister employment generation subsidy kvic margin money rural enterprise government scheme',
  'mudra-loan': 'mudra shishu kishor tarun micro small business tiny government scheme pmmy',
};

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

/** Searchable text for one product: name, texts, and its everyday keywords. */
function haystack(p: ProductPage): string {
  return norm([p.name, p.cardText, p.tagline, p.description, KEYWORDS[p.slug] ?? ''].join(' '));
}

/**
 * Keyword search over the loan products. Every word the user types must appear somewhere in a
 * product (partial words work: "educ" finds Education Loan). Empty text returns everything.
 * Name matches rank first.
 */
export function searchProducts(term: string, products: readonly ProductPage[] = PRODUCT_PAGES): ProductPage[] {
  const words = norm(term).split(/\s+/).filter(Boolean);
  if (!words.length) return [...products];
  const scored = products
    .map((p) => {
      const hay = haystack(p);
      if (!words.every((w) => hay.includes(w))) return null;
      const name = norm(p.name);
      return { p, score: words.filter((w) => name.includes(w)).length };
    })
    .filter((x): x is { p: ProductPage; score: number } => x !== null);
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}
