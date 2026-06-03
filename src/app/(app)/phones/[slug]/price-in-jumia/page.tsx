import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PhonePricingSeoPage } from '@/components/market/PhonePricingSeoPage'
import {
  buildPhonePricingIntentMetadata,
  getPhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import { parseVariantIdFromSearchParam } from '@/lib/variantHref'

interface PriceInJumiaPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: PriceInJumiaPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId, store: 'jumia' })
    return buildPhonePricingIntentMetadata('price-in-jumia', bundle)
  } catch {
    return {
      title: 'Phone price in Jumia Nigeria - Decide',
      description: 'See the tracked Jumia Nigeria phone price and how it compares to the market.',
    }
  }
}

export default async function PriceInJumiaPage({
  params,
  searchParams,
}: PriceInJumiaPageProps) {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId, store: 'jumia' })
    return <PhonePricingSeoPage intent="price-in-jumia" bundle={bundle} />
  } catch {
    notFound()
  }
}
