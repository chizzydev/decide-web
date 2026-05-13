import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { editorialApi } from '@/lib/api'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { OwnershipSignalPanel } from '@/components/market/OwnershipSignalPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { VerdictPageHero } from '@/components/market/VerdictPageHero'
import { WorthItVerdictCard } from '@/components/market/WorthItVerdictCard'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import { buildOfferStructuredData } from '@/lib/structuredData'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildWorthItHref,
  parseVariantIdFromSearchParam,
} from '@/lib/variantHref'

const buildWorthItTitle = (phoneName: string) =>
  `Is ${phoneName} Still Worth It in Nigeria? - Decide`

const buildWorthItDescription = (phoneName: string) =>
  `Check if ${phoneName} still makes sense in Nigeria using current prices, support runway, repair reality, resale confidence, and safer alternatives.`

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params
    const data = await editorialApi.getStillWorthIt(slug)

    return buildPageMetadata({
      title: buildWorthItTitle(data.phone.name),
      description: buildWorthItDescription(data.phone.name),
      path: `/worth-it/${data.phone.slug}`,
      keywords: [
        `${data.phone.name} still worth it`,
        `${data.phone.name} worth buying Nigeria`,
        'phone longevity Nigeria',
      ],
      type: 'article',
    })
  } catch {
    return buildPageMetadata({
      title: 'Still worth it - Decide',
      description:
        'Decide judges whether a phone is still worth buying using Nigerian pricing, support runway, repair reality, and resale confidence.',
      type: 'article',
    })
  }
}

interface WorthItPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export default async function WorthItPage({
  params,
  searchParams,
}: WorthItPageProps) {
  const { slug } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)

  try {
    const data = await editorialApi.getStillWorthIt(slug)
    const detailHref = buildPhoneDetailHref(data.phone.slug, { variantId })
    const buyNowWaitHref = buildBuyNowWaitHref(data.phone.slug, { variantId })
    const verdictHref = buildWorthItHref(data.phone.slug, { variantId })
    const productMainEntity =
      data.price_signal.current_best_price_ngn != null
        ? {
            '@type': 'Product',
            name: data.phone.name,
            brand: {
              '@type': 'Brand',
              name: data.phone.brand_name,
            },
            image: data.phone.image_url ?? undefined,
            releaseDate: data.phone.released_year
              ? `${data.phone.released_year}-01-01`
              : undefined,
            offers: buildOfferStructuredData({
              price: data.price_signal.current_best_price_ngn,
              url: absoluteUrl(detailHref),
              sellerName: 'Tracked Nigerian retailer',
            }),
          }
        : undefined
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: buildWorthItTitle(data.phone.name),
      description: buildWorthItDescription(data.phone.name),
      dateModified: data.generated_at,
      about: {
        '@type': 'Thing',
        name: data.phone.name,
      },
      mainEntity: productMainEntity,
      url: absoluteUrl(verdictHref),
      author: {
        '@type': 'Organization',
        name: 'Decide',
      },
    }

    return (
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <StructuredData data={structuredData} />
        <VerdictPageHero
          eyebrow="Longevity verdict"
          title={`Is ${data.phone.name} still worth buying?`}
          description="Decide looks beyond specs alone and weighs support runway, repair friction, resale outlook, and current Nigerian pricing before answering that question."
          phone={data.phone}
          badges={[
            {
              label: 'Current best',
              value:
                data.price_signal.current_best_price_ngn != null
                  ? formatNairaCompact(data.price_signal.current_best_price_ngn)
                  : 'N/A',
            },
            {
              label: 'Years old',
              value:
                data.longevity_signal.years_since_release != null
                  ? String(data.longevity_signal.years_since_release)
                  : 'Unknown',
            },
            {
              label: 'Repair outlook',
              value: data.repair_support_signal.outlook,
            },
            {
              label: 'Updated',
              value: formatRelativeTime(data.generated_at),
            },
          ]}
          actions={[
            {
              href: detailHref,
              label: 'View phone detail',
              tone: 'primary',
            },
            {
              href: buyNowWaitHref,
              label: 'Read buy/wait',
              tone: 'secondary',
            },
            {
              href: '/deals/today',
              label: "Today's shortlist",
              tone: 'secondary',
            },
          ]}
        />

        <WorthItVerdictCard data={data} variantId={variantId} />

        <OwnershipSignalPanel
          phoneName={data.phone.name}
          yearsSinceRelease={data.longevity_signal.years_since_release}
          estimatedYearsOfSupportLeft={data.longevity_signal.estimated_years_of_support_left}
          support={{
            outlook: data.longevity_signal.support_outlook,
            summary: data.longevity_signal.summary,
          }}
          repair={{
            outlook: data.repair_support_signal.outlook,
            summary: data.repair_support_signal.summary,
          }}
          resale={{
            outlook: data.resale_value_signal.outlook,
            summary: data.resale_value_signal.summary,
          }}
        />

        <DecisionLoopPanel
          title="Keep the verdict in context"
          description="Still-worth-it answers the long-view question. Use the surrounding Decide surfaces if you want to know whether the phone also makes sense right now at today's tracked prices."
          items={[
            {
              eyebrow: 'Timing',
              title: `Should you buy ${data.phone.name} now?`,
              description:
                'Open the buy-now-or-wait verdict if you care about timing, recent price movement, and whether patience is likely to pay off.',
              href: buyNowWaitHref,
              label: 'Open buy/wait verdict',
            },
            {
              eyebrow: 'Live market',
              title: 'See the current drop shortlist',
              description:
                'Use the daily deals route to compare this verdict against what else is moving in the live Nigerian market right now.',
              href: '/deals/today',
              label: "Open today's shortlist",
            },
            {
              eyebrow: 'Full context',
              title: 'Return to phone detail',
              description:
                'The phone page ties the verdict back to tracked prices, support notes, reviews, alerts, and the rest of the full Decide product surface.',
              href: detailHref,
              label: 'View phone detail',
            },
          ]}
        />
      </div>
    )
  } catch {
    notFound()
  }
}
