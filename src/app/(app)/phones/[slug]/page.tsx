// decide-web/src/app/(app)/phones/[slug]/page.tsx
// Phone detail page — fetches a single phone by slug and renders
// its full spec sheet, scores, prices, and gray market warning.

import type { Metadata } from 'next'
import type { PhoneDetail } from '@/types'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { phonesApi } from '@/lib/api'
import { Badge, Divider } from '@/components/ui'
import { PriceDisplay, AvailabilityBadge } from '@/components/shared'
import { ScoreBarGroup, PhoneSpecSheet } from '@/components/phone'
import { PriceAlertButton } from '@/components/phone/PriceAlertButton'
import { ReviewList } from '@/components/phone/ReviewList'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params
    const phone = await phonesApi.getBySlug(slug)
    return {
      title: `${phone.name} — Decide`,
      description: `${phone.name} price in Nigeria, specs, and where to buy. Real Naira prices from Jumia and Slot.`,
    }
  } catch {
    return { title: 'Phone — Decide' }
  }
}

interface PhonePageProps {
  params: Promise<{ slug: string }>
}

const hasRealImage = (url: string | null | undefined): boolean =>
  !!url && !url.includes('placeholder')

export default async function PhonePage({ params }: PhonePageProps) {
  const { slug } = await params
  let phone: PhoneDetail

  try {
    phone = await phonesApi.getBySlug(slug)
  } catch {
    notFound()
  }

  const hasGrayMarketRisk = phone.gray_market_risk !== 'low'

  const lowestInStockPrice = phone.prices
    .filter((p) => p.in_stock && p.price_ngn > 0)
    .sort((a, b) => a.price_ngn - b.price_ngn)[0]?.price_ngn

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/phones" className="hover:text-text-secondary transition-colors duration-fast">
          Phones
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-text-secondary">{phone.name}</span>
      </nav>

      {/* Top section — image, name, prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Phone image */}
        <div className="flex items-center justify-center bg-surface border border-border rounded-md p-8 min-h-64">
          {hasRealImage(phone.image_url) ? (
            <Image
              src={`${phone.image_url!}?v=${phone.updated_at}`}
              alt={phone.name}
              width={240}
              height={240}
              className="object-contain max-h-60"
              priority
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <svg
                width="64"
                height="64"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="10" y="4" width="28" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="24" cy="38" r="2" fill="currentColor" />
                <rect x="18" y="10" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
              <span className="text-sm">No image available</span>
            </div>
          )}
        </div>

        {/* Name, brand, tags, prices */}
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-text-muted font-medium">
              {phone.brand_name}
            </p>
            <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
              {phone.name}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {(phone.tags ?? []).map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Gray market warning */}
          {hasGrayMarketRisk && (
            <div className="flex items-start gap-2 bg-warning-subtle border border-warning/20 rounded-sm px-3 py-2.5">
              <span className="text-sm mt-0.5" aria-hidden="true">⚠️</span>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-warning">
                  {phone.gray_market_risk === 'high'
                    ? 'High Gray Market Risk'
                    : 'Verify Before Buying'}
                </p>
                {phone.gray_market_note && (
                  <p className="text-xs text-text-secondary leading-snug">
                    {phone.gray_market_note}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Prices */}
          <PriceDisplay prices={phone.prices} />

          {/* Price disclaimer */}
          <p className="text-xs text-text-muted leading-relaxed">
            Verified live prices from tracked stores like Jumia and Slot.
            Listings may still vary by variant, seller, or location, so always
            confirm before buying. Physical store prices may differ.
          </p>

          {/* Price alert */}
          <PriceAlertButton
            phoneId={phone.id}
            phoneName={phone.name}
            lowestPrice={lowestInStockPrice}
          />

          {/* Local support note */}
          {phone.local_support_note && (
            <p className="text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-text-primary">
                Local support:{' '}
              </span>
              {phone.local_support_note}
            </p>
          )}
        </div>
      </div>

      <Divider />

      {/* Scores */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">
          Decide Scores
        </h2>
        <ScoreBarGroup
          scores={{
            battery: phone.score_battery,
            camera: phone.score_camera,
            performance: phone.score_performance,
            build: phone.score_build,
          }}
        />
      </div>

      <Divider />

      {/* Full spec sheet */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">
          Full Specifications
        </h2>
        <PhoneSpecSheet phone={phone} />
      </div>

      <Divider />

      {/* Reviews */}
      <ReviewList phoneId={phone.id} phoneName={phone.name} />

    </div>
  )
}