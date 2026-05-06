import { formatNairaCompact } from '@/lib/formatters'

export interface BudgetGuide {
  slug: string
  maxPrice: number
  minDropNgN: number
  label: string
  title: string
  description: string
  shortDescription: string
}

const NAIRA = '\u20A6'

export const BUDGET_GUIDES: BudgetGuide[] = [
  {
    slug: '100k',
    maxPrice: 100_000,
    minDropNgN: 3000,
    label: `Under ${NAIRA}100k`,
    title: `Best phone deals under ${NAIRA}100k in Nigeria`,
    description:
      'A tighter budget lane for first-time buyers, backup phones, and low-cost Android picks where every drop matters more.',
    shortDescription: 'Low-budget picks where even small cuts matter.',
  },
  {
    slug: '200k',
    maxPrice: 200_000,
    minDropNgN: 5000,
    label: `Under ${NAIRA}200k`,
    title: `Best phone deals under ${NAIRA}200k in Nigeria`,
    description:
      'A strong mid-budget lane for buyers who want better cameras, battery, and daily performance without jumping into premium pricing.',
    shortDescription: 'The strongest all-rounder lane for value-heavy buyers.',
  },
  {
    slug: '300k',
    maxPrice: 300_000,
    minDropNgN: 7000,
    label: `Under ${NAIRA}300k`,
    title: `Best phone deals under ${NAIRA}300k in Nigeria`,
    description:
      'A wider performance budget for buyers chasing better displays, longevity, and cleaner long-term value without overspending.',
    shortDescription: 'A wider budget for stronger long-term value picks.',
  },
  {
    slug: '500k',
    maxPrice: 500_000,
    minDropNgN: 10000,
    label: `Under ${NAIRA}500k`,
    title: `Best phone deals under ${NAIRA}500k in Nigeria`,
    description:
      'A near-premium lane for buyers who want stronger cameras, software runway, and ownership confidence while still staying disciplined.',
    shortDescription:
      'A disciplined step into upper-midrange and near-premium territory.',
  },
]

export const getBudgetGuide = (slug: string): BudgetGuide | null =>
  BUDGET_GUIDES.find((guide) => guide.slug === slug) ?? null

export const getBudgetGuideMetaDescription = (guide: BudgetGuide): string =>
  `${guide.title}. Decide tracks live Nigerian price drops and points buyers toward verdicts, compare pages, and safer next steps before store exits.`

export const getBudgetGuideStatLabel = (maxPrice: number): string =>
  formatNairaCompact(maxPrice)
