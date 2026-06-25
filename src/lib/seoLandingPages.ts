import type { PhoneCard, PriceDropRadarItem } from '@/types'

export type SeoLandingIntent =
  | 'brand'
  | 'commercial'
  | 'comparison'
  | 'deal'
  | 'informational'
  | 'use-case'

export type SeoLandingKind =
  | 'battery'
  | 'best-overall'
  | 'brand'
  | 'budget'
  | 'buyer-safety'
  | 'camera'
  | 'compare-prices'
  | 'content'
  | 'deal-radar'
  | 'fast-charging'
  | 'gaming'
  | 'intelligence'
  | 'jiji'
  | 'student'
  | 'store-comparison'
  | 'store-jumia'
  | 'store-slot'
  | 'used'

export type SeoLandingPriority = 'high' | 'medium' | 'low'

export interface SeoLandingFaq {
  question: string
  answer: string
}

export interface SeoLandingRelatedLink {
  href: string
  label: string
}

export interface SeoLandingPageConfig {
  slug: string
  kind: SeoLandingKind
  priority: SeoLandingPriority
  intent: SeoLandingIntent
  title: string
  h1: string
  description: string
  intro: string
  searchVariants: string[]
  maxPrice?: number
  minPrice?: number
  store?: 'jumia' | 'slot'
  brandNames?: string[]
  modelKeywords?: string[]
  pageSize: number
  ranking: {
    value: number
    performance: number
    camera: number
    battery: number
    price: number
    freshness: number
  }
  bestForLabels: string[]
  whyThisPageExists: string
  pickingMethod: string[]
  requiredDataFields: string[]
  sections: string[]
  faq: SeoLandingFaq[]
  relatedLinks: SeoLandingRelatedLink[]
}

const NAIRA = '\u20A6'

const DEFAULT_SECTIONS = [
  'Live price snapshot',
  'Ranked phone cards',
  'Comparison table',
  'Why these phones were picked',
  'Buy-or-wait guidance',
  'Related Decide pages',
  'FAQ',
  'Decide does not sell phones directly disclaimer',
]

const COMMON_REQUIRED_DATA = [
  'phone name and brand',
  'current Jumia and Slot prices where available',
  'price freshness',
  'battery, camera, performance, build, and value scores',
  'RAM, storage, battery, camera, 5G, NFC, and refresh-rate specs',
  'phone detail and compare links',
]

const COMMON_FAQ: SeoLandingFaq[] = [
  {
    question: 'Does Decide sell phones directly?',
    answer:
      'No. Decide is a phone-buying intelligence platform. We help you compare phones, prices, market movement, and buying risks before you leave for Jumia, Slot, Jiji, or another seller.',
  },
  {
    question: 'Are the prices on Decide guaranteed?',
    answer:
      'No phone price is guaranteed until you verify the seller or store. Decide tracks Nigerian price signals and freshness so you know what to check before paying.',
  },
]

const budgetFaq = (budgetLabel: string): SeoLandingFaq[] => [
  {
    question: `What should I check before buying a phone under ${budgetLabel}?`,
    answer:
      'Check battery life, RAM/storage, software support, current store freshness, and whether the price looks stable or recently dropped. A cheap phone can still be the wrong buy if support or performance is weak.',
  },
  {
    question: `Can I find good Android phones under ${budgetLabel} in Nigeria?`,
    answer:
      'Yes, but the best pick depends on what matters most: camera, battery, gaming, storage, or long-term support. Decide ranks phones with live Nigerian prices and decision signals instead of price alone.',
  },
]

const useCaseFaq = (useCase: string): SeoLandingFaq[] => [
  {
    question: `What matters most for ${useCase} phones in Nigeria?`,
    answer:
      'Do not judge by one spec alone. Check current price, battery, performance, camera quality where relevant, RAM/storage, software support, and whether the phone is still a sensible buy today.',
  },
  {
    question: `Should I buy a used phone for ${useCase}?`,
    answer:
      'Used can make sense only after careful checks. Verify IMEI, battery health, screen, cameras, charging, network, biometrics, repair history, proof of ownership, and the price gap versus safer alternatives.',
  },
]

const baseRelatedLinks: SeoLandingRelatedLink[] = [
  { href: '/compare', label: 'Compare phones' },
  { href: '/deals/today', label: "Today's phone deals" },
  { href: '/phones', label: 'Browse all phones' },
  { href: '/used/checker', label: 'Used phone checker' },
]

export const SEO_LANDING_PAGES: SeoLandingPageConfig[] = [
  {
    slug: 'phone-buying-intelligence-nigeria',
    kind: 'intelligence',
    priority: 'high',
    intent: 'brand',
    title: "Phone Buying Intelligence in Nigeria - Compare Before You Buy | Decide",
    h1: "Phone buying intelligence in Nigeria",
    description:
      'Use Decide to compare Nigerian phone prices, live drops, buy-or-wait verdicts, Jiji marketplace context, and safer buying guidance before you pay.',
    intro:
      'Decide is built for the moment before you spend money on a phone in Nigeria: when prices are moving, listings differ by store, Jiji looks tempting, and you need a clearer answer than another static spec sheet.',
    searchVariants: [
      'phone buying intelligence Nigeria',
      'Decide phone buying intelligence',
      'phone buying guide Nigeria',
      'best phone decision app Nigeria',
      'compare phones before buying Nigeria',
    ],
    pageSize: 12,
    ranking: { value: 3, performance: 1, camera: 1, battery: 1, price: 2, freshness: 1 },
    bestForLabels: ['buy-or-wait', 'price intelligence', 'market context'],
    whyThisPageExists:
      'This page gives Google and buyers a clear explanation of what Decide is: not a phone store, but a Nigerian decision engine for phone buying.',
    pickingMethod: [
      'Surface phones with strong Decide value scores and current Nigerian price data.',
      'Prefer models that can lead users into detail, compare, verdict, and deal flows.',
      'Keep Jiji and used-market guidance separate from trusted retail price claims.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What makes Decide different from a phone shop?',
        answer:
          'A shop wants you to buy from it. Decide helps you decide what to buy, whether to buy now, and where to verify the price before paying an external seller.',
      },
    ],
    relatedLinks: [
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices in Nigeria' },
      { href: '/best-phones-in-nigeria', label: 'Best phones in Nigeria' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'compare-phone-prices-nigeria',
    kind: 'compare-prices',
    priority: 'high',
    intent: 'comparison',
    title: 'Compare Phone Prices in Nigeria - Jumia, Slot, Deals & Verdicts | Decide',
    h1: 'Compare phone prices in Nigeria',
    description:
      'Compare Nigerian phone prices across tracked stores, see freshness signals, price drops, and Decide verdicts before buying from Jumia, Slot, Jiji, or elsewhere.',
    intro:
      'Phone prices in Nigeria can shift quickly and the cheapest listing is not always the safest choice. Decide compares price context, freshness, and phone quality so you can make a cleaner buying call.',
    searchVariants: [
      'compare phone prices Nigeria',
      'compare phones Nigeria',
      'Jumia Slot phone prices',
      'phone price comparison Nigeria',
      'Decide compare phones',
    ],
    pageSize: 16,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 3, freshness: 2 },
    bestForLabels: ['price comparison', 'store freshness', 'shortlist decisions'],
    whyThisPageExists:
      'This is the canonical page for people searching for phone price comparison in Nigeria, and it should funnel them into Decide detail, compare, and price-history pages.',
    pickingMethod: [
      'Prioritize phones with current tracked Jumia or Slot prices.',
      'Show store labels and freshness without implying Decide is the seller.',
      'Use internal links to move buyers into detail and head-to-head compare flows.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Can I compare Jumia and Slot prices on Decide?',
        answer:
          'Decide tracks current Jumia and Slot price signals where available, then shows freshness and phone context so you can recheck the external listing before paying.',
      },
    ],
    relatedLinks: [
      { href: '/phone-buying-intelligence-nigeria', label: 'Phone buying intelligence' },
      { href: '/phone-price-drops-nigeria', label: 'Phone price drops' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-in-nigeria',
    kind: 'best-overall',
    priority: 'high',
    intent: 'commercial',
    title: 'Best Phones in Nigeria - Live Prices, Verdicts & Comparisons | Decide',
    h1: 'Best phones in Nigeria',
    description:
      'Compare the best phones in Nigeria with live prices, value scores, battery, camera, performance, buy-or-wait verdicts, and safer buying context.',
    intro:
      'The best phone in Nigeria is not just the most popular model. It is the phone that fits your budget, has trustworthy current pricing, and still makes sense after battery, camera, performance, support, and resale context are checked.',
    searchVariants: [
      'best phones in Nigeria',
      'best phone to buy in Nigeria',
      'best Android phones in Nigeria',
      'best smartphones in Nigeria',
      'which phone should I buy in Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['overall value', 'balanced picks', 'phone shortlist'],
    whyThisPageExists:
      'This is the broad commercial hub for buyers who know they need a phone but have not yet narrowed to budget, brand, store, or use case.',
    pickingMethod: [
      'Start from phones with strong Decide value and balanced core scores.',
      'Keep live Nigerian price context visible.',
      'Link each serious candidate into detail, verdict, compare, and price history.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What is the best phone to buy in Nigeria right now?',
        answer:
          'It depends on your budget and priorities. Decide ranks phones with current price context, value, camera, battery, performance, and buying-timing signals so you can choose a phone that fits your actual use.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-under-200000-naira-nigeria', label: `Best phones under ${NAIRA}200k` },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      { href: '/best-camera-phones-in-nigeria', label: 'Best camera phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-under-200000-naira-nigeria',
    kind: 'budget',
    priority: 'high',
    intent: 'commercial',
    title: `Best Phones Under ${NAIRA}200,000 in Nigeria - Live Prices & Verdicts | Decide`,
    h1: `Best phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare the best phones under ₦200,000 in Nigeria with live Jumia and Slot prices, price-drop signals, buy-or-wait verdicts, and safer buying guidance.',
    intro:
      `The ${NAIRA}200,000 range is where many Nigerian buyers want a phone that feels serious without crossing into premium pricing. Decide ranks this lane with live price context, not blog-post guesses.`,
    searchVariants: [
      'best phones under 200k in Nigeria',
      'best phones below 200k in Nigeria',
      'best android phone under 200000 Nigeria',
      'phones under 200k on Jumia',
      'best budget smartphones under 200k Nigeria',
    ],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 2, camera: 2, battery: 2, price: 2, freshness: 1 },
    bestForLabels: ['budget', 'value', 'daily use'],
    whyThisPageExists:
      'This is the first high-intent budget pillar because Nigerian buyers frequently search around 200k using several spellings and formats.',
    pickingMethod: [
      `Only consider phones with a current tracked price under ${NAIRA}200,000 where possible.`,
      'Prefer strong all-round value over one flashy spec.',
      'Show related camera, gaming, battery, and lower/higher budget paths.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-phones-under-150000-naira-nigeria', label: `Best phones under ${NAIRA}150k` },
      { href: '/best-phones-under-300000-naira-nigeria', label: `Best phones under ${NAIRA}300k` },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-under-150000-naira-nigeria',
    kind: 'budget',
    priority: 'high',
    intent: 'commercial',
    title: `Best Phones Under ${NAIRA}150,000 in Nigeria - Budget Picks & Prices | Decide`,
    h1: `Best phones under ${NAIRA}150,000 in Nigeria`,
    description:
      'Find strong budget phones under ₦150,000 in Nigeria with tracked prices, battery, camera, performance scores, and Decide verdicts before you buy.',
    intro:
      `Under ${NAIRA}150,000, every compromise matters. Decide helps you see which phones still have enough battery, storage, speed, and store-price context to deserve a closer look.`,
    searchVariants: [
      'best phones under 150k in Nigeria',
      'best phone below 150000 Nigeria',
      'cheap android phones in Nigeria',
      'budget phones under 150k Nigeria',
      'best Tecno Infinix phone under 150k',
    ],
    maxPrice: 150_000,
    pageSize: 16,
    ranking: { value: 3, performance: 1, camera: 1, battery: 3, price: 3, freshness: 1 },
    bestForLabels: ['tight budget', 'battery', 'basic daily use'],
    whyThisPageExists:
      'This page captures lower-budget search demand while staying honest about tradeoffs and current Nigerian price reality.',
    pickingMethod: [
      `Filter toward phones under ${NAIRA}150,000 with current tracked prices.`,
      'Reward battery, value, and practical daily-use specs.',
      'Warn buyers not to treat the cheapest listing as an automatic buy signal.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}150,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-phones-under-200000-naira-nigeria', label: `Best phones under ${NAIRA}200k` },
      { href: '/best-battery-phones-in-nigeria', label: 'Best battery phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-under-300000-naira-nigeria',
    kind: 'budget',
    priority: 'high',
    intent: 'commercial',
    title: `Best Phones Under ${NAIRA}300,000 in Nigeria - Compare Live Prices | Decide`,
    h1: `Best phones under ${NAIRA}300,000 in Nigeria`,
    description:
      'Compare the best phones under ₦300,000 in Nigeria using live prices, store freshness, value scores, ownership signals, and buy-or-wait guidance.',
    intro:
      `The ${NAIRA}300,000 range is where buyers start expecting better cameras, smoother displays, stronger gaming, and longer ownership confidence. Decide keeps the live market in the same view as the spec sheet.`,
    searchVariants: [
      'best phones under 300k in Nigeria',
      'best android phones under 300000 Nigeria',
      'best gaming phone under 300k Nigeria',
      'best camera phone under 300k Nigeria',
      'phones below 300k Nigeria',
    ],
    maxPrice: 300_000,
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['midrange', 'gaming', 'camera'],
    whyThisPageExists:
      'This page catches buyers stepping above entry budget and helps them compare better all-rounders before moving to store listings.',
    pickingMethod: [
      `Filter toward phones under ${NAIRA}300,000 with current Nigerian price context.`,
      'Reward balanced long-term value, performance, camera, and support.',
      'Link to stricter 150k/200k pages so buyers can move down if prices feel too high.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}300,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-phones-under-200000-naira-nigeria', label: `Best phones under ${NAIRA}200k` },
      { href: '/best-camera-phones-in-nigeria', label: 'Best camera phones' },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-gaming-phones-in-nigeria',
    kind: 'gaming',
    priority: 'high',
    intent: 'use-case',
    title: 'Best Gaming Phones in Nigeria - Performance, Battery & Prices | Decide',
    h1: 'Best gaming phones in Nigeria',
    description:
      'Compare gaming phones in Nigeria by performance, refresh rate, battery, charging, live prices, and Decide buy-or-wait verdicts.',
    intro:
      'A good gaming phone in Nigeria needs more than a big RAM number. Decide looks at performance, battery, refresh rate, charging, price, and whether the phone still makes sense to buy now.',
    searchVariants: [
      'best gaming phones in Nigeria',
      'cheap gaming phones in Nigeria',
      'best phones for PUBG in Nigeria',
      'best phones for COD Mobile in Nigeria',
      'gaming phones in Nigeria for sale',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 3, camera: 0, battery: 3, price: 1, freshness: 1 },
    bestForLabels: ['gaming', 'performance', 'battery'],
    whyThisPageExists:
      'Gaming intent is high-value because buyers care about real performance and are likely to compare before paying.',
    pickingMethod: [
      'Reward performance score, RAM, refresh rate, battery, and charging.',
      'Keep current Nigerian price context visible.',
      'Do not over-rank weak phones just because they use gaming wording in tags.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What matters most in a gaming phone?',
        answer:
          'Performance, battery, heat management, refresh rate, RAM/storage, and current price matter together. Decide uses these signals to avoid ranking a phone just because it has one attractive spec.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-under-200000-naira-nigeria', label: `Best phones under ${NAIRA}200k` },
      { href: '/best-battery-phones-in-nigeria', label: 'Best battery phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-camera-phones-in-nigeria',
    kind: 'camera',
    priority: 'high',
    intent: 'use-case',
    title: 'Best Camera Phones in Nigeria and Prices | Decide',
    h1: 'Best camera phones in Nigeria',
    description:
      'Find camera phones in Nigeria for photos, video, selfies, and content creation with live prices, camera scores, and safer buying guidance.',
    intro:
      'Camera phone searches are often full of foreign rankings that ignore Nigerian prices. Decide keeps the camera question tied to local availability, current prices, and whether the phone is still worth buying.',
    searchVariants: [
      'best camera phones in Nigeria',
      'best camera phone in Nigeria and prices',
      'best camera phone in Nigeria Jumia',
      'affordable Android phones with the best camera in Nigeria',
      'best phones for content creation in Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 3, battery: 1, price: 1, freshness: 1 },
    bestForLabels: ['camera', 'content creation', 'video'],
    whyThisPageExists:
      'Camera intent is one of the strongest non-budget phone-buying intents, especially for content creators and social buyers.',
    pickingMethod: [
      'Reward camera score, main camera strength, video capability, and overall value.',
      'Show current Nigerian prices so camera picks stay commercially useful.',
      'Link into detail pages where fuller camera/spec context can live.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Is megapixel count enough to choose a camera phone?',
        answer:
          'No. Megapixels help, but processing, stabilization, video quality, selfie camera, chipset, and price all matter. Decide uses camera score and buying context together.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-under-300000-naira-nigeria', label: `Best phones under ${NAIRA}300k` },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-battery-phones-in-nigeria',
    kind: 'battery',
    priority: 'high',
    intent: 'use-case',
    title: 'Best Battery Phones in Nigeria - Strong Battery & Live Prices | Decide',
    h1: 'Best battery phones in Nigeria',
    description:
      'Compare Nigerian phones with strong battery life, large mAh capacity, fast charging, live prices, and long-term ownership signals.',
    intro:
      'For many Nigerian buyers, battery is not a nice-to-have. It is the difference between a phone that survives the day and one that becomes stressful. Decide ranks strong-battery phones with price and value still in view.',
    searchVariants: [
      'best battery phones in Nigeria',
      'phones with strong battery in Nigeria',
      'best 6000mAh battery phones in Nigeria',
      'best fast charging phones in Nigeria',
      'phone with strong battery and good camera Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 0, battery: 3, price: 1, freshness: 1 },
    bestForLabels: ['battery', 'students', 'daily use'],
    whyThisPageExists:
      'Battery intent is broad and durable in Nigeria, and Decide can add value by connecting battery claims to real price and ownership context.',
    pickingMethod: [
      'Reward battery score, mAh capacity, charging speed where available, and value.',
      'Keep strong battery picks connected to current price data.',
      'Warn buyers that large mAh alone is not the whole buying decision.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Is a 6000mAh phone always better?',
        answer:
          'Not always. Battery size matters, but efficiency, charging speed, screen, chipset, and software support also affect the experience. Decide balances those signals with price.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-under-150000-naira-nigeria', label: `Best phones under ${NAIRA}150k` },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'phone-price-drops-nigeria',
    kind: 'deal-radar',
    priority: 'high',
    intent: 'deal',
    title: 'Phone Price Drops in Nigeria Today - Live Market Radar | Decide',
    h1: 'Phone price drops in Nigeria',
    description:
      'Track live Nigerian phone price drops across Jumia and Slot, compare current deals, and use Decide buy-or-wait guidance before you buy.',
    intro:
      'Phone price drops can be real opportunities, but they can also be stale, variant-specific, or not worth the compromise. Decide turns current price movement into a safer buying shortlist.',
    searchVariants: [
      'phone price drops in Nigeria',
      'phones with price drops today in Nigeria',
      'live phone deals in Nigeria',
      'best phone deals this week Nigeria',
      'buy or wait phone price Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 1, performance: 1, camera: 1, battery: 1, price: 3, freshness: 3 },
    bestForLabels: ['price drops', 'deals', 'buy or wait'],
    whyThisPageExists:
      'This page should be a natural organic doorway into Decide because live price movement is one of the product advantages static blogs cannot match.',
    pickingMethod: [
      'Use the live price-drop radar where possible.',
      'Prioritize fresh, meaningful drops and keep store labels visible.',
      'Push users into buy-or-wait and compare before external store exits.',
    ],
    requiredDataFields: [
      ...COMMON_REQUIRED_DATA,
      'current price drop amount',
      'previous price',
      'deal store',
      'deal freshness',
    ],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Should I buy immediately when a phone price drops?',
        answer:
          'Not automatically. A drop is only one signal. Check the phone quality, price freshness, store context, and whether a better alternative is also moving before paying.',
      },
    ],
    relatedLinks: [
      { href: '/deals', label: 'Live deals radar' },
      { href: '/deals/today', label: "Today's shortlist" },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'jumia-phone-prices-nigeria',
    kind: 'store-jumia',
    priority: 'high',
    intent: 'commercial',
    title: 'Jumia Phone Prices in Nigeria - Compare Before You Buy | Decide',
    h1: 'Jumia phone prices in Nigeria',
    description:
      'Compare phones with tracked Jumia Nigeria prices, Slot alternatives, freshness signals, price drops, and Decide verdicts before you buy.',
    intro:
      'Jumia is often one of the first places Nigerian buyers check for phone prices, but a listing still needs context. Decide shows tracked Jumia signals beside phone quality, price freshness, and safer next steps.',
    searchVariants: [
      'Jumia phone prices in Nigeria',
      'Jumia phones Nigeria',
      'phone prices on Jumia Nigeria',
      'Jumia Android phone prices',
      'Jumia phone deals Nigeria',
    ],
    store: 'jumia',
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 3, freshness: 3 },
    bestForLabels: ['Jumia', 'price check', 'store freshness'],
    whyThisPageExists:
      'This page targets buyers who start with Jumia price searches but still need Decide context before paying an external seller.',
    pickingMethod: [
      'Prioritize phones with current tracked Jumia price signals.',
      'Show whether the wider market or Slot may deserve a cross-check.',
      'Keep Decide positioned as price intelligence, not the merchant.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Jumia current price and freshness'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Does Decide sell the Jumia phones shown here?',
        answer:
          'No. Decide tracks Jumia price signals where available and links buyers back into comparison, detail, and verdict pages before they verify the final external listing.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-on-jumia-nigeria', label: 'Best phones on Jumia Nigeria' },
      { href: '/jumia-vs-slot-phone-prices-nigeria', label: 'Jumia vs Slot phone prices' },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-on-jumia-nigeria',
    kind: 'store-jumia',
    priority: 'high',
    intent: 'commercial',
    title: 'Best Phones on Jumia Nigeria - Compare Before You Buy | Decide',
    h1: 'Best phones on Jumia Nigeria',
    description:
      'Find strong phones with tracked Jumia Nigeria prices, compare alternatives, check freshness, and use Decide verdicts before leaving for the store.',
    intro:
      'The best phone on Jumia is not always the cheapest visible listing. Decide filters Jumia-tracked candidates through price freshness, value, battery, camera, performance, and buy-or-wait context.',
    searchVariants: [
      'best phones on Jumia Nigeria',
      'best Jumia phones Nigeria',
      'phones to buy on Jumia Nigeria',
      'Jumia best phone deals',
      'best Android phones on Jumia',
    ],
    store: 'jumia',
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 2, price: 2, freshness: 3 },
    bestForLabels: ['Jumia', 'best picks', 'buying verdict'],
    whyThisPageExists:
      'This page captures store-first buyers and pulls them back into Decide-owned comparison before they click out.',
    pickingMethod: [
      'Require or strongly prefer a current Jumia price signal.',
      'Rank Jumia-tracked phones by value and balanced quality.',
      'Show related Slot, price-drop, and comparison pages for safer checking.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Jumia current price and freshness'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'How should I use this page before buying on Jumia?',
        answer:
          'Use Decide to compare the phone, check freshness, open the verdict, and then verify the exact Jumia seller, variant, price, warranty, and delivery terms before paying.',
      },
    ],
    relatedLinks: [
      { href: '/jumia-phone-prices-nigeria', label: 'Jumia phone prices' },
      { href: '/phone-price-drops-nigeria', label: 'Phone price drops' },
      { href: '/best-phones-in-nigeria', label: 'Best phones in Nigeria' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'slot-phone-prices-nigeria',
    kind: 'store-slot',
    priority: 'medium',
    intent: 'commercial',
    title: 'Slot Phone Prices in Nigeria - Compare Current Prices | Decide',
    h1: 'Slot phone prices in Nigeria',
    description:
      'Compare tracked Slot Nigeria phone prices with Jumia alternatives, freshness signals, phone scores, and Decide verdicts before you buy.',
    intro:
      'Slot is a familiar phone-buying route for many Nigerians, but price, variant, and availability still need checking. Decide gives Slot price context beside broader market signals.',
    searchVariants: [
      'Slot phone prices in Nigeria',
      'Slot Nigeria phone prices',
      'phones at Slot Nigeria',
      'Slot Android phone prices',
      'Slot vs Jumia phone prices',
    ],
    store: 'slot',
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 3, freshness: 3 },
    bestForLabels: ['Slot', 'price check', 'store freshness'],
    whyThisPageExists:
      'This page gives Slot-intent buyers a Decide-owned comparison route instead of sending them straight to one store context.',
    pickingMethod: [
      'Prioritize phones with current tracked Slot price signals.',
      'Keep Jumia and wider market alternatives close.',
      'Route buyers into compare and phone detail before store verification.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Slot current price and freshness'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Are Slot prices on Decide final?',
        answer:
          'No. Decide tracks Slot price signals where available. Always verify the exact variant, store availability, warranty, and final price with Slot before paying.',
      },
    ],
    relatedLinks: [
      { href: '/jumia-vs-slot-phone-prices-nigeria', label: 'Jumia vs Slot phone prices' },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      { href: '/phone-price-drops-nigeria', label: 'Phone price drops' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'jiji-used-phones-nigeria',
    kind: 'jiji',
    priority: 'high',
    intent: 'commercial',
    title: 'Jiji Used Phones in Nigeria - Price Context & Safety Checks | Decide',
    h1: 'Jiji used phones in Nigeria',
    description:
      'Use Decide to read Jiji used-phone price context, risk labels, safe buying checks, and alternatives before paying a marketplace seller.',
    intro:
      'Jiji can surface tempting used-phone prices, but marketplace buying needs extra caution. Decide treats Jiji as context and risk guidance, not trusted retail pricing.',
    searchVariants: [
      'Jiji used phones in Nigeria',
      'Jiji phones in Nigeria',
      'used phones on Jiji Nigeria',
      'Jiji iPhone prices Nigeria',
      'cheap used phones Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 1, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['Jiji context', 'used phones', 'safety checks'],
    whyThisPageExists:
      'This page captures used-market demand while making Decide’s safety-first role clear before a buyer pays a marketplace seller.',
    pickingMethod: [
      'Prefer phones with Jiji marketplace context or strong used-phone relevance.',
      'Keep trusted retail prices separate from marketplace leads.',
      'Emphasize inspection, IMEI, battery health, seller verification, and compare alternatives.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Jiji marketplace signal count'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Is it safe to buy used phones on Jiji?',
        answer:
          'It can be safe only if you verify the seller and inspect the exact device before paying. Check IMEI, battery, screen, charging, cameras, SIM status, biometrics, and proof of ownership.',
      },
    ],
    relatedLinks: [
      { href: '/jiji-phones-in-nigeria', label: 'Jiji phones in Nigeria' },
      { href: '/best-used-phones-to-buy-in-nigeria', label: 'Best used phones to buy' },
      { href: '/safest-places-to-buy-phones-in-nigeria', label: 'Safest places to buy phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'jiji-phones-in-nigeria',
    kind: 'jiji',
    priority: 'high',
    intent: 'commercial',
    title: 'Jiji Phones in Nigeria - Marketplace Context Before You Pay | Decide',
    h1: 'Jiji phones in Nigeria',
    description:
      'Check Jiji phone marketplace context in Nigeria with Decide risk guidance, trusted-price comparisons, used-phone checks, and safer next steps.',
    intro:
      'A Jiji phone listing can look like a bargain until the device, seller, condition, and price context are checked. Decide helps you use Jiji as a signal without treating every lead as safe.',
    searchVariants: [
      'Jiji phones in Nigeria',
      'phones for sale on Jiji Nigeria',
      'Jiji phone prices',
      'Jiji cheap phones Nigeria',
      'Jiji used iPhone Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 1, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['Jiji', 'marketplace leads', 'risk context'],
    whyThisPageExists:
      'This page gives broad Jiji-phone searchers a safer Decide context before they contact a marketplace seller.',
    pickingMethod: [
      'Prefer models with marketplace signals or useful used-phone context.',
      'Separate Jiji leads from trusted Jumia/Slot price data.',
      'Push users toward detail pages and used-phone checks before payment.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Jiji marketplace signal count'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'How should I compare a Jiji phone price?',
        answer:
          'Compare it against trusted Jumia or Slot prices where available, then adjust for condition, battery health, repair risk, warranty, and seller trust before paying.',
      },
    ],
    relatedLinks: [
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      { href: '/where-to-buy-phones-in-nigeria', label: 'Where to buy phones' },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-used-phones-to-buy-in-nigeria',
    kind: 'used',
    priority: 'high',
    intent: 'commercial',
    title: 'Best Used Phones to Buy in Nigeria - Checks, Prices & Risks | Decide',
    h1: 'Best used phones to buy in Nigeria',
    description:
      'Compare used-phone candidates in Nigeria with Decide value signals, Jiji context, safety checks, support risks, and alternatives before buying.',
    intro:
      'The best used phone is not simply the cheapest older flagship. Decide helps you weigh price, age, support, repair reality, seller risk, and safer alternatives before paying.',
    searchVariants: [
      'best used phones to buy in Nigeria',
      'best second hand phones Nigeria',
      'best used iPhone Nigeria',
      'used phones to buy in Nigeria',
      'used Android phones Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 3, performance: 1, camera: 1, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['used phones', 'value', 'risk check'],
    whyThisPageExists:
      'Used-phone searches are high-intent but risky. This page turns them into a safer Decide flow instead of a blind marketplace jump.',
    pickingMethod: [
      'Prefer phones with strong value and enough support/repair confidence.',
      'Treat marketplace signals as context, not verified offers.',
      'Push buyers to used-phone guides and phone detail pages before paying.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What should I inspect before buying a used phone?',
        answer:
          'Check IMEI, battery health, screen, cameras, charging, SIM/network status, Face ID or fingerprint, repair history, proof of ownership, and seller identity before paying.',
      },
    ],
    relatedLinks: [
      { href: '/used/checker', label: 'Used phone checker' },
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      { href: '/safest-places-to-buy-phones-in-nigeria', label: 'Safe buying guide' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'where-to-buy-phones-in-nigeria',
    kind: 'buyer-safety',
    priority: 'high',
    intent: 'informational',
    title: 'Where to Buy Phones in Nigeria - Jumia, Slot, Jiji & Safer Checks | Decide',
    h1: 'Where to buy phones in Nigeria',
    description:
      'Compare places to buy phones in Nigeria, including Jumia, Slot, Jiji, and offline sellers, with Decide safety checks before you pay.',
    intro:
      'Where you buy a phone in Nigeria matters almost as much as the phone itself. Decide helps you compare store routes, marketplace caution, price context, and the checks to run before payment.',
    searchVariants: [
      'where to buy phones in Nigeria',
      'best place to buy phones in Nigeria',
      'buy phones in Nigeria',
      'Jumia Slot Jiji phones',
      'where can I buy phone in Nigeria',
    ],
    pageSize: 12,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 2, freshness: 1 },
    bestForLabels: ['buying guide', 'store choice', 'safety'],
    whyThisPageExists:
      'This page targets buyers who are deciding where to buy, then pulls them into Decide’s compare-before-you-pay flow.',
    pickingMethod: [
      'Explain the difference between trusted retail checks and marketplace leads.',
      'Use phone examples to keep the page commercially useful.',
      'Keep Decide clearly positioned as guidance, not a merchant.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What is the safest place to buy a phone in Nigeria?',
        answer:
          'There is no single safest place for every buyer. Trusted stores can still vary by variant and price, while marketplaces require inspection and seller verification. Decide helps you check before paying.',
      },
    ],
    relatedLinks: [
      { href: '/safest-places-to-buy-phones-in-nigeria', label: 'Safest places to buy phones' },
      { href: '/jumia-phone-prices-nigeria', label: 'Jumia phone prices' },
      { href: '/slot-phone-prices-nigeria', label: 'Slot phone prices' },
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'safest-places-to-buy-phones-in-nigeria',
    kind: 'buyer-safety',
    priority: 'high',
    intent: 'informational',
    title: 'Safest Places to Buy Phones in Nigeria - Checks Before You Pay | Decide',
    h1: 'Safest places to buy phones in Nigeria',
    description:
      'Learn safer ways to buy phones in Nigeria with Decide checks for Jumia, Slot, Jiji, used phones, seller risk, price freshness, and verification.',
    intro:
      'Safe phone buying in Nigeria is about verification, not blind trust. Decide helps you compare price signals, seller routes, used-phone risks, and the checks that reduce expensive mistakes.',
    searchVariants: [
      'safest places to buy phones in Nigeria',
      'safe place to buy phone Nigeria',
      'how to buy phone safely in Nigeria',
      'safe used phone buying Nigeria',
      'avoid fake phones Nigeria',
    ],
    pageSize: 12,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 1, freshness: 1 },
    bestForLabels: ['safety', 'verification', 'used-phone checks'],
    whyThisPageExists:
      'This page captures safety-first buyers and helps Decide own the trust layer around Nigerian phone purchases.',
    pickingMethod: [
      'Explain safe buying checks alongside real phone examples.',
      'Separate retail price checking from marketplace inspection risk.',
      'Link users into used-phone checker, compare, and price pages.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'How do I avoid buying a bad or fake phone?',
        answer:
          'Verify IMEI, inspect the physical device, test charging/cameras/network/biometrics, confirm variant and warranty, avoid rushed payment, and compare the price against trusted market context.',
      },
    ],
    relatedLinks: [
      { href: '/where-to-buy-phones-in-nigeria', label: 'Where to buy phones' },
      { href: '/used/checker', label: 'Used phone checker' },
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'jumia-vs-slot-phone-prices-nigeria',
    kind: 'store-comparison',
    priority: 'medium',
    intent: 'comparison',
    title: 'Jumia vs Slot Phone Prices in Nigeria - Compare Before You Buy | Decide',
    h1: 'Jumia vs Slot phone prices in Nigeria',
    description:
      'Compare Jumia and Slot phone price context in Nigeria with Decide freshness signals, alternatives, and buy-or-wait guidance before you pay.',
    intro:
      'Jumia and Slot can show different phone prices, variants, availability, and buying conditions. Decide helps you compare the signal before treating one listing as the final answer.',
    searchVariants: [
      'Jumia vs Slot phone prices',
      'Jumia or Slot for phones',
      'compare Jumia and Slot phone prices',
      'Slot vs Jumia phones Nigeria',
      'where is phone cheaper Jumia or Slot',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 1, battery: 1, price: 3, freshness: 3 },
    bestForLabels: ['Jumia vs Slot', 'price comparison', 'store freshness'],
    whyThisPageExists:
      'This page captures comparison searches between two major buying routes and keeps the buyer inside Decide’s decision loop first.',
    pickingMethod: [
      'Prefer phones with more than one tracked store signal.',
      'Highlight that price differences can reflect variant, stock, seller, or freshness.',
      'Push users to phone detail and price history before choosing a store.',
    ],
    requiredDataFields: [...COMMON_REQUIRED_DATA, 'Jumia and Slot price presence'],
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Is Jumia always cheaper than Slot?',
        answer:
          'No. Prices can change by day, variant, stock, seller, delivery, and warranty context. Decide helps you compare the current tracked signal before you verify externally.',
      },
    ],
    relatedLinks: [
      { href: '/jumia-phone-prices-nigeria', label: 'Jumia phone prices' },
      { href: '/slot-phone-prices-nigeria', label: 'Slot phone prices' },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-samsung-phones-in-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'brand',
    title: 'Best Samsung Phones in Nigeria - Prices, Verdicts & Comparisons | Decide',
    h1: 'Best Samsung phones in Nigeria',
    description:
      'Compare the best Samsung phones in Nigeria with live prices, value scores, battery, camera, support signals, and Decide verdicts before you buy.',
    intro:
      'Samsung searches usually start from brand trust, but the right Galaxy model still depends on price, variant, support runway, camera, battery, and whether a nearby alternative gives better value.',
    searchVariants: [
      'best Samsung phones in Nigeria',
      'Samsung phones and prices in Nigeria',
      'best Galaxy phone Nigeria',
      'Samsung Android phones Nigeria',
      'which Samsung phone should I buy Nigeria',
    ],
    brandNames: ['samsung'],
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['Samsung', 'Galaxy', 'brand picks'],
    whyThisPageExists:
      'This page captures buyers who already trust Samsung and need Decide to sort the lineup by current price and decision quality.',
    pickingMethod: [
      'Filter to Samsung/Galaxy models in the live catalog.',
      'Rank by value, camera, battery, performance, and current Nigerian price context.',
      'Link into phone detail, compare, and buy-or-wait before any external store move.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Which Samsung phone is best in Nigeria?',
        answer:
          'It depends on your budget and whether you care most about camera, battery, performance, or long software support. Decide ranks Samsung models with current Nigerian price context.',
      },
    ],
    relatedLinks: [
      { href: '/best-samsung-phones-under-200000-naira-nigeria', label: 'Samsung phones under N200k' },
      { href: '/compare-phone-prices-nigeria', label: 'Compare phone prices' },
      { href: '/best-phones-in-nigeria', label: 'Best phones in Nigeria' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-tecno-phones-in-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'brand',
    title: 'Best Tecno Phones in Nigeria - Live Prices & Buying Verdicts | Decide',
    h1: 'Best Tecno phones in Nigeria',
    description:
      'Compare the best Tecno phones in Nigeria with live prices, battery, camera, gaming, value scores, and Decide buy-or-wait guidance.',
    intro:
      'Tecno is one of Nigeria’s strongest everyday-phone brands, but the best pick changes by budget, series, store price, battery, camera, and performance needs.',
    searchVariants: [
      'best Tecno phones in Nigeria',
      'Tecno phones and prices in Nigeria',
      'best Tecno phone to buy',
      'Tecno Spark Camon Pova prices Nigeria',
      'best Tecno Android phone Nigeria',
    ],
    brandNames: ['tecno'],
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 3, price: 2, freshness: 1 },
    bestForLabels: ['Tecno', 'budget', 'battery'],
    whyThisPageExists:
      'This page captures Tecno-first buyers and helps them compare Spark, Camon, Pova, and Phantom lanes with current price context.',
    pickingMethod: [
      'Filter to Tecno models in the live catalog.',
      'Reward value, battery, camera, and performance based on the buying lane.',
      'Keep store freshness and buy-or-wait context visible before payment.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Which Tecno series should I consider?',
        answer:
          'Spark often fits tighter budgets, Camon leans camera, Pova leans battery/performance, and Phantom is premium. Decide compares the actual models and prices.',
      },
    ],
    relatedLinks: [
      { href: '/best-phones-under-150000-naira-nigeria', label: 'Phones under N150k' },
      { href: '/best-battery-phones-in-nigeria', label: 'Best battery phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-infinix-phones-in-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'brand',
    title: 'Best Infinix Phones in Nigeria - Live Prices & Verdicts | Decide',
    h1: 'Best Infinix phones in Nigeria',
    description:
      'Compare the best Infinix phones in Nigeria with live prices, gaming, battery, camera, value scores, and Decide verdicts before buying.',
    intro:
      'Infinix buyers often compare Note, Hot, Smart, Zero, and GT models across very different budgets. Decide keeps the lineup tied to live price and real buying context.',
    searchVariants: [
      'best Infinix phones in Nigeria',
      'Infinix phones and prices in Nigeria',
      'best Infinix phone to buy',
      'Infinix gaming phones Nigeria',
      'Infinix Note Hot prices Nigeria',
    ],
    brandNames: ['infinix'],
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 3, price: 2, freshness: 1 },
    bestForLabels: ['Infinix', 'value', 'battery'],
    whyThisPageExists:
      'This page captures Infinix-first buyers and helps them compare the lineup without relying on static price posts.',
    pickingMethod: [
      'Filter to Infinix models in the live catalog.',
      'Reward value, battery, gaming/performance, and current price strength.',
      'Link into price history and buy-or-wait for serious finalists.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Which Infinix phone is best for value?',
        answer:
          'The best Infinix value pick depends on your budget and whether you need gaming, camera, battery, or storage first. Decide ranks current catalog options with live price context.',
      },
    ],
    relatedLinks: [
      { href: '/best-infinix-phones-under-200000-naira-nigeria', label: 'Infinix phones under N200k' },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-redmi-xiaomi-phones-in-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'brand',
    title: 'Best Redmi and Xiaomi Phones in Nigeria - Prices & Verdicts | Decide',
    h1: 'Best Redmi and Xiaomi phones in Nigeria',
    description:
      'Compare the best Redmi, Xiaomi, and Poco phones in Nigeria with live prices, performance, camera, battery, and Decide verdicts.',
    intro:
      'Redmi and Xiaomi searches can be confusing because model names, variants, and store listings shift quickly. Decide keeps the lineup tied to current Nigerian price and buying context.',
    searchVariants: [
      'best Redmi phones in Nigeria',
      'best Xiaomi phones in Nigeria',
      'Redmi phones and prices in Nigeria',
      'Xiaomi phones and prices Nigeria',
      'best Poco phones Nigeria',
    ],
    brandNames: ['xiaomi', 'redmi', 'poco'],
    modelKeywords: ['redmi', 'xiaomi', 'poco'],
    pageSize: 18,
    ranking: { value: 3, performance: 3, camera: 2, battery: 2, price: 2, freshness: 1 },
    bestForLabels: ['Redmi', 'Xiaomi', 'performance value'],
    whyThisPageExists:
      'This page captures Xiaomi/Redmi buyers and prevents model/variant confusion from pushing them straight to scattered store listings.',
    pickingMethod: [
      'Match Xiaomi, Redmi, and Poco catalog entries.',
      'Reward value, performance, battery, and current price strength.',
      'Keep Jumia/Slot freshness and comparison links close.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'Are Redmi and Xiaomi the same brand?',
        answer:
          'Redmi is a Xiaomi phone family. Many Nigerian buyers search both names, so Decide groups relevant Redmi, Xiaomi, and Poco models where it helps comparison.',
      },
    ],
    relatedLinks: [
      { href: '/best-redmi-phones-under-200000-naira-nigeria', label: 'Redmi phones under N200k' },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-iphones-in-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'brand',
    title: 'Best iPhones in Nigeria - Prices, Used Risk & Buying Verdicts | Decide',
    h1: 'Best iPhones in Nigeria',
    description:
      'Compare the best iPhones in Nigeria with live price context, used-phone risk checks, support signals, and Decide verdicts before you buy.',
    intro:
      'iPhone buying in Nigeria is especially sensitive to storage, battery health, region, repair history, and used-market condition. Decide helps you compare models before paying.',
    searchVariants: [
      'best iPhones in Nigeria',
      'iPhone prices in Nigeria',
      'best used iPhone Nigeria',
      'which iPhone should I buy Nigeria',
      'iPhones under 500k Nigeria',
    ],
    brandNames: ['apple', 'iphone'],
    modelKeywords: ['iphone'],
    pageSize: 18,
    ranking: { value: 3, performance: 2, camera: 2, battery: 1, price: 1, freshness: 1 },
    bestForLabels: ['iPhone', 'used risk', 'support'],
    whyThisPageExists:
      'This page captures high-value iPhone searches while adding the used-phone and support context Nigerian buyers need.',
    pickingMethod: [
      'Match active iPhone/Apple catalog models.',
      'Reward value, support runway, camera, and performance relative to price.',
      'Keep used-phone caution visible because many iPhone buys happen outside trusted retail.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...COMMON_FAQ,
      {
        question: 'What should I check before buying an iPhone in Nigeria?',
        answer:
          'Check storage, battery health, Face ID, True Tone, SIM/region status, repair history, iCloud lock, warranty, and whether the price makes sense against newer or safer alternatives.',
      },
    ],
    relatedLinks: [
      { href: '/best-iphones-under-500000-naira-nigeria', label: 'iPhones under N500k' },
      { href: '/best-used-phones-to-buy-in-nigeria', label: 'Best used phones' },
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-redmi-phones-under-200000-naira-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'commercial',
    title: `Best Redmi Phones Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best Redmi phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare Redmi and Xiaomi phones under N200,000 in Nigeria with live prices, battery, performance, value scores, and Decide verdicts.',
    intro:
      `Redmi is a major search lane around ${NAIRA}200,000 because buyers expect strong specs for the money. Decide filters the options by live price, value, and practical buying context.`,
    searchVariants: [
      'best Redmi phones under 200k in Nigeria',
      'best Xiaomi phones under 200k Nigeria',
      'Redmi phones below 200000 Nigeria',
      'Redmi phone price under 200k',
      'best Redmi budget phone Nigeria',
    ],
    brandNames: ['xiaomi', 'redmi', 'poco'],
    modelKeywords: ['redmi', 'xiaomi', 'poco'],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 3, camera: 1, battery: 2, price: 3, freshness: 1 },
    bestForLabels: ['Redmi', 'under N200k', 'value'],
    whyThisPageExists:
      'This page captures brand-plus-budget intent for buyers who already want Redmi/Xiaomi value under 200k.',
    pickingMethod: [
      `Match Redmi/Xiaomi/Poco models with current tracked prices under ${NAIRA}200,000.`,
      'Reward value, performance, battery, and store freshness.',
      'Link to broader Redmi/Xiaomi and under-200k pages for comparison.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-redmi-xiaomi-phones-in-nigeria', label: 'Best Redmi/Xiaomi phones' },
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-infinix-phones-under-200000-naira-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'commercial',
    title: `Best Infinix Phones Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best Infinix phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare Infinix phones under N200,000 in Nigeria with live prices, battery, gaming, camera, value scores, and Decide verdicts.',
    intro:
      `Infinix has several strong budget and midrange options around ${NAIRA}200,000. Decide ranks them with current price context instead of only listing model names.`,
    searchVariants: [
      'best Infinix phones under 200k in Nigeria',
      'Infinix phones below 200000 Nigeria',
      'best Infinix budget phone Nigeria',
      'Infinix phone price under 200k',
      'best Infinix gaming phone under 200k',
    ],
    brandNames: ['infinix'],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 2, camera: 1, battery: 3, price: 3, freshness: 1 },
    bestForLabels: ['Infinix', 'under N200k', 'battery'],
    whyThisPageExists:
      'This page captures Infinix buyers with a clear 200k ceiling and points them into price/detail/verdict pages.',
    pickingMethod: [
      `Filter Infinix models with current tracked prices under ${NAIRA}200,000.`,
      'Reward value, battery, and performance for everyday Nigerian use.',
      'Keep related budget and gaming pages close.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-infinix-phones-in-nigeria', label: 'Best Infinix phones' },
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-samsung-phones-under-200000-naira-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'commercial',
    title: `Best Samsung Phones Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best Samsung phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare Samsung phones under N200,000 in Nigeria with live prices, battery, camera, support signals, and Decide buying verdicts.',
    intro:
      `Samsung phones under ${NAIRA}200,000 can be strong daily picks, but the right choice depends on the exact Galaxy model, current price, support runway, and competing alternatives.`,
    searchVariants: [
      'best Samsung phones under 200k in Nigeria',
      'Samsung phones below 200000 Nigeria',
      'Samsung phone price under 200k',
      'best Galaxy phone under 200k Nigeria',
      'Samsung budget phones Nigeria',
    ],
    brandNames: ['samsung'],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 1, camera: 2, battery: 2, price: 3, freshness: 1 },
    bestForLabels: ['Samsung', 'under N200k', 'Galaxy'],
    whyThisPageExists:
      'This page captures Samsung buyers who want a trusted brand while staying under a strong Nigerian budget ceiling.',
    pickingMethod: [
      `Filter Samsung/Galaxy models with current tracked prices under ${NAIRA}200,000.`,
      'Reward value, support, battery, and camera strength.',
      'Link into broader Samsung and all-budget pages for tradeoff checking.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-samsung-phones-in-nigeria', label: 'Best Samsung phones' },
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-iphones-under-500000-naira-nigeria',
    kind: 'brand',
    priority: 'high',
    intent: 'commercial',
    title: `Best iPhones Under ${NAIRA}500,000 in Nigeria | Decide`,
    h1: `Best iPhones under ${NAIRA}500,000 in Nigeria`,
    description:
      'Compare iPhones under N500,000 in Nigeria with price context, used-phone risk checks, support runway, and Decide verdicts before you buy.',
    intro:
      `Under ${NAIRA}500,000, many iPhone decisions involve older or used models. Decide helps you compare price, support, battery-health risk, and safer alternatives before paying.`,
    searchVariants: [
      'best iPhones under 500k in Nigeria',
      'iPhones below 500000 Nigeria',
      'best used iPhone under 500k Nigeria',
      'iPhone price under 500k Nigeria',
      'which iPhone should I buy under 500k',
    ],
    brandNames: ['apple', 'iphone'],
    modelKeywords: ['iphone'],
    maxPrice: 500_000,
    pageSize: 16,
    ranking: { value: 3, performance: 2, camera: 2, battery: 1, price: 3, freshness: 1 },
    bestForLabels: ['iPhone', 'under N500k', 'used risk'],
    whyThisPageExists:
      'This page captures iPhone buyers with a realistic Nigerian budget ceiling and keeps used-market caution visible.',
    pickingMethod: [
      `Match iPhone/Apple models with current tracked prices under ${NAIRA}500,000 where possible.`,
      'Reward value, support, camera, and performance relative to age.',
      'Keep used-phone and Jiji risk checks close before payment.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [
      ...budgetFaq(`${NAIRA}500,000`),
      ...COMMON_FAQ,
      {
        question: 'Should I buy a used iPhone under N500k?',
        answer:
          'Only after checking battery health, Face ID, iCloud lock, SIM status, repair history, storage, region, and whether the price is fair versus safer alternatives.',
      },
    ],
    relatedLinks: [
      { href: '/best-iphones-in-nigeria', label: 'Best iPhones in Nigeria' },
      { href: '/best-used-phones-to-buy-in-nigeria', label: 'Best used phones' },
      { href: '/jiji-used-phones-nigeria', label: 'Jiji used phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-gaming-phones-under-200000-naira-nigeria',
    kind: 'gaming',
    priority: 'high',
    intent: 'commercial',
    title: `Best Gaming Phones Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best gaming phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare gaming phones under N200,000 in Nigeria with live prices, performance, RAM, refresh-rate, battery, and Decide buy-or-wait verdicts.',
    intro:
      `Gaming under ${NAIRA}200,000 is where Nigerian buyers need tradeoff clarity. Decide filters phones by current price, performance, battery, RAM, refresh-rate, and value so you do not buy a spec headline that disappoints.`,
    searchVariants: [
      'best gaming phones under 200k in Nigeria',
      'gaming phones below 200000 Nigeria',
      'cheap gaming phones in Nigeria',
      'best phone for PUBG under 200k Nigeria',
      'best phone for COD Mobile under 200k Nigeria',
    ],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 3, camera: 0, battery: 3, price: 3, freshness: 1 },
    bestForLabels: ['gaming', 'under N200k', 'performance'],
    whyThisPageExists:
      'This page captures one of the strongest budget-plus-use-case searches and adds live price context that static gaming-phone posts usually miss.',
    pickingMethod: [
      `Filter phones with current tracked prices under ${NAIRA}200,000.`,
      'Reward performance score, RAM, refresh rate, battery, and value.',
      'Link to broader gaming, Redmi/Infinix, and under-200k pages for nearby options.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...useCaseFaq('gaming'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      { href: '/best-gaming-phones-under-300000-naira-nigeria', label: 'Gaming phones under N300k' },
      { href: '/best-redmi-phones-under-200000-naira-nigeria', label: 'Redmi phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-gaming-phones-under-300000-naira-nigeria',
    kind: 'gaming',
    priority: 'high',
    intent: 'commercial',
    title: `Best Gaming Phones Under ${NAIRA}300,000 in Nigeria | Decide`,
    h1: `Best gaming phones under ${NAIRA}300,000 in Nigeria`,
    description:
      'Compare gaming phones under N300,000 in Nigeria with live prices, performance, battery, RAM, display, and Decide verdicts before you buy.',
    intro:
      `Around ${NAIRA}300,000, gaming buyers can usually get stronger RAM, smoother screens, and better thermal headroom. Decide ranks options with current Nigerian price context and buy-or-wait signals.`,
    searchVariants: [
      'best gaming phones under 300k in Nigeria',
      'gaming phones below 300000 Nigeria',
      'best Android gaming phone under 300k Nigeria',
      'best phone for eFootball under 300k Nigeria',
      'best gaming phone price Nigeria',
    ],
    maxPrice: 300_000,
    pageSize: 16,
    ranking: { value: 3, performance: 3, camera: 0, battery: 3, price: 2, freshness: 1 },
    bestForLabels: ['gaming', 'under N300k', 'smooth display'],
    whyThisPageExists:
      'This page expands the gaming lane into a higher budget where Decide can show buyers whether spending extra is actually justified.',
    pickingMethod: [
      `Filter phones with current tracked prices under ${NAIRA}300,000.`,
      'Reward performance, RAM, refresh rate, battery, and value relative to price.',
      'Keep cheaper N200k gaming options linked for buyers who can save money.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}300,000`), ...useCaseFaq('gaming'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      { href: '/best-gaming-phones-under-200000-naira-nigeria', label: 'Gaming phones under N200k' },
      { href: '/best-phones-under-300000-naira-nigeria', label: 'All phones under N300k' },
      { href: '/best-redmi-xiaomi-phones-in-nigeria', label: 'Best Redmi/Xiaomi phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-camera-phones-under-200000-naira-nigeria',
    kind: 'camera',
    priority: 'high',
    intent: 'commercial',
    title: `Best Camera Phones Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best camera phones under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare camera phones under N200,000 in Nigeria with live prices, camera scores, selfie/video context, battery, and Decide verdicts.',
    intro:
      `Camera phones under ${NAIRA}200,000 can look similar on paper, but photo quality, video stability, selfie output, battery, and price freshness separate the better buys from the noisy listings.`,
    searchVariants: [
      'best camera phones under 200k in Nigeria',
      'best camera phone below 200000 Nigeria',
      'affordable Android phones with best camera Nigeria',
      'best phone for pictures under 200k Nigeria',
      'best selfie camera phone under 200k Nigeria',
    ],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 1, camera: 3, battery: 1, price: 3, freshness: 1 },
    bestForLabels: ['camera', 'under N200k', 'selfies'],
    whyThisPageExists:
      'This page targets camera-plus-budget searches where buyers need more than megapixel claims and static price lists.',
    pickingMethod: [
      `Filter phones with current tracked prices under ${NAIRA}200,000.`,
      'Reward camera score, useful camera specs, value, and current price strength.',
      'Link to broader camera, budget, and content-creation pages.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...useCaseFaq('camera'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-camera-phones-in-nigeria', label: 'Best camera phones' },
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      { href: '/best-phones-for-content-creation-in-nigeria', label: 'Phones for content creation' },
      { href: '/best-phones-for-tiktok-in-nigeria', label: 'Phones for TikTok' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-for-students-under-200000-naira-nigeria',
    kind: 'student',
    priority: 'high',
    intent: 'commercial',
    title: `Best Phones for Students Under ${NAIRA}200,000 in Nigeria | Decide`,
    h1: `Best phones for students under ${NAIRA}200,000 in Nigeria`,
    description:
      'Compare student-friendly phones under N200,000 in Nigeria with live prices, battery, storage, value, durability, and buy-or-wait guidance.',
    intro:
      `A student phone under ${NAIRA}200,000 needs to survive lectures, WhatsApp, social media, browsing, assignments, hotspot use, photos, and long days away from charge. Decide ranks practical value, not hype.`,
    searchVariants: [
      'best phones for students under 200k in Nigeria',
      'best student phones in Nigeria',
      'best phone for school under 200000 Nigeria',
      'affordable phones for students Nigeria',
      'best budget phones for students Nigeria',
    ],
    maxPrice: 200_000,
    pageSize: 16,
    ranking: { value: 3, performance: 1, camera: 1, battery: 3, price: 3, freshness: 1 },
    bestForLabels: ['students', 'under N200k', 'battery'],
    whyThisPageExists:
      'This page captures student and parent buying searches with a practical Nigerian checklist: battery, storage, durability, price, and support.',
    pickingMethod: [
      `Filter phones with current tracked prices under ${NAIRA}200,000.`,
      'Reward battery, value, storage/RAM practicality, support, and price freshness.',
      'Keep used-phone safety and cheaper budget guides close.',
    ],
    requiredDataFields: [
      ...COMMON_REQUIRED_DATA,
      'RAM and storage practicality for student apps',
      'battery capacity and support signals',
    ],
    sections: DEFAULT_SECTIONS,
    faq: [...budgetFaq(`${NAIRA}200,000`), ...useCaseFaq('students'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-phones-under-200000-naira-nigeria', label: 'All phones under N200k' },
      { href: '/phones-with-strong-battery-in-nigeria', label: 'Phones with strong battery' },
      { href: '/best-used-phones-to-buy-in-nigeria', label: 'Best used phones' },
      { href: '/safest-places-to-buy-phones-in-nigeria', label: 'Safe buying guide' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'phones-with-strong-battery-in-nigeria',
    kind: 'battery',
    priority: 'high',
    intent: 'commercial',
    title: 'Phones With Strong Battery in Nigeria - Prices & Verdicts | Decide',
    h1: 'Phones with strong battery in Nigeria',
    description:
      'Compare phones with strong battery in Nigeria using live prices, battery scores, mAh capacity, charging context, value, and Decide verdicts.',
    intro:
      'For many Nigerian buyers, strong battery is the search before every other search. Decide compares battery strength with price, value, performance, and buying timing so a big mAh number is not the only signal.',
    searchVariants: [
      'phones with strong battery in Nigeria',
      'Android phones with strong battery Nigeria',
      'phones with long lasting battery in Nigeria',
      'best 6000mAh battery phones in Nigeria',
      'cheap phones with strong battery Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 1, camera: 0, battery: 3, price: 1, freshness: 1 },
    bestForLabels: ['strong battery', 'long lasting', 'daily use'],
    whyThisPageExists:
      'This page gives the exact strong-battery query its own intent-matched destination instead of relying only on the broader battery hub.',
    pickingMethod: [
      'Reward battery score, mAh capacity, value, and current price freshness.',
      'Prefer phones that are practical for heavy daily use, students, and hotspot needs.',
      'Link to student, fast-charging, and budget pages for common follow-up searches.',
    ],
    requiredDataFields: COMMON_REQUIRED_DATA,
    sections: DEFAULT_SECTIONS,
    faq: [...useCaseFaq('strong battery'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-battery-phones-in-nigeria', label: 'Best battery phones' },
      { href: '/best-fast-charging-phones-in-nigeria', label: 'Best fast charging phones' },
      { href: '/best-phones-for-students-under-200000-naira-nigeria', label: 'Student phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-fast-charging-phones-in-nigeria',
    kind: 'fast-charging',
    priority: 'medium',
    intent: 'commercial',
    title: 'Best Fast Charging Phones in Nigeria - Prices & Verdicts | Decide',
    h1: 'Best fast charging phones in Nigeria',
    description:
      'Compare fast charging phones in Nigeria with live prices, charging wattage where available, battery, value, and Decide buy-or-wait guidance.',
    intro:
      'Fast charging matters when you cannot stay plugged in for long. Decide ranks fast-charging candidates with battery size, performance, value, and current Nigerian price context so speed does not hide weak overall value.',
    searchVariants: [
      'best fast charging phones in Nigeria',
      'fast charging phones in Nigeria',
      'phones with fast charging Nigeria',
      'cheap fast charging phones Nigeria',
      'best phone with fast charger Nigeria',
    ],
    pageSize: 16,
    ranking: { value: 2, performance: 1, camera: 0, battery: 3, price: 1, freshness: 1 },
    bestForLabels: ['fast charging', 'battery', 'daily use'],
    whyThisPageExists:
      'Fast charging is a specific modifier buyers use after battery intent, and Decide can connect it to real price and overall ownership context.',
    pickingMethod: [
      'Reward charging wattage when available, plus battery score, mAh capacity, and value.',
      'Avoid implying a charger is included or that a store listing is guaranteed.',
      'Link to strong-battery and broad best-phone pages for tradeoff checking.',
    ],
    requiredDataFields: [
      ...COMMON_REQUIRED_DATA,
      'charging wattage where available',
      'battery capacity and battery score',
    ],
    sections: DEFAULT_SECTIONS,
    faq: [...useCaseFaq('fast charging'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/phones-with-strong-battery-in-nigeria', label: 'Phones with strong battery' },
      { href: '/best-battery-phones-in-nigeria', label: 'Best battery phones' },
      { href: '/best-gaming-phones-in-nigeria', label: 'Best gaming phones' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-for-content-creation-in-nigeria',
    kind: 'content',
    priority: 'high',
    intent: 'commercial',
    title: 'Best Phones for Content Creation in Nigeria - Prices & Verdicts | Decide',
    h1: 'Best phones for content creation in Nigeria',
    description:
      'Compare phones for content creation in Nigeria with live prices, camera, video, selfie, battery, storage, performance, and Decide verdicts.',
    intro:
      'Content creators need more than a nice rear camera. Video, selfie quality, storage, battery, editing performance, display, and current price all matter before paying for a phone in Nigeria.',
    searchVariants: [
      'best phones for content creation in Nigeria',
      'best phone for video recording Nigeria',
      'best phone for creators Nigeria',
      'best camera phone for content creators Nigeria',
      'best phone for Instagram reels Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 2, camera: 3, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['content creation', 'camera', 'video'],
    whyThisPageExists:
      'This page targets creator-led searches where Decide can combine camera and video intent with price, battery, and performance tradeoffs.',
    pickingMethod: [
      'Reward camera score, video/selfie signals where available, storage, battery, and performance.',
      'Keep live price and buy-or-wait guidance visible for creator budgets.',
      'Link to TikTok, camera, and budget camera pages.',
    ],
    requiredDataFields: [
      ...COMMON_REQUIRED_DATA,
      'camera and selfie/video signals where available',
      'storage, battery, and performance scores',
    ],
    sections: DEFAULT_SECTIONS,
    faq: [...useCaseFaq('content creation'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-camera-phones-in-nigeria', label: 'Best camera phones' },
      { href: '/best-phones-for-tiktok-in-nigeria', label: 'Phones for TikTok' },
      { href: '/best-camera-phones-under-200000-naira-nigeria', label: 'Camera phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
  {
    slug: 'best-phones-for-tiktok-in-nigeria',
    kind: 'content',
    priority: 'high',
    intent: 'commercial',
    title: 'Best Phones for TikTok in Nigeria - Prices, Camera & Battery | Decide',
    h1: 'Best phones for TikTok in Nigeria',
    description:
      'Compare phones for TikTok in Nigeria with live prices, selfie/video context, camera, battery, storage, performance, and Decide verdicts.',
    intro:
      'A good TikTok phone needs reliable selfie and rear video, enough storage, decent editing performance, strong battery, and a price that still makes sense. Decide keeps those tradeoffs in one place.',
    searchVariants: [
      'best phones for TikTok in Nigeria',
      'best phone for TikTok videos Nigeria',
      'best phone for reels Nigeria',
      'best selfie camera phone Nigeria',
      'best phone for social media Nigeria',
    ],
    pageSize: 18,
    ranking: { value: 2, performance: 2, camera: 3, battery: 2, price: 1, freshness: 1 },
    bestForLabels: ['TikTok', 'selfie video', 'social media'],
    whyThisPageExists:
      'TikTok and social-video searches are a practical buying lane for Nigerian creators, students, and sellers who need content quality without wasting money.',
    pickingMethod: [
      'Reward camera score, selfie/video-adjacent signals, storage, battery, performance, and value.',
      'Keep related content-creation and camera pages close.',
      'Avoid fake creator claims by using Decide scores and specs instead of invented sample reviews.',
    ],
    requiredDataFields: [
      ...COMMON_REQUIRED_DATA,
      'camera and selfie/video signals where available',
      'storage and battery practicality for social video',
    ],
    sections: DEFAULT_SECTIONS,
    faq: [...useCaseFaq('TikTok'), ...COMMON_FAQ],
    relatedLinks: [
      { href: '/best-phones-for-content-creation-in-nigeria', label: 'Phones for content creation' },
      { href: '/best-camera-phones-in-nigeria', label: 'Best camera phones' },
      { href: '/best-camera-phones-under-200000-naira-nigeria', label: 'Camera phones under N200k' },
      ...baseRelatedLinks,
    ],
  },
]

export const SEO_LANDING_PAGE_SLUGS = SEO_LANDING_PAGES.map((page) => page.slug)

export const getSeoLandingPage = (slug: string) =>
  SEO_LANDING_PAGES.find((page) => page.slug === slug) ?? null

export const getSeoLandingHref = (slug: string) => `/${slug}`

const getLowestCurrentPrice = (phone: PhoneCard) => {
  const prices = phone.prices
    .filter((price) => price.in_stock && price.price_ngn > 0)
    .map((price) => price.price_ngn)

  return prices.length > 0 ? Math.min(...prices) : null
}

export const getSeoLandingBestForLabels = (
  config: SeoLandingPageConfig,
  phone: PhoneCard
) => {
  const labels = new Set<string>(config.bestForLabels)

  if ((phone.score_camera ?? 0) >= 75) labels.add('camera')
  if ((phone.score_battery ?? 0) >= 75 || (phone.battery_mah ?? 0) >= 5000) {
    labels.add('battery')
  }
  if ((phone.score_performance ?? 0) >= 75 || (phone.refresh_rate_hz ?? 0) >= 90) {
    labels.add('performance')
  }
  if ((phone.score_value ?? 0) >= 75) labels.add('value')
  if (phone.has_5g) labels.add('5G')

  return Array.from(labels).slice(0, 4)
}

export const scoreSeoLandingPhone = (
  config: SeoLandingPageConfig,
  phone: PhoneCard,
  deal?: PriceDropRadarItem | null
) => {
  const lowestPrice = getLowestCurrentPrice(phone)
  const priceScore =
    lowestPrice && config.maxPrice
      ? Math.max(0, Math.min(100, 100 - (lowestPrice / config.maxPrice) * 55))
      : lowestPrice
        ? 60
        : 20

  const freshnessScore = phone.prices.some((price) => price.in_stock) ? 80 : 35
  const dealBoost = deal ? Math.min(25, Math.max(6, deal.change_amount_ngn / 3000)) : 0
  const fiveGBonus = phone.has_5g ? 3 : 0
  const marketplaceBonus = (phone.marketplace_signal_count ?? 0) > 0 ? 2 : 0
  const chargingBonus =
    config.kind === 'fast-charging' && (phone.charging_speed_w ?? 0) > 0
      ? Math.min(20, (phone.charging_speed_w ?? 0) / 4)
      : 0
  const storageBonus =
    (config.kind === 'student' || config.kind === 'content') && (phone.storage_gb ?? 0) >= 128
      ? 8
      : 0

  return (
    phone.score_value * config.ranking.value +
    phone.score_performance * config.ranking.performance +
    phone.score_camera * config.ranking.camera +
    phone.score_battery * config.ranking.battery +
    priceScore * config.ranking.price +
    freshnessScore * config.ranking.freshness +
    fiveGBonus +
    marketplaceBonus +
    chargingBonus +
    storageBonus +
    dealBoost
  )
}
