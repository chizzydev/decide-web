import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PhonePricingSeoPage } from '@/components/market/PhonePricingSeoPage'
import {
  buildPhonePricingIntentMetadata,
  getPhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import { parseVariantIdFromSearchParam } from '@/lib/variantHref'

interface PriceInSlotPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: PriceInSlotPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId, store: 'slot' })
    return buildPhonePricingIntentMetadata('price-in-slot', bundle)
  } catch {
    return {
      title: 'Phone price at Slot Nigeria - Decide',
      description: 'See the tracked Slot Nigeria phone price and how it compares to the market.',
    }
  }
}

export default async function PriceInSlotPage({
  params,
  searchParams,
}: PriceInSlotPageProps) {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId, store: 'slot' })
    return <PhonePricingSeoPage intent="price-in-slot" bundle={bundle} />
  } catch {
    notFound()
  }
}
