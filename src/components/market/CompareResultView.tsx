import React from 'react'
import Link from 'next/link'
import { CompareSpecRow, ScoreBarGroup } from '@/components/phone'
import { PriceDisplay } from '@/components/shared'
import { Card, Divider } from '@/components/ui'
import type { CompareResult } from '@/types'
import { CompareSummaryCard } from './CompareSummaryCard'
import { CompareShareActions } from './CompareShareActions'
import type { CompareSnapshotData } from './compareSnapshot'

interface CompareResultViewProps {
  result: CompareResult
  actionHref: string
  actionLabel: string
  shareHref: string
}

const SECTION_ORDER: Array<{
  title: string
  labels: string[]
}> = [
  {
    title: 'Price and display',
    labels: [
      'Lowest Current Price',
      'Tracked pricing focus',
      'Display Size',
      'Display Type',
      'Refresh Rate',
    ],
  },
  {
    title: 'Performance',
    labels: ['Chipset', 'RAM', 'Storage', 'Performance Score'],
  },
  {
    title: 'Camera',
    labels: [
      'Main Camera',
      'Camera Setup',
      'Selfie Camera',
      '4K Video',
      'Camera Score',
    ],
  },
  {
    title: 'Battery',
    labels: [
      'Battery Capacity',
      'Charging Speed',
      'Wireless Charging',
      'Battery Score',
    ],
  },
  {
    title: 'Build and comfort',
    labels: ['Weight', 'IP Rating', 'Build Score'],
  },
  {
    title: 'Connectivity and support',
    labels: ['5G', 'NFC', 'Dual SIM', 'Gray Market Risk', 'Local Support'],
  },
  {
    title: 'Long-term ownership',
    labels: ['Support runway', 'Repair outlook', 'Resale confidence'],
  },
  {
    title: 'Software',
    labels: ['OS Version', 'OS Update Years'],
  },
]

const getWinnerSide = (
  winner: string | null,
  slugA: string,
  slugB: string
): 'a' | 'b' | null => {
  if (winner === slugA) return 'a'
  if (winner === slugB) return 'b'
  return null
}

const formatLowestCurrentPrice = (prices: CompareResult['phone_a']['prices']) => {
  if (prices.length === 0) {
    return 'Current price pending'
  }

  const lowest = prices.reduce(
    (best, price) => Math.min(best, price.price_ngn),
    prices[0].price_ngn
  )

  return `₦${lowest.toLocaleString('en-NG')}`
}

export const CompareResultView = ({
  result,
  actionHref,
  actionLabel,
  shareHref,
}: CompareResultViewProps) => {
  const rowMap = new Map(result.rows.map((row) => [row.label, row]))
  const shareTitle = `${result.phone_a.name} vs ${result.phone_b.name} - Decide`
  const shareText = `Compare ${result.phone_a.name} and ${result.phone_b.name} with Nigerian prices, Decide scores, and the differences that matter before you buy.`
  const winnerName =
    result.overall_winner === result.phone_a.slug
      ? result.phone_a.name
      : result.overall_winner === result.phone_b.slug
        ? result.phone_b.name
        : 'Close call'
  const downloadSnapshot: CompareSnapshotData = {
    leftBrand: result.phone_a.brand_name,
    leftName: result.phone_a.name,
    leftVariant:
      result.focused_variants.phone_a.label || 'Tracked compare configuration',
    leftPrice: formatLowestCurrentPrice(
      result.focused_variants.phone_a.prices.length > 0
        ? result.focused_variants.phone_a.prices
        : result.phone_a.prices
    ),
    rightBrand: result.phone_b.brand_name,
    rightName: result.phone_b.name,
    rightVariant:
      result.focused_variants.phone_b.label || 'Tracked compare configuration',
    rightPrice: formatLowestCurrentPrice(
      result.focused_variants.phone_b.prices.length > 0
        ? result.focused_variants.phone_b.prices
        : result.phone_b.prices
    ),
    headline: result.summary.headline,
    winnerLabel: `Overall: ${winnerName}`,
  }
  const downloadName = `${result.phone_a.slug}-vs-${result.phone_b.slug}-decide-compare`

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Head-to-head comparison
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
                {result.phone_a.name} vs {result.phone_b.name}
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                Compare Nigerian prices, Decide scores, and the differences that
                actually change which phone makes more sense to buy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CompareShareActions
              shareHref={shareHref}
              title={shareTitle}
              text={shareText}
              downloadSnapshot={downloadSnapshot}
              downloadName={downloadName}
            />
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center rounded-full border border-accent/15 bg-tealTint px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-accent transition-colors duration-fast hover:border-accent/25 hover:bg-accent-subtle"
            >
              {actionLabel}
            </Link>
          </div>
        </div>
      </header>

      <CompareSummaryCard result={result} />

      <section className="grid gap-4 xl:grid-cols-2">
        <ComparePhoneCard
          phone={result.phone_a}
          focusedVariant={result.focused_variants.phone_a}
          isWinner={result.overall_winner === result.phone_a.slug}
        />
        <ComparePhoneCard
          phone={result.phone_b}
          focusedVariant={result.focused_variants.phone_b}
          isWinner={result.overall_winner === result.phone_b.slug}
        />
      </section>

      <Divider />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            Long-term ownership
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            Specs and price are only the first layer. This section compares how
            each phone should feel after the unboxing too: support runway,
            repair friction, and resale confidence in the local market.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <OwnershipCompareCard
            phoneName={result.phone_a.name}
            ownership={result.ownership.phone_a}
          />
          <OwnershipCompareCard
            phoneName={result.phone_b.name}
            ownership={result.ownership.phone_b}
          />
        </div>
      </section>

      <Divider />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            Decide scores
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            These scores keep the comparison grounded in how the phones perform
            in day-to-day ownership, not just on paper.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="space-y-4 border-borderHigh bg-surface">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                {result.phone_a.brand_name}
              </p>
              <h3 className="text-lg font-black tracking-tight text-text-primary">
                {result.phone_a.name}
              </h3>
            </div>
            <ScoreBarGroup
              scores={{
                battery: result.phone_a.score_battery,
                camera: result.phone_a.score_camera,
                performance: result.phone_a.score_performance,
                build: result.phone_a.score_build,
              }}
            />
          </Card>

          <Card className="space-y-4 border-borderHigh bg-surface">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                {result.phone_b.brand_name}
              </p>
              <h3 className="text-lg font-black tracking-tight text-text-primary">
                {result.phone_b.name}
              </h3>
            </div>
            <ScoreBarGroup
              scores={{
                battery: result.phone_b.score_battery,
                camera: result.phone_b.score_camera,
                performance: result.phone_b.score_performance,
                build: result.phone_b.score_build,
              }}
            />
          </Card>
        </div>
      </section>

      <Divider />

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            Key differences
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            This is the side-by-side table that shows where each phone clearly
            wins, where the gap is small, and where both are effectively even.
          </p>
        </div>

        <div className="space-y-4">
          {SECTION_ORDER.map((section) => {
            const rows = section.labels
              .map((label) => rowMap.get(label))
              .filter((row): row is NonNullable<typeof row> => !!row)

            if (rows.length === 0) {
              return null
            }

            return (
              <Card
                key={section.title}
                className="overflow-hidden border-borderHigh bg-surface p-0"
              >
                <div className="border-b border-border bg-surfaceHigh px-4 py-3 sm:px-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-text-muted">
                    {section.title}
                  </h3>
                </div>

                <div className="px-4 py-2 sm:px-5">
                  {rows.map((row, index) => (
                    <CompareSpecRow
                      key={row.label}
                      label={row.label}
                      valueA={row.phone_a_value}
                      valueB={row.phone_b_value}
                      winner={getWinnerSide(
                        row.winner,
                        result.phone_a.slug,
                        result.phone_b.slug
                      )}
                      divider={index > 0}
                      isPriority={row.is_priority_row}
                    />
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

interface ComparePhoneCardProps {
  phone: CompareResult['phone_a']
  focusedVariant: CompareResult['focused_variants']['phone_a']
  isWinner: boolean
}

const ComparePhoneCard = ({
  phone,
  focusedVariant,
  isWinner,
}: ComparePhoneCardProps) => {
  const focusedPrices =
    focusedVariant.prices.length > 0 ? focusedVariant.prices : phone.prices
  const focusedRam = focusedVariant.ram_gb ?? phone.ram_gb
  const focusedStorage = focusedVariant.storage_gb ?? phone.storage_gb
  const detailHref = focusedVariant.id
    ? `/phones/${phone.slug}?variant_id=${focusedVariant.id}#variant-pricing`
    : `/phones/${phone.slug}`

  return (
    <Card className="space-y-4 border-borderHigh bg-surface">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
            {phone.brand_name}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-text-primary">
            {phone.name}
          </h2>
        </div>

        {isWinner ? (
          <div className="inline-flex items-center rounded-full border border-accent/15 bg-tealTint px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Overall edge
          </div>
        ) : null}
      </div>

      {focusedVariant.label ? (
        <div className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Tracked pricing focus
              </p>
              {focusedVariant.is_default ? (
                <span className="inline-flex items-center rounded-full border border-accent/15 bg-tealTint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                  Default tracked config
                </span>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-text-primary">
              {focusedVariant.label}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              Compare is currently pricing this phone through the tracked
              configuration Decide can support cleanly right now, so the price,
              RAM, and storage rows stay aligned.
            </p>
          </div>
        </div>
      ) : null}

      <PriceDisplay
        prices={focusedPrices}
        compact
        compactStoreSummary
        priceScopeLabel={focusedVariant.label}
        hideVariantSummary={!!focusedVariant.label}
      />

      <div className="flex flex-wrap gap-2">
        <StatPill label="RAM" value={focusedRam ? `${focusedRam}GB` : 'n/a'} />
        <StatPill
          label="Storage"
          value={focusedStorage ? `${focusedStorage}GB` : 'n/a'}
        />
        <StatPill
          label="Battery"
          value={phone.battery_mah ? `${phone.battery_mah}mAh` : 'n/a'}
        />
        <StatPill
          label="Display"
          value={phone.refresh_rate_hz ? `${phone.refresh_rate_hz}Hz` : 'n/a'}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={detailHref}
          className="font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
        >
          View this configuration
        </Link>
        {phone.variants && phone.variants.length > 1 ? (
          <Link
            href={`/phones/${phone.slug}#variant-pricing`}
            className="font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
          >
            View other tracked variants
          </Link>
        ) : null}
      </div>
    </Card>
  )
}

interface StatPillProps {
  label: string
  value: string
}

const StatPill = ({ label, value }: StatPillProps) => (
  <div className="rounded-full border border-border bg-surfaceHigh px-3 py-1.5 text-xs">
    <span className="font-bold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </span>
    <span className="ml-2 font-semibold text-text-primary">{value}</span>
  </div>
)

const SUPPORT_LABELS: Record<
  CompareResult['ownership']['phone_a']['longevity_signal']['support_outlook'],
  string
> = {
  strong: 'Strong support runway',
  good: 'Healthy support runway',
  limited: 'Limited support runway',
  expired: 'Support ending',
  unknown: 'Support unclear',
}

const REPAIR_LABELS: Record<
  CompareResult['ownership']['phone_a']['repair_support_signal']['outlook'],
  string
> = {
  strong: 'Repair friendly',
  fair: 'Repair mixed',
  weak: 'Repair risk',
  unknown: 'Repair unclear',
}

const RESALE_LABELS: Record<
  CompareResult['ownership']['phone_a']['resale_value_signal']['outlook'],
  string
> = {
  strong: 'Resale strong',
  fair: 'Resale fair',
  weak: 'Resale weak',
  unknown: 'Resale unclear',
}

const SIGNAL_TONE_MAP = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-surfaceHigh text-text-secondary',
} as const

const getSupportTone = (
  outlook: CompareResult['ownership']['phone_a']['longevity_signal']['support_outlook']
) => {
  if (outlook === 'strong' || outlook === 'good') return SIGNAL_TONE_MAP.positive
  if (outlook === 'limited') return SIGNAL_TONE_MAP.caution
  if (outlook === 'expired') return SIGNAL_TONE_MAP.warning
  return SIGNAL_TONE_MAP.neutral
}

const getOwnershipTone = (
  outlook:
    | CompareResult['ownership']['phone_a']['repair_support_signal']['outlook']
    | CompareResult['ownership']['phone_a']['resale_value_signal']['outlook']
) => {
  if (outlook === 'strong' || outlook === 'fair') return SIGNAL_TONE_MAP.positive
  if (outlook === 'weak') return SIGNAL_TONE_MAP.warning
  return SIGNAL_TONE_MAP.neutral
}

const OwnershipCompareCard = ({
  phoneName,
  ownership,
}: {
  phoneName: string
  ownership: CompareResult['ownership']['phone_a']
}) => (
  <Card className="space-y-4 border-borderHigh bg-surface">
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
        Ownership read
      </p>
      <h3 className="text-lg font-black tracking-tight text-text-primary">
        {phoneName}
      </h3>
      <p className="text-sm leading-relaxed text-text-secondary">
        These signals are the longer-term layer Decide brings into the compare,
        so the better phone is not reduced to specs alone.
      </p>
    </div>

    <div className="grid gap-3">
      <OwnershipSignalRow
        eyebrow="Support runway"
        title={SUPPORT_LABELS[ownership.longevity_signal.support_outlook]}
        summary={ownership.longevity_signal.summary}
        tone={getSupportTone(ownership.longevity_signal.support_outlook)}
      />
      <OwnershipSignalRow
        eyebrow="Repair reality"
        title={REPAIR_LABELS[ownership.repair_support_signal.outlook]}
        summary={ownership.repair_support_signal.summary}
        tone={getOwnershipTone(ownership.repair_support_signal.outlook)}
      />
      <OwnershipSignalRow
        eyebrow="Resale confidence"
        title={RESALE_LABELS[ownership.resale_value_signal.outlook]}
        summary={ownership.resale_value_signal.summary}
        tone={getOwnershipTone(ownership.resale_value_signal.outlook)}
      />
    </div>
  </Card>
)

const OwnershipSignalRow = ({
  eyebrow,
  title,
  summary,
  tone,
}: {
  eyebrow: string
  title: string
  summary: string
  tone: string
}) => (
  <div className="rounded-2xl border border-border bg-surfaceHigh px-4 py-4">
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
          {eyebrow}
        </p>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${tone}`}
        >
          {title}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
    </div>
  </div>
)
