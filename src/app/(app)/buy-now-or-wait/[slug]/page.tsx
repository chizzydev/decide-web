import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { editorialApi } from '@/lib/api'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { BuyNowWaitCard } from '@/components/market/BuyNowWaitCard'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { OwnershipSignalPanel } from '@/components/market/OwnershipSignalPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { VerdictPageHero } from '@/components/market/VerdictPageHero'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import {
  buildOfferStructuredData,
  buildProductStructuredDataDescription,
} from '@/lib/structuredData'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildWorthItHref,
  parseVariantIdFromSearchParam,
} from '@/lib/variantHref'

const buildBuyNowWaitTitle = (phoneName: string) =>
  `Should You Buy ${phoneName} Now? Nigeria Price Verdict - Decide`

const buildBuyNowWaitDescription = (phoneName: string) =>
  `See whether ${phoneName} is worth buying now in Nigeria, based on tracked prices, market timing, support outlook, ownership risk, and better alternatives.`

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params
    const data = await editorialApi.getBuyNowWait(slug)

    return buildPageMetadata({
      title: buildBuyNowWaitTitle(data.phone.name),
      description: buildBuyNowWaitDescription(data.phone.name),
      path: `/buy-now-or-wait/${data.phone.slug}`,
      keywords: [
        `${data.phone.name} buy now or wait`,
        `${data.phone.name} Nigeria price`,
        'should I buy this phone now Nigeria',
      ],
      type: 'article',
    })
  } catch {
    return buildPageMetadata({
      title: 'Buy now or wait - Decide',
      description:
        'Decide uses Nigerian price tracking, support outlook, and ownership signals to judge whether a phone is worth buying now or waiting on.',
      path: '/deals/today',
      type: 'article',
    })
  }
}

interface BuyNowWaitPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export default async function BuyNowWaitPage({
  params,
  searchParams,
}: BuyNowWaitPageProps) {
  const { slug } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)

  try {
    const data = await editorialApi.getBuyNowWait(slug)
    const detailHref = buildPhoneDetailHref(data.phone.slug, { variantId })
    const worthItHref = buildWorthItHref(data.phone.slug, { variantId })
    const verdictHref = buildBuyNowWaitHref(data.phone.slug, { variantId })
    const productMainEntity =
      data.price_signal.current_best_price_ngn != null
        ? {
            '@type': 'Product',
            name: data.phone.name,
            description: buildProductStructuredDataDescription(
              data.phone.name,
              'tracked Nigerian prices, market timing, support outlook, ownership risk, and whether to buy now or wait'
            ),
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
      headline: buildBuyNowWaitTitle(data.phone.name),
      description: buildBuyNowWaitDescription(data.phone.name),
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
          eyebrow="Purchase verdict"
          title={`Buy now or wait for ${data.phone.name}?`}
          description="Decide weighs tracked Nigerian price movement, support runway, repair friction, and resale outlook before calling the buying window."
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
              label: 'Price position',
              value: data.price_signal.price_position.replace(/_/g, ' '),
            },
            {
              label: 'Support outlook',
              value: data.longevity_signal.support_outlook,
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
              href: worthItHref,
              label: 'Check still worth it',
              tone: 'secondary',
            },
            {
              href: '/deals/today',
              label: "Today's shortlist",
              tone: 'secondary',
            },
          ]}
        />

        <BuyNowWaitCard data={data} variantId={variantId} />

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
          title="Use the full Decide decision loop"
          description="A price drop alone should not be the only reason to buy. Move through the connected Decide surfaces if you want a more complete answer."
          items={[
            {
              eyebrow: 'Longevity',
              title: `Is ${data.phone.name} still worth it?`,
              description:
                'Use the longer-term verdict if you care more about support runway, aging risk, and whether the model is still a sensible buy this year.',
              href: worthItHref,
              label: 'Open still-worth-it verdict',
            },
            {
              eyebrow: 'Live market',
              title: "See what's moving today",
              description:
                'Open the daily shortlist if you want more context around where the strongest tracked price movement is happening right now.',
              href: '/deals/today',
              label: "Open today's shortlist",
            },
            {
              eyebrow: 'Full context',
              title: 'Go back to phone detail',
              description:
                'Use the full phone page for tracked prices, detailed specs, gray-market notes, alerts, and reviews before you act on the verdict.',
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
