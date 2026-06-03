import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PhonePricingSeoPage } from '@/components/market/PhonePricingSeoPage'
import {
  buildPhonePricingIntentMetadata,
  getPhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import { parseVariantIdFromSearchParam } from '@/lib/variantHref'

interface PriceHistoryPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: PriceHistoryPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return buildPhonePricingIntentMetadata('price-history', bundle)
  } catch {
    return {
      title: 'Phone price history - Decide',
      description: 'Track phone price history, movement, and current store context in Nigeria.',
    }
  }
}

export default async function PriceHistoryPage({
  params,
  searchParams,
}: PriceHistoryPageProps) {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return <PhonePricingSeoPage intent="price-history" bundle={bundle} />
  } catch {
    notFound()
  }
}
