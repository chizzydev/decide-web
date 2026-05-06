import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { phonesApi } from '@/lib/api'
import { filterUserFacingPhones } from '@/lib/brandCatalog'
import { formatNairaCompact } from '@/lib/formatters'
import { curateShowcasePhones } from '@/lib/showcasePhones'
import type { PhoneCard } from '@/types'

export const metadata: Metadata = {
  title: 'Compare Phones - Decide',
  description:
    'Compare two phones side by side with Nigerian prices, Decide scores, and the differences that actually matter.',
}

interface ComparePageProps {
  searchParams: Promise<{
    slug_a?: string
    slug_b?: string
    left_variant_id?: string
    right_variant_id?: string
  }>
}

interface CompareSuggestion {
  left: PhoneCard
  right: PhoneCard
}

const buildVariantQueryString = (
  leftVariantId?: number,
  rightVariantId?: number
) => {
  const params = new URLSearchParams()

  if (leftVariantId !== undefined) {
    params.set('left_variant_id', String(leftVariantId))
  }

  if (rightVariantId !== undefined) {
    params.set('right_variant_id', String(rightVariantId))
  }

  return params.toString()
}

const buildCanonicalCompareHref = (
  leftSlug: string,
  rightSlug: string,
  leftVariantId?: number,
  rightVariantId?: number
) => {
  const queryString = buildVariantQueryString(leftVariantId, rightVariantId)
  return `/compare/${leftSlug}/vs/${rightSlug}${queryString ? `?${queryString}` : ''}`
}

const getLowestPrice = (phone: PhoneCard): number | null => {
  const prices = phone.prices
    .map((price) => price.price_ngn)
    .filter((value): value is number => Number.isFinite(value))

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const buildCompareSuggestions = (phones: PhoneCard[]): CompareSuggestion[] => {
  const byOs = new Map<'android' | 'ios', PhoneCard[]>()

  phones.forEach((phone) => {
    const current = byOs.get(phone.os_type) ?? []
    current.push(phone)
    byOs.set(phone.os_type, current)
  })

  const suggestions: CompareSuggestion[] = []

  byOs.forEach((group) => {
    const ordered = [...group].sort((left, right) => {
      const leftPrice = getLowestPrice(left) ?? Number.MAX_SAFE_INTEGER
      const rightPrice = getLowestPrice(right) ?? Number.MAX_SAFE_INTEGER
      return leftPrice - rightPrice
    })

    for (let index = 0; index + 1 < ordered.length; index += 2) {
      suggestions.push({
        left: ordered[index],
        right: ordered[index + 1],
      })
    }
  })

  if (suggestions.length >= 3) {
    return suggestions.slice(0, 3)
  }

  const fallback = [...phones].slice(0, 6)

  for (let index = 0; index + 1 < fallback.length && suggestions.length < 3; index += 2) {
    const left = fallback[index]
    const right = fallback[index + 1]

    if (
      left &&
      right &&
      !suggestions.some(
        (suggestion) =>
          suggestion.left.slug === left.slug || suggestion.right.slug === right.slug
      )
    ) {
      suggestions.push({ left, right })
    }
  }

  return suggestions.slice(0, 3)
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { slug_a, slug_b, left_variant_id, right_variant_id } = await searchParams

  const parsedLeftVariantId =
    left_variant_id &&
    Number.isInteger(Number(left_variant_id)) &&
    Number(left_variant_id) > 0
      ? Number(left_variant_id)
      : undefined
  const parsedRightVariantId =
    right_variant_id &&
    Number.isInteger(Number(right_variant_id)) &&
    Number(right_variant_id) > 0
      ? Number(right_variant_id)
      : undefined

  if (!slug_a || !slug_b) {
    let featuredPhones: PhoneCard[] = []
    let catalogPhones: PhoneCard[] = []

    try {
      const [featuredResult, catalogResult] = await Promise.all([
        phonesApi.getFeatured(),
        phonesApi.getAll({ limit: 18 }),
      ])
      featuredPhones = filterUserFacingPhones(featuredResult)
      catalogPhones = filterUserFacingPhones(catalogResult)
    } catch {
      featuredPhones = []
      catalogPhones = []
    }

    const suggestions = buildCompareSuggestions(
      curateShowcasePhones({
        featured: featuredPhones,
        catalog: catalogPhones,
        limit: 6,
      })
    )

    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
                Head-to-head decision page
              </p>
              <div className="space-y-2">
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                  Compare two phones with real buying context
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                  Decide compares Nigerian prices, score differences, ownership risk,
                  and the rows that actually change which phone makes more sense for your money.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/phones"
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Browse phones
                </Link>
                <Link
                  href="/deals/today"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  Start from live deals
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CompareHeroStat
                label="What you get"
                value="Prices, scores, key differences"
              />
              <CompareHeroStat
                label="Best use case"
                value="Two finalists, one decision"
              />
              <CompareHeroStat
                label="Next step"
                value="Shareable head-to-head page"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Start the right way
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              Use the path that matches where you are in the buying journey instead of treating compare as a dead-end utility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COMPARE_START_PATHS.map((path) => (
              <CompareStartCard
                key={path.href}
                eyebrow={path.eyebrow}
                title={path.title}
                description={path.description}
                href={path.href}
                actionLabel={path.actionLabel}
              />
            ))}
          </div>
        </section>

        {suggestions.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tight text-text-primary">
                  Good head-to-head starting points
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                  These featured pairs are close enough in price or position to make comparison worth the effort.
                </p>
              </div>

              <Link
                href="/phones"
                className="text-sm font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
              >
                Build your own shortlist
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <CompareSuggestionCard
                  key={`${suggestion.left.slug}-${suggestion.right.slug}`}
                  suggestion={suggestion}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    )
  }

  redirect(
    buildCanonicalCompareHref(
      slug_a,
      slug_b,
      parsedLeftVariantId,
      parsedRightVariantId
    )
  )
}

const COMPARE_START_PATHS = [
  {
    eyebrow: 'Browse first',
    title: 'Still exploring the catalog?',
    description:
      'Add phones from Browse when you want to build a shortlist naturally and compare only the serious candidates.',
    href: '/phones',
    actionLabel: 'Browse phones',
  },
  {
    eyebrow: 'Deals first',
    title: 'Timing matters most?',
    description:
      'Start with the live radar if price movement is what is likely to change your final decision.',
    href: '/deals/today',
    actionLabel: "Open today's shortlist",
  },
  {
    eyebrow: 'Verdict first',
    title: 'Only one phone is in your head?',
    description:
      'Use Analyze when you need a quick yes/no verdict before you even get to the compare stage.',
    href: '/analyze',
    actionLabel: 'Analyze a phone',
  },
  {
    eyebrow: 'Shareable links',
    title: 'Already have a final pair?',
    description:
      'The canonical compare pages are meant for clean sharing, revisitability, and stronger head-to-head reading.',
    href: '/compare',
    actionLabel: 'Use compare flow',
  },
] as const

interface CompareHeroStatProps {
  label: string
  value: string
}

const CompareHeroStat = ({ label, value }: CompareHeroStatProps) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

interface CompareStartCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const CompareStartCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: CompareStartCardProps) => (
  <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <div className="space-y-1">
        <h3 className="text-xl font-black tracking-tight text-text-primary">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        {actionLabel}
      </Link>
    </div>
  </section>
)

interface CompareSuggestionCardProps {
  suggestion: CompareSuggestion
}

const CompareSuggestionCard = ({ suggestion }: CompareSuggestionCardProps) => {
  const leftPrice = getLowestPrice(suggestion.left)
  const rightPrice = getLowestPrice(suggestion.right)

  return (
    <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Suggested head-to-head
          </p>
          <h3 className="text-xl font-black tracking-tight text-text-primary">
            {suggestion.left.name} vs {suggestion.right.name}
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <CompareSuggestionPhoneBlock phone={suggestion.left} lowestPrice={leftPrice} />
          <CompareSuggestionPhoneBlock phone={suggestion.right} lowestPrice={rightPrice} />
        </div>

        <Link
          href={`/compare/${suggestion.left.slug}/vs/${suggestion.right.slug}`}
          className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
        >
          Open this comparison
        </Link>
      </div>
    </section>
  )
}

interface CompareSuggestionPhoneBlockProps {
  phone: PhoneCard
  lowestPrice: number | null
}

const CompareSuggestionPhoneBlock = ({
  phone,
  lowestPrice,
}: CompareSuggestionPhoneBlockProps) => (
  <div className="rounded-2xl border border-border bg-surfaceHigh px-3 py-3">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
      {phone.brand_name}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{phone.name}</p>
    <p className="mt-2 text-sm text-text-secondary">
      {lowestPrice != null ? formatNairaCompact(lowestPrice) : 'Price tracked in catalog'}
    </p>
  </div>
)
