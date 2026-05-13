import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { compareApi } from '@/lib/api'
import { CompareResultView } from '@/components/market/CompareResultView'
import { StructuredData } from '@/components/seo/StructuredData'
import type { CompareFocusedVariant, CompareResult, CurrentPrice } from '@/types'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'

interface CompareLandingPageProps {
  params: Promise<{
    leftSlug: string
    rightSlug: string
  }>
  searchParams?: Promise<{
    left_variant_id?: string
    right_variant_id?: string
  }>
}

const parseVariantId = (value?: string): number | undefined => {
  if (!value) return undefined

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const buildCompareBuilderHref = (
  leftSlug: string,
  rightSlug: string,
  leftVariantId?: number,
  rightVariantId?: number
) => {
  const params = new URLSearchParams({
    slug_a: leftSlug,
    slug_b: rightSlug,
  })

  if (leftVariantId !== undefined) {
    params.set('left_variant_id', String(leftVariantId))
  }

  if (rightVariantId !== undefined) {
    params.set('right_variant_id', String(rightVariantId))
  }

  return `/compare?${params.toString()}`
}

const buildCanonicalCompareHref = (
  leftSlug: string,
  rightSlug: string,
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

  return `/compare/${leftSlug}/vs/${rightSlug}${params.toString() ? `?${params.toString()}` : ''}`
}

const formatFocusedVariantLabel = (variant: CompareFocusedVariant) => {
  if (variant.label) {
    return variant.label
  }

  const parts: string[] = []

  if (variant.storage_gb) {
    parts.push(`${variant.storage_gb}GB`)
  }

  if (variant.ram_gb) {
    parts.push(`${variant.ram_gb}GB RAM`)
  }

  return parts.length > 0 ? parts.join(' / ') : null
}

const getLowestTrackedPrice = (
  focusedPrices: CurrentPrice[],
  fallbackPrices: CurrentPrice[]
) => {
  const prices = focusedPrices.length > 0 ? focusedPrices : fallbackPrices

  if (prices.length === 0) {
    return null
  }

  return prices.reduce(
    (lowest, price) => Math.min(lowest, price.price_ngn),
    prices[0].price_ngn
  )
}

const buildCompareOgImagePath = (result: CompareResult) => {
  const params = new URLSearchParams({
    left: result.phone_a.name,
    right: result.phone_b.name,
    left_brand: result.phone_a.brand_name,
    right_brand: result.phone_b.brand_name,
    headline: result.summary.headline,
  })

  const leftVariantLabel = formatFocusedVariantLabel(result.focused_variants.phone_a)
  const rightVariantLabel = formatFocusedVariantLabel(result.focused_variants.phone_b)
  const leftPrice = getLowestTrackedPrice(
    result.focused_variants.phone_a.prices,
    result.phone_a.prices
  )
  const rightPrice = getLowestTrackedPrice(
    result.focused_variants.phone_b.prices,
    result.phone_b.prices
  )

  if (leftVariantLabel) {
    params.set('left_variant', leftVariantLabel)
  }

  if (rightVariantLabel) {
    params.set('right_variant', rightVariantLabel)
  }

  if (leftPrice !== null) {
    params.set('left_price', String(leftPrice))
  }

  if (rightPrice !== null) {
    params.set('right_price', String(rightPrice))
  }

  return `/api/og/compare?${params.toString()}`
}

const buildCompareTitle = (leftName: string, rightName: string) =>
  `${leftName} vs ${rightName}: Prices, Winner & Tradeoffs - Decide`

const buildCompareDescription = (leftName: string, rightName: string) =>
  `${leftName} vs ${rightName}: compare Nigerian prices, category wins, Decide score, Android/iPhone tradeoffs, and what to buy for your use case.`

export async function generateMetadata({
  params,
  searchParams,
}: CompareLandingPageProps): Promise<Metadata> {
  try {
    const { leftSlug, rightSlug } = await params
    const variants = searchParams ? await searchParams : undefined
    const leftVariantId = parseVariantId(variants?.left_variant_id)
    const rightVariantId = parseVariantId(variants?.right_variant_id)
    const result = await compareApi.getBySlugs(leftSlug, rightSlug, {
      leftVariantId,
      rightVariantId,
    })
    const canonicalPath = `/compare/${result.phone_a.slug}/vs/${result.phone_b.slug}`
    const sharePath = buildCanonicalCompareHref(
      result.phone_a.slug,
      result.phone_b.slug,
      result.focused_variants.phone_a.id ?? undefined,
      result.focused_variants.phone_b.id ?? undefined
    )
    const ogImage = absoluteUrl(buildCompareOgImagePath(result))
    const title = buildCompareTitle(result.phone_a.name, result.phone_b.name)
    const description = buildCompareDescription(result.phone_a.name, result.phone_b.name)
    const metadata = buildPageMetadata({
      title,
      description,
      path: canonicalPath,
      keywords: [
        `${result.phone_a.name} vs ${result.phone_b.name}`,
        `compare ${result.phone_a.brand_name} phones Nigeria`,
        'phone comparison Nigeria',
      ],
      image: ogImage,
    })

    metadata.openGraph = {
      ...metadata.openGraph,
      url: sharePath,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${result.phone_a.name} vs ${result.phone_b.name} comparison card`,
        },
      ],
    }

    metadata.twitter = {
      ...metadata.twitter,
      images: [ogImage],
    }

    return metadata
  } catch {
    return buildPageMetadata({
      title: 'Phone comparison - Decide',
      description:
        'Compare two phones side by side with Nigerian prices, Decide scores, and the differences that matter.',
      path: '/compare',
    })
  }
}

export default async function CompareLandingPage({
  params,
  searchParams,
}: CompareLandingPageProps) {
  const { leftSlug, rightSlug } = await params
  const variants = searchParams ? await searchParams : undefined
  const leftVariantId = parseVariantId(variants?.left_variant_id)
  const rightVariantId = parseVariantId(variants?.right_variant_id)

  try {
    const result = await compareApi.getBySlugs(leftSlug, rightSlug, {
      leftVariantId,
      rightVariantId,
    })
    const title = buildCompareTitle(result.phone_a.name, result.phone_b.name)
    const description = buildCompareDescription(result.phone_a.name, result.phone_b.name)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: absoluteUrl(`/compare/${result.phone_a.slug}/vs/${result.phone_b.slug}`),
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: [result.phone_a, result.phone_b].map((phone, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: absoluteUrl(`/phones/${phone.slug}`),
          item: {
            '@type': 'Thing',
            name: phone.name,
            image: phone.image_url ?? undefined,
          },
        })),
      },
    }

    return (
      <>
        <StructuredData data={structuredData} />
        <CompareResultView
          result={result}
          actionHref={buildCompareBuilderHref(
            result.phone_a.slug,
            result.phone_b.slug,
            result.focused_variants.phone_a.id ?? undefined,
            result.focused_variants.phone_b.id ?? undefined
          )}
          shareHref={buildCanonicalCompareHref(
            result.phone_a.slug,
            result.phone_b.slug,
            result.focused_variants.phone_a.id ?? undefined,
            result.focused_variants.phone_b.id ?? undefined
          )}
          actionLabel="Open compare builder"
        />
      </>
    )
  } catch {
    notFound()
  }
}
