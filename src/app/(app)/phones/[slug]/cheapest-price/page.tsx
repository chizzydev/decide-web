import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PhonePricingSeoPage } from '@/components/market/PhonePricingSeoPage'
import {
  buildPhonePricingIntentMetadata,
  getPhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import { parseVariantIdFromSearchParam } from '@/lib/variantHref'

interface CheapestPricePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: CheapestPricePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return buildPhonePricingIntentMetadata('cheapest-price', bundle)
  } catch {
    return {
      title: 'Cheapest phone price - Decide',
      description: 'Find the cheapest tracked phone price in Nigeria across trusted stores.',
    }
  }
}

export default async function CheapestPricePage({
  params,
  searchParams,
}: CheapestPricePageProps) {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return <PhonePricingSeoPage intent="cheapest-price" bundle={bundle} />
  } catch {
    notFound()
  }
}
