import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MustCheckToggle from '@/components/phone/MustCheckToggle'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { Badge } from '@/components/ui'
import { phonesApi } from '@/lib/api'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import {
  buildBuyNowWaitHref,
  buildPhoneDetailHref,
  buildUsedGuideHref,
  buildWorthItHref,
  parseVariantIdFromSearchParam,
} from '@/lib/variantHref'
import type { GrayMarketRisk, LocalSupportQuality, PhoneDetail } from '@/types'

interface UsedPhoneGuidePageProps {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ variant_id?: string | string[] }>
}

const CURRENT_YEAR = new Date().getFullYear()

const RISK_LABELS: Record<GrayMarketRisk, string> = {
  low: 'Low gray-market risk',
  medium: 'Verify before buying',
  high: 'High gray-market risk',
}

const SUPPORT_LABELS: Record<LocalSupportQuality, string> = {
  good: 'Good local support',
  fair: 'Fair local support',
  poor: 'Weak local support',
}

const getYearsSinceRelease = (phone: PhoneDetail): number | null =>
  phone.released_year ? Math.max(CURRENT_YEAR - phone.released_year, 0) : null

const buildUsedPhoneRead = (phone: PhoneDetail) => {
  const yearsSinceRelease = getYearsSinceRelease(phone)
  const supportLabel = phone.local_support_quality
    ? SUPPORT_LABELS[phone.local_support_quality]
    : 'Support visibility is limited'

  let summary =
    'Use an in-person inspection flow, verify the seller story, and do not treat the lowest asking price as proof that the deal is good.'

  if (phone.gray_market_risk === 'high' && phone.local_support_quality === 'poor') {
    summary =
      'This is a high-risk used buy in Nigeria. Only proceed if you can inspect the device properly, verify the variant, and absorb repair friction if anything goes wrong.'
  } else if (phone.gray_market_risk === 'high') {
    summary =
      'This can still work as a used buy, but only if you verify the exact variant and seller claims carefully before you pay.'
  } else if (phone.local_support_quality === 'poor') {
    summary =
      'The phone itself may still be sensible, but repairs and parts can be painful in Nigeria. Factor that into the real cost of a used purchase.'
  } else if (phone.local_support_quality === 'good') {
    summary =
      'This is a friendlier used-buy category than most. You still need a full inspection, but the after-sales and parts story is better than average.'
  }

  const redFlags = [
    phone.gray_market_note || 'If the seller is vague about the variant, previous repairs, or origin story, slow down and verify everything.',
    yearsSinceRelease != null && yearsSinceRelease >= 3
      ? `This model is about ${yearsSinceRelease} years old. Be skeptical of anyone marketing it as truly brand new unless they can prove the stock history.`
      : 'Ask directly whether the unit is sealed, activated, refurbished, or previously used abroad.',
    phone.local_support_quality === 'poor'
      ? 'Weak local support means your real risk is not just authenticity - it is what happens if the screen, battery, or board needs work later.'
      : `${supportLabel} helps, but you should still assume every used phone needs verification before money changes hands.`,
  ]

  return {
    summary,
    redFlags,
  }
}

export async function generateMetadata(
  { params }: UsedPhoneGuidePageProps
): Promise<Metadata> {
  try {
    const { slug } = await params
    const phone = await phonesApi.getBySlug(slug)

    return buildPageMetadata({
      title: `Used ${phone.name} in Nigeria - Decide`,
      description: `Decide's used-phone guide for ${phone.name}: tokunbo vs new reality, red flags, seller questions, and the checks to run before you pay.`,
      path: `/used/${phone.slug}`,
      keywords: [
        `used ${phone.name} Nigeria`,
        `${phone.name} tokunbo Nigeria`,
        `${phone.name} used phone guide`,
      ],
      type: 'article',
    })
  } catch {
    return buildPageMetadata({
      title: 'Used phone guide - Decide',
      description:
        'Decide helps Nigerian buyers pressure-test tokunbo and used phone offers with seller checks, red flags, and model-specific inspection guidance.',
      path: '/used/checker',
      type: 'article',
    })
  }
}

export default async function UsedPhoneGuidePage({
  params,
  searchParams,
}: UsedPhoneGuidePageProps) {
  const { slug } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const variantId = parseVariantIdFromSearchParam(resolvedSearchParams.variant_id)

  try {
    const phone = await phonesApi.getBySlug(slug)
    const detailHref = buildPhoneDetailHref(phone.slug, { variantId })
    const buyNowWaitHref = buildBuyNowWaitHref(phone.slug, { variantId })
    const worthItHref = buildWorthItHref(phone.slug, { variantId })
    const guideHref = buildUsedGuideHref(phone.slug, { variantId })
    const yearsSinceRelease = getYearsSinceRelease(phone)
    const usedRead = buildUsedPhoneRead(phone)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Used ${phone.name} in Nigeria`,
      description: `Decide's used-phone guide for ${phone.name}: tokunbo vs new reality, red flags, seller questions, and the checks to run before you pay.`,
      url: absoluteUrl(guideHref),
      about: {
        '@type': 'Thing',
        name: phone.name,
        url: absoluteUrl(detailHref),
      },
      author: {
        '@type': 'Organization',
        name: 'Decide',
      },
    }

    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <StructuredData data={structuredData} />
        <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
                Used phone trust layer
              </p>
              <div className="space-y-2">
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                  Buying a used {phone.name} in Nigeria?
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                  This is Decide&apos;s model-specific used-phone guide: the honest market read, the checks to run before you pay, and the warning signs that should make you slow down or walk away.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={detailHref}
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Open phone detail
                </Link>
                <Link
                  href="/used/checker"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  Open checker hub
                </Link>
                <Link
                  href={buyNowWaitHref}
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  Read buy or wait
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
              <Badge variant="default">{RISK_LABELS[phone.gray_market_risk]}</Badge>
              {phone.local_support_quality ? (
                <Badge variant="default">{SUPPORT_LABELS[phone.local_support_quality]}</Badge>
              ) : null}
              {yearsSinceRelease != null ? (
                <Badge variant="default">Released {phone.released_year}</Badge>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Honest market read
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                What Decide thinks before you even meet the seller
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {usedRead.summary}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Seller questions
              </p>
              <div className="space-y-2 text-sm leading-relaxed text-text-secondary">
                <p>Ask if the device is brand new, activated, UK used, refurbished, or converted.</p>
                <p>Ask which parts have ever been changed: battery, screen, back glass, charging port, or board.</p>
                <p>Ask the seller to reset it in front of you and stay with you through activation before you pay.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Red flags
              </p>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                Slow down if any of these show up
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {usedRead.redFlags.map((flag) => (
                <div key={flag} className="rounded-xl border border-border bg-surfaceHigh px-4 py-4 text-sm leading-relaxed text-text-secondary">
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Inspection flow
              </p>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                Run the actual checks before money changes hands
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                This section adapts the checklist to the phone&apos;s OS and brand, so the warnings are much more specific than a generic used-phone article.
              </p>
            </div>

            <MustCheckToggle
              os_type={phone.os_type}
              brand_name={phone.brand_name}
              phone_name={phone.name}
            />
          </div>
        </section>

        <DecisionLoopPanel
          title="Keep the used decision in context"
          description="A used buy should still flow through the rest of Decide before you hand over money. Timing, support, and nearby alternatives matter just as much as seller trust."
          items={[
            {
              eyebrow: 'Timing verdict',
              title: 'Check whether the current asking window makes sense',
              description:
                'Open buy now or wait if you want Decide to weigh the current market timing before you commit to this model.',
              href: buyNowWaitHref,
              label: 'Open buy or wait',
            },
            {
              eyebrow: 'Longevity verdict',
              title: 'See whether the phone is still worth buying at all',
              description:
                'Use the longer-term verdict when aging risk, support runway, and resale confidence matter to the used decision.',
              href: worthItHref,
              label: 'Open still worth it',
            },
            {
              eyebrow: 'Full context',
              title: 'Return to the full phone detail page',
              description:
                'The full product page ties this used guide back to current tracked prices, reviews, alerts, and the rest of the decision system.',
              href: detailHref,
              label: 'Open phone detail',
            },
          ]}
        />
      </div>
    )
  } catch {
    notFound()
  }
}
