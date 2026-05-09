import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { PhoneGrid } from '@/components/phone'
import { MarketplaceLeadFeed } from '@/components/market/MarketplaceLeadFeed'
import { ShortlistBuilderPanel } from '@/components/market/ShortlistBuilderPanel'
import { marketApi, phonesApi } from '@/lib/api'
import { filterUserFacingPhones } from '@/lib/brandCatalog'
import { buildCatalogSignals } from '@/lib/catalogSignals'
import { formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import { curateShowcasePhones } from '@/lib/showcasePhones'
import type {
  MarketplaceLeadsResponse,
  PhoneCard,
  PriceDropRadarItem,
  PriceDropRadarResponse,
} from '@/types'

export const metadata: Metadata = {
  title: "Nigeria's Smartest Phone Advisor",
  description:
    'Answer five questions, browse live Nigerian price movement, and get clearer phone verdicts before you buy.',
}

export const revalidate = 21600

const BUDGET_WATCH_CAP_NGN = 250_000
const ANDROID_APK_PATH = '/downloads/decide-android-v1.0.0.apk'
const ANDROID_APK_SIZE = '76 MB'

const pickFreshestDeal = (deals: PriceDropRadarItem[]) =>
  [...deals].sort(
    (left, right) =>
      new Date(right.scraped_at).getTime() - new Date(left.scraped_at).getTime()
  )[0] ?? null

const pickBudgetDeal = (deals: PriceDropRadarItem[]) =>
  deals.find((deal) => deal.current_price_ngn <= BUDGET_WATCH_CAP_NGN) ?? null

interface CompareSuggestion {
  left: PhoneCard
  right: PhoneCard
  href: string
  reason: string
}

const getShowcaseCompareSuggestions = (phones: PhoneCard[], limit = 2) => {
  const suggestions: CompareSuggestion[] = []
  const seenPairs = new Set<string>()

  for (const phone of phones) {
    const compareAction = getPrimaryPhoneCardCompareAction(phone, phones)

    if (!compareAction) {
      continue
    }

    const pairKey = [phone.slug, compareAction.counterpart.slug].sort().join('::')

    if (seenPairs.has(pairKey)) {
      continue
    }

    suggestions.push({
      left: phone,
      right: compareAction.counterpart,
      href: compareAction.href,
      reason:
        compareAction.reason ??
        `Pressure-test ${phone.name} against ${compareAction.counterpart.name} before you decide.`,
    })

    seenPairs.add(pairKey)

    if (suggestions.length >= limit) {
      break
    }
  }

  return suggestions
}

const SUPPORT_LABELS: Record<
  NonNullable<PriceDropRadarItem['ownership']>['longevity_signal']['support_outlook'],
  string
> = {
  strong: 'Strong support',
  good: 'Healthy support',
  limited: 'Limited support',
  expired: 'Support ending',
  unknown: 'Support unclear',
}

const REPAIR_LABELS: Record<
  NonNullable<PriceDropRadarItem['ownership']>['repair_support_signal']['outlook'],
  string
> = {
  strong: 'Repair friendly',
  fair: 'Repair mixed',
  weak: 'Repair risk',
  unknown: 'Repair unclear',
}

const RESALE_LABELS: Record<
  NonNullable<PriceDropRadarItem['ownership']>['resale_value_signal']['outlook'],
  string
> = {
  strong: 'Resale strong',
  fair: 'Resale fair',
  weak: 'Resale weak',
  unknown: 'Resale unclear',
}

export default async function HomePage() {
  let featuredPhones: PhoneCard[] = []
  let catalogPhones: PhoneCard[] = []
  let radar: PriceDropRadarResponse | null = null
  let marketplaceLeads: MarketplaceLeadsResponse | null = null
  let marketplaceStatus: 'ready' | 'empty' | 'unavailable' = 'unavailable'

  const [featuredResult, catalogResult, radarResult, marketplaceResult] =
    await Promise.allSettled([
    phonesApi.getFeatured(),
    phonesApi.getAll({ limit: 18 }),
    marketApi.getPriceDropRadar({ limit: 12, min_drop_ngn: 5000 }),
    marketApi.getMarketplaceLeads(6),
  ])

  if (featuredResult.status === 'fulfilled') {
    featuredPhones = filterUserFacingPhones(featuredResult.value)
  }

  if (catalogResult.status === 'fulfilled') {
    catalogPhones = filterUserFacingPhones(catalogResult.value)
  }

  if (radarResult.status === 'fulfilled') {
    radar = radarResult.value
  }

  if (marketplaceResult.status === 'fulfilled') {
    marketplaceLeads = marketplaceResult.value
    marketplaceStatus = marketplaceLeads.offers.length > 0 ? 'ready' : 'empty'
  }

  const showcasePhones = curateShowcasePhones({
    featured: featuredPhones,
    catalog: catalogPhones,
    limit: 6,
  })
  const deals = radar?.deals ?? []
  const signalsBySlug = buildCatalogSignals(showcasePhones, deals)
  const leadDeal = deals[0] ?? null
  const budgetLead = pickBudgetDeal(deals)
  const freshestLead = pickFreshestDeal(deals)
  const totalLiveDrop = deals.reduce((sum, deal) => sum + deal.change_amount_ngn, 0)
  const showcaseCompareSuggestions = getShowcaseCompareSuggestions(showcasePhones)

  return (
    <div className="flex flex-col overflow-x-hidden">
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#14b8a6 1px, transparent 1px), linear-gradient(90deg, #14b8a6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-3xl"
          style={{ background: '#14b8a6' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-28 sm:px-6 lg:min-h-[78vh] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="min-w-0 space-y-7">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
                Live phone buying intelligence
              </p>
              <div className="space-y-3">
                <h1 className="max-w-full break-words font-display text-4xl font-bold leading-tight tracking-normal text-text-primary sm:text-6xl">
                  Stop guessing.
                  <br />
                  <span className="text-accent">Start with the market.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-text-secondary">
                  Decide helps Nigerian buyers move from vague phone shopping to clear purchase
                  decisions with live price movement, verdict pages, gray-market warnings, and
                  local support context.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/assistant"
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-8 text-base font-bold tracking-wide text-navy-800 transition-all duration-fast hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:w-auto"
              >
                Find my phone
              </Link>
              <Link
                href="/deals/today"
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-borderHigh bg-white/85 px-8 text-base font-semibold text-text-primary transition-all duration-fast hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:w-auto"
              >
                Open deals today
              </Link>
              <Link
                href="/phones"
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-border px-8 text-base font-medium text-text-secondary transition-all duration-fast hover:border-borderHigh hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:w-auto"
              >
                Browse phones
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-accent/20 bg-white shadow-xl shadow-slate-900/5">
              <div className="grid gap-0">
                <div className="min-w-0 space-y-4 p-4 sm:p-5">
                  <div className="flex min-w-0 gap-4">
                    <img
                      src="/icon-192.png"
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-[18px] shadow-lg shadow-slate-900/15"
                    />
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
                        Android app now available
                      </p>
                      <h2 className="text-xl font-black tracking-tight text-text-primary">
                        Get Decide on your phone before Play Store launch
                      </h2>
                      <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                        This is the official Decide Android app (APK) file. Recent install
                        checks passed on Google Play Protect and Xiaomi security, so no risk
                        was detected in those scans. Because it is being downloaded directly
                        from this website while the Play Store listing is still in review,
                        Android may still ask you to confirm before installing. iPhone
                        support will come later as Decide matures.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <SecurityCheckCard
                      src="/images/app-security/google-play-protect.jpg"
                      label="Google Play Protect"
                      status="Looks safe"
                    />
                    <SecurityCheckCard
                      src="/images/app-security/xiaomi-security-check.jpg"
                      label="Xiaomi security scan"
                      status="No risks detected"
                    />
                  </div>
                </div>
                <div className="border-t border-border bg-surfaceHigh px-4 py-4 md:px-5">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <DownloadTrustStat label="Version" value="1.0.0" />
                    <DownloadTrustStat label="Size" value={ANDROID_APK_SIZE} />
                    <DownloadTrustStat label="Source" value="Official" />
                  </div>
                  <a
                    href={ANDROID_APK_PATH}
                    download
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md bg-text-primary px-4 text-sm font-black text-white transition-colors duration-fast hover:bg-slate-950"
                  >
                    Download APK
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroStat label="Live drops" value={radar ? String(deals.length) : 'Waiting'} />
              <HeroStat
                label="Combined cuts"
                value={radar && deals.length > 0 ? formatNairaCompact(totalLiveDrop) : 'Watching'}
              />
              <HeroStat
                label="Jiji leads"
                value={
                  marketplaceStatus === 'ready'
                    ? String(marketplaceLeads?.offers.length ?? 0)
                    : marketplaceStatus === 'empty'
                      ? 'Watching'
                      : 'Connect API'
                }
              />
              <HeroStat
                label="Freshest scan"
                value={
                  freshestLead
                    ? formatRelativeTime(freshestLead.scraped_at)
                    : radar?.generated_at
                      ? formatRelativeTime(radar.generated_at)
                      : 'Watching'
                }
              />
            </div>

            <p className="text-xs text-text-muted">
              Tracked Nigerian prices, gray-market warnings, and decision-first verdicts.
            </p>
          </div>

          <HeroMarketPulse
            leadDeal={leadDeal}
            budgetLead={budgetLead}
            freshestLead={freshestLead}
            generatedAt={radar?.generated_at ?? null}
          />
        </div>
      </section>

      <section className="border-b border-border bg-surface px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <MarketplaceLeadFeed
            offers={marketplaceLeads?.offers ?? []}
            status={marketplaceStatus}
            title="Jiji bargain radar"
            description="A separate marketplace lane for bargain hunters. Jumia and Slot remain trusted retail truth; Jiji leads are scored for opportunity and risk so buyers know what to inspect before paying."
            compact
          />
        </div>
      </section>

      <section className="border-b border-border px-4 py-16">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Start here
            </p>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight text-text-primary">
                Choose the Decide path that matches how you shop
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-relaxed text-text-secondary sm:mx-0">
                Some buyers need a recommendation from scratch. Others already have a phone, a
                budget ceiling, or two finalists. These are the fastest entry points into the right
                flow.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {START_PATHS.map((path, index) => (
              <StartPathCard
                key={path.href}
                index={index}
                eyebrow={path.eyebrow}
                title={path.title}
                description={path.description}
                highlight={path.highlight}
                href={path.href}
                actionLabel={path.actionLabel}
                accent={path.accent}
              />
            ))}
          </div>
        </div>
      </section>
      {(leadDeal || budgetLead || freshestLead) && (
        <section className="border-b border-border bg-surface px-4 py-16">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  Market pulse
                </p>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight text-text-primary">
                    Start with what moved, not just what is popular
                  </h2>
                  <p className="max-w-3xl text-base leading-relaxed text-text-secondary">
                    These are the strongest live signals Decide sees right now. Use them to enter the
                    catalog with sharper timing and better context.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/deals/today"
                  className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
                >
                  Open today's shortlist
                </Link>
                <Link
                  href="/deals"
                  className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  View full radar
                </Link>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
              <MarketInsightCard
                eyebrow="Biggest live drop"
                title={leadDeal?.phone_name ?? 'Waiting for the next standout move'}
                description={
                  leadDeal
                    ? `${leadDeal.store === 'jumia' ? 'Jumia' : 'Slot'} just moved this phone down by ${formatNairaCompact(leadDeal.change_amount_ngn)}. It now sits at ${formatNairaCompact(leadDeal.current_price_ngn)}, which makes it a strong timing check before you buy.`
                    : 'Once the next qualifying price cut lands, Decide will surface it here first.'
                }
                href={leadDeal ? `/phones/${leadDeal.phone_slug}` : '/deals'}
                actionLabel={leadDeal ? 'View phone' : 'Open deals'}
                tone="accent"
                ownership={leadDeal?.ownership ?? null}
              />
              <MarketInsightCard
                eyebrow="Budget watch"
                title={budgetLead?.phone_name ?? `No live pick under ${formatNairaCompact(BUDGET_WATCH_CAP_NGN)}`}
                description={
                  budgetLead
                    ? `Currently ${formatNairaCompact(budgetLead.current_price_ngn)} after a ${formatNairaCompact(budgetLead.change_amount_ngn)} drop. Good place to start if affordability matters before everything else.`
                    : 'Budget-led drops still surface here once the live radar catches a better move inside this range.'
                }
                href={budgetLead ? `/buy-now-or-wait/${budgetLead.phone_slug}` : `/phones?max_price=${BUDGET_WATCH_CAP_NGN}`}
                actionLabel={budgetLead ? 'Read verdict' : 'Browse budget phones'}
                ownership={budgetLead?.ownership ?? null}
              />
              <MarketInsightCard
                eyebrow="Freshest tracked signal"
                title={freshestLead?.phone_name ?? 'Fresh updates land here'}
                description={
                  freshestLead
                    ? `Latest tracked refresh came from ${freshestLead.store === 'jumia' ? 'Jumia' : 'Slot'} ${formatRelativeTime(freshestLead.scraped_at)}. Decide can tell you whether the move is worth acting on now.`
                    : 'When the next fresh store-side shift lands, this card will point straight at it.'
                }
                href={freshestLead ? `/buy-now-or-wait/${freshestLead.phone_slug}` : '/deals/today'}
                actionLabel={freshestLead ? 'Check buy or wait' : 'Open today'}
                ownership={freshestLead?.ownership ?? null}
              />
            </div>
          </div>
        </section>
      )}

      {showcasePhones.length > 0 && (
        <section className="border-b border-border bg-surface px-4 py-20">
          <div className="mx-auto max-w-6xl space-y-8">
            <ShortlistBuilderPanel
              contextLabel="Showcase workflow"
              title="Start from a broader mix, not one brand lane"
              description="This homepage mix is now curated to give you stronger cross-brand starting points. Save the phones that still look strong, then let Watchlist and Compare narrow the field properly."
            />
            <PhoneGrid
              phones={showcasePhones}
              signalsBySlug={signalsBySlug}
              title="Worth starting with"
              subtitle="A curated cross-brand mix carrying live Nigerian price movement and quick Decide verdict cues before you even open the detail page."
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/deals/today"
                    className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
                  >
                    Today's radar
                  </Link>
                  <Link
                    href="/phones"
                    className="text-sm font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
                  >
                    View all phones
                  </Link>
                </div>
              }
            />

            {showcaseCompareSuggestions.length > 0 ? (
              <section className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    Featured head-to-heads
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-text-primary">
                    Good starting comparisons from the homepage mix
                  </h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                    If two phones keep surviving your first look, move them into a direct showdown instead of reopening the catalog from scratch.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {showcaseCompareSuggestions.map((suggestion) => (
                    <ShowcaseCompareCard
                      key={`${suggestion.left.slug}-${suggestion.right.slug}`}
                      suggestion={suggestion}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      )}

      <section className="border-b border-border px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">How it works</p>
            <h2 className="text-3xl font-black tracking-tight text-text-primary">
              Three steps to a clearer decision
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <HowItWorksStep
                key={step.title}
                number={index + 1}
                eyebrow={step.eyebrow}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Why Decide</p>
            <h2 className="text-3xl font-black tracking-tight text-text-primary">
              Built for Nigerian buyers
            </h2>
            <p className="mx-auto max-w-lg text-base text-text-secondary">
              GSMArena gives you the spec sheet. Decide gives you the spec sheet, the live
              Nigerian price story, the buying verdict, and the local ownership context.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item) => (
              <DifferentiatorCard
                key={item.title}
                eyebrow={item.eyebrow}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Phone analyzer
                </p>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-text-primary">
                  Already have a phone in mind?
                </h2>
                <p className="text-base leading-relaxed text-text-secondary">
                  Search any phone, enter your budget and use case, and let Decide tell you whether
                  the current price, support profile, and tradeoffs still make sense.
                </p>
              </div>

              <ul className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                {[
                  'Match score grounded in fit, not hype',
                  'Clear reasons why it works or misses',
                  'Gray-market and aging-device warnings',
                  'Better alternatives when the current pick is weak',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/analyze"
                className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-7 text-sm font-bold tracking-wide text-navy-800 transition-all duration-fast hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Analyze a phone
              </Link>
            </div>

            <div className="w-full shrink-0 sm:w-80">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                      Decide read
                    </p>
                    <p className="mt-1 text-base font-bold text-text-primary">Samsung Galaxy A55 5G</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">87%</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">match</p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-surfaceHigh">
                      <div className="h-full w-[87%] rounded-full bg-emerald-500" />
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                      Fits your budget with room left over.
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-border bg-surfaceHigh px-4 py-3">
                    <AnalyzerSignal label="Why it works" value="Strong camera for photos and reels" tone="positive" />
                    <AnalyzerSignal label="Ownership" value="Excellent local Samsung support" tone="positive" />
                    <AnalyzerSignal label="Check first" value="Still compare current price timing before buying" tone="neutral" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 space-y-2 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Every budget</p>
            <h2 className="text-3xl font-black tracking-tight text-text-primary">
              From N30k to N800k+
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {BUDGET_RANGES.map((range) => (
              <Link
                key={range.label}
                href={`/phones?max_price=${range.max}`}
                className="group flex flex-col items-center gap-2 rounded-md border border-border bg-bg p-4 text-center transition-all duration-fast hover:border-accent/40 hover:bg-tealTint"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400 transition-colors duration-fast group-hover:text-accent">
                  {range.label}
                </span>
                <span className="text-sm font-black text-text-primary">{range.display}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-10 text-center md:pb-10 md:pt-12">
        <div className="mx-auto max-w-xl space-y-5">
          <h2 className="text-4xl font-black leading-tight tracking-tight text-text-primary">
            Ready to decide?
          </h2>
          <p className="text-base text-text-secondary">
            Start with the assistant, the live radar, or the analyzer. The point is to buy with a
            clearer read than you had before you opened Decide.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/assistant"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-10 text-base font-bold tracking-wide text-navy-800 transition-all duration-fast hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Find my phone
            </Link>
            <Link
              href="/deals/today"
              className="inline-flex h-12 items-center justify-center rounded-md border border-border px-8 text-base font-medium text-text-secondary transition-all duration-fast hover:border-borderHigh hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Open deals today
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const START_PATHS = [
  {
    eyebrow: 'Guided path',
    title: 'Need a phone recommendation from scratch?',
    description:
      'Use the advisor when you know your budget and priorities but not the exact phone yet.',
    highlight: 'first-time shoppers and undecided buyers',
    href: '/assistant',
    actionLabel: 'Start guided advisor',
    accent: true,
  },
  {
    eyebrow: 'Deals first',
    title: 'Already tracking price cuts?',
    description:
      'Open the daily radar when timing matters more than browsing every phone in the catalog.',
    highlight: 'buyers waiting for a strong live drop before purchasing',
    href: '/deals/today',
    actionLabel: "Open today's shortlist",
    accent: false,
  },
  {
    eyebrow: 'Direct verdict',
    title: 'Already have a phone in mind?',
    description:
      'Jump straight into Analyze if you want a cleaner yes, no, or maybe on one specific model.',
    highlight: 'quick tradeoff checks and better-alternative discovery',
    href: '/analyze',
    actionLabel: 'Analyze a phone',
    accent: false,
  },
  {
    eyebrow: 'Head to head',
    title: 'Choosing between two phones?',
    description:
      'Go straight to Compare when your shortlist is already down to two finalists.',
    highlight: 'buyers deciding which option wins for their money',
    href: '/compare',
    actionLabel: 'Compare two phones',
    accent: false,
  },
] as const

const HOW_IT_WORKS = [
  {
    eyebrow: 'Preferences first',
    title: 'Tell Decide what matters',
    description:
      'Start from your budget, OS, brand preference, and what you care about most right now.',
  },
  {
    eyebrow: 'Decision layer',
    title: 'Decide scores the field',
    description:
      'The engine weighs value, pricing, support, and risk so the shortlist is sharper than a plain spec sort.',
  },
  {
    eyebrow: 'Buy smarter',
    title: 'Check timing before you pay',
    description:
      'Use live price drops, verdict pages, and store context to decide whether to buy now, wait, or switch phones.',
  },
]
const DIFFERENTIATORS = [
  {
    eyebrow: 'Pricing',
    title: 'Real Nigerian prices',
    description:
      'Tracked from Jumia and Slot instead of showing foreign prices converted at the wrong moment or exchange rate.',
  },
  {
    eyebrow: 'Risk',
    title: 'Gray-market warnings',
    description:
      'Decide flags when ownership risk is high so the unit and seller get the attention they deserve.',
  },
  {
    eyebrow: 'Verdicts',
    title: 'Honest phone verdicts',
    description:
      'Buy now or wait and still-worth-it pages turn raw phone data into clearer purchase timing and value calls.',
  },
  {
    eyebrow: 'Support',
    title: 'Local support reality',
    description:
      'Service-center quality and update runway matter after the unboxing too, especially in this market.',
  },
  {
    eyebrow: 'Ranking',
    title: 'Decision-first ordering',
    description:
      'Recommendations are built around fit, value, timing, and ownership context instead of pure popularity.',
  },
]

const BUDGET_RANGES = [
  { label: 'Entry', display: 'Under N80k', max: 80_000 },
  { label: 'Mid-range', display: 'N80k - N150k', max: 150_000 },
  { label: 'Premium', display: 'N150k - N300k', max: 300_000 },
  { label: 'High-end', display: 'N300k - N500k', max: 500_000 },
  { label: 'Flagship', display: 'N500k+', max: 10_000_000 },
]

interface HeroStatProps {
  label: string
  value: string
}

const HeroStat = ({ label, value }: HeroStatProps) => (
  <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

interface DownloadTrustStatProps {
  label: string
  value: string
}

const DownloadTrustStat = ({ label, value }: DownloadTrustStatProps) => (
  <div className="min-w-0">
    <p className="truncate text-sm font-black text-text-primary">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
  </div>
)

interface SecurityCheckCardProps {
  src: string
  label: string
  status: string
}

const SecurityCheckCard = ({ src, label, status }: SecurityCheckCardProps) => (
  <div className="flex items-center gap-3 rounded-md border border-border bg-surfaceHigh p-2.5">
    <img
      src={src}
      alt={`${label}: ${status}`}
      className="h-14 w-20 shrink-0 rounded-md object-cover"
    />
    <div className="min-w-0">
      <p className="truncate text-xs font-black text-text-primary">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
        {status}
      </p>
    </div>
  </div>
)

interface HeroMarketPulseProps {
  leadDeal: PriceDropRadarItem | null
  budgetLead: PriceDropRadarItem | null
  freshestLead: PriceDropRadarItem | null
  generatedAt: string | null
}

const HeroMarketPulse = ({
  leadDeal,
  budgetLead,
  freshestLead,
  generatedAt,
}: HeroMarketPulseProps) => (
  <div className="overflow-hidden rounded-[28px] border border-borderHigh bg-white/85 shadow-lg shadow-teal-900/5 backdrop-blur">
    <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-5">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Today's market pulse</p>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-text-primary">
            Decide is already watching the market
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            Let the live radar tell you where pricing moved before you commit to a phone or a store.
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-4 px-6 py-5">
      <PulseRow
        eyebrow="Biggest move"
        title={leadDeal?.phone_name ?? 'Waiting for the next standout drop'}
        description={
          leadDeal
            ? `${formatNairaCompact(leadDeal.change_amount_ngn)} lower on ${leadDeal.store === 'jumia' ? 'Jumia' : 'Slot'} now.`
            : 'Once the next qualifying drop lands, it will show up here.'
        }
        href={leadDeal ? `/phones/${leadDeal.phone_slug}` : '/deals'}
        actionLabel={leadDeal ? 'View phone' : 'Open deals'}
      />
      <PulseRow
        eyebrow="Budget watch"
        title={budgetLead?.phone_name ?? `Watching sub-${formatNairaCompact(BUDGET_WATCH_CAP_NGN)} deals`}
        description={
          budgetLead
            ? `Now ${formatNairaCompact(budgetLead.current_price_ngn)} after a live cut.`
            : 'A stronger budget-side signal will surface here once the radar catches one.'
        }
        href={budgetLead ? `/buy-now-or-wait/${budgetLead.phone_slug}` : `/phones?max_price=${BUDGET_WATCH_CAP_NGN}`}
        actionLabel={budgetLead ? 'Read verdict' : 'Browse budget phones'}
      />
      <PulseRow
        eyebrow="Freshest scan"
        title={generatedAt ? `Radar refreshed ${formatRelativeTime(generatedAt)}` : 'Waiting for radar refresh'}
        description={
          freshestLead
            ? `${freshestLead.phone_name} was part of the latest tracked update.`
            : 'The next tracked store update will anchor this row.'
        }
        href={freshestLead ? `/buy-now-or-wait/${freshestLead.phone_slug}` : '/deals/today'}
        actionLabel={freshestLead ? 'Check buy or wait' : 'Open today'}
      />
    </div>
  </div>
)

interface PulseRowProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
}

const PulseRow = ({ eyebrow, title, description, href, actionLabel }: PulseRowProps) => (
  <div className="rounded-2xl border border-border bg-surface px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{eyebrow}</p>
    <h3 className="mt-1 text-base font-bold tracking-tight text-text-primary">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
    <Link
      href={href}
      className="mt-3 inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
    >
      {actionLabel}
    </Link>
  </div>
)
interface StartPathCardProps {
  index: number
  eyebrow: string
  title: string
  description: string
  highlight: string
  href: string
  actionLabel: string
  accent: boolean
}

const StartPathCard = ({
  index,
  eyebrow,
  title,
  description,
  highlight,
  href,
  actionLabel,
  accent,
}: StartPathCardProps) => (
  <section
    className={[
      'flex h-full flex-col gap-4 rounded-3xl border px-5 py-5 shadow-sm transition-colors duration-fast',
      accent
        ? 'border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface'
        : 'border-border bg-white hover:border-borderHigh',
    ].join(' ')}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h3 className="text-xl font-black tracking-tight text-text-primary">{title}</h3>
      </div>
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-accent/20 bg-accent-subtle px-2 text-xs font-black text-accent">
        0{index + 1}
      </span>
    </div>

    <p className="text-sm leading-relaxed text-text-secondary">{description}</p>

    <div className="rounded-2xl border border-border bg-white/80 px-3 py-3 text-sm text-text-secondary">
      <span className="font-semibold text-text-primary">Best for:</span> {highlight}
    </div>

    <Link
      href={href}
      className="mt-auto inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
    >
      {actionLabel}
    </Link>
  </section>
)

interface MarketInsightCardProps {
  eyebrow: string
  title: string
  description: string
  href: string
  actionLabel: string
  tone?: 'accent' | 'default'
  ownership?: PriceDropRadarItem['ownership'] | null
}

const MarketInsightCard = ({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
  tone = 'default',
  ownership = null,
}: MarketInsightCardProps) => (
  <section
    className={[
      'rounded-3xl border px-5 py-5 shadow-sm',
      tone === 'accent'
        ? 'border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface'
        : 'border-border bg-white',
    ].join(' ')}
  >
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-text-primary">{title}</h2>
        <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
      {ownership ? (
        <div className="space-y-2 rounded-2xl border border-borderHigh bg-surfaceHigh px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            Long-term ownership
          </p>
          <div className="flex flex-wrap gap-2">
            <OwnershipPill
              label={SUPPORT_LABELS[ownership.longevity_signal.support_outlook]}
              tone={getSupportTone(ownership.longevity_signal.support_outlook)}
            />
            <OwnershipPill
              label={REPAIR_LABELS[ownership.repair_support_signal.outlook]}
              tone={getRepairTone(ownership.repair_support_signal.outlook)}
            />
            <OwnershipPill
              label={RESALE_LABELS[ownership.resale_value_signal.outlook]}
              tone={getResaleTone(ownership.resale_value_signal.outlook)}
            />
          </div>
        </div>
      ) : null}
      <Link
        href={href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        {actionLabel}
      </Link>
    </div>
  </section>
)

const SIGNAL_TONE_CLASSES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-surface text-text-secondary',
} as const

const getSupportTone = (
  outlook: NonNullable<PriceDropRadarItem['ownership']>['longevity_signal']['support_outlook']
) => {
  if (outlook === 'strong' || outlook === 'good') return SIGNAL_TONE_CLASSES.positive
  if (outlook === 'limited') return SIGNAL_TONE_CLASSES.caution
  if (outlook === 'expired') return SIGNAL_TONE_CLASSES.warning
  return SIGNAL_TONE_CLASSES.neutral
}

const getRepairTone = (
  outlook: NonNullable<PriceDropRadarItem['ownership']>['repair_support_signal']['outlook']
) => {
  if (outlook === 'strong') return SIGNAL_TONE_CLASSES.positive
  if (outlook === 'fair') return SIGNAL_TONE_CLASSES.caution
  if (outlook === 'weak') return SIGNAL_TONE_CLASSES.warning
  return SIGNAL_TONE_CLASSES.neutral
}

const getResaleTone = (
  outlook: NonNullable<PriceDropRadarItem['ownership']>['resale_value_signal']['outlook']
) => {
  if (outlook === 'strong') return SIGNAL_TONE_CLASSES.positive
  if (outlook === 'fair') return SIGNAL_TONE_CLASSES.caution
  if (outlook === 'weak') return SIGNAL_TONE_CLASSES.warning
  return SIGNAL_TONE_CLASSES.neutral
}

const OwnershipPill = ({
  label,
  tone,
}: {
  label: string
  tone: string
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${tone}`}
  >
    {label}
  </span>
)

const ShowcaseCompareCard = ({
  suggestion,
}: {
  suggestion: CompareSuggestion
}) => (
  <section className="rounded-2xl border border-borderHigh bg-white px-5 py-5 shadow-sm">
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          Compare next
        </p>
        <h3 className="text-xl font-black tracking-tight text-text-primary">
          {suggestion.left.name} vs {suggestion.right.name}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {suggestion.reason}
        </p>
      </div>

      <Link
        href={suggestion.href}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Open comparison
      </Link>
    </div>
  </section>
)

interface HowItWorksStepProps {
  number: number
  eyebrow: string
  title: string
  description: string
}

const HowItWorksStep = ({ number, eyebrow, title, description }: HowItWorksStepProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/20 bg-accent-subtle text-xs font-black text-accent"
        aria-hidden="true"
      >
        {number}
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">{eyebrow}</span>
    </div>
    <div className="space-y-1">
      <h3 className="text-base font-bold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  </div>
)

interface DifferentiatorCardProps {
  eyebrow: string
  title: string
  description: string
}

const DifferentiatorCard = ({ eyebrow, title, description }: DifferentiatorCardProps) => (
  <div className="flex gap-4 rounded-2xl border border-border bg-bg p-4 transition-colors duration-fast hover:border-borderHigh">
    <span
      className="mt-0.5 inline-flex h-8 items-center rounded-full border border-accent/20 bg-accent-subtle px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent"
      aria-hidden="true"
    >
      {eyebrow}
    </span>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  </div>
)

interface AnalyzerSignalProps {
  label: string
  value: string
  tone: 'positive' | 'neutral'
}

const AnalyzerSignal = ({ label, value, tone }: AnalyzerSignalProps) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
    <p className={tone === 'positive' ? 'text-sm font-medium text-text-primary' : 'text-sm text-text-secondary'}>
      {value}
    </p>
  </div>
)
