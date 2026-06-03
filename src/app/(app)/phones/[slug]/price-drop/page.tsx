import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PhonePricingSeoPage } from '@/components/market/PhonePricingSeoPage'
import {
  buildPhonePricingIntentMetadata,
  getPhonePricingSeoBundle,
} from '@/lib/phonePricingSeo'
import { parseVariantIdFromSearchParam } from '@/lib/variantHref'

interface PriceDropPageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

export async function generateMetadata({
  params,
  searchParams,
}: PriceDropPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return buildPhonePricingIntentMetadata('price-drop', bundle)
  } catch {
    return {
      title: 'Phone price drop - Decide',
      description: 'Check whether a phone price has dropped recently in Nigeria.',
    }
  }
}

export default async function PriceDropPage({
  params,
  searchParams,
}: PriceDropPageProps) {
  try {
    const { slug } = await params
    const resolvedSearchParams = (await searchParams) ?? {}
    const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)
    const bundle = await getPhonePricingSeoBundle(slug, { variantId })
    return <PhonePricingSeoPage intent="price-drop" bundle={bundle} />
  } catch {
    notFound()
  }
}
