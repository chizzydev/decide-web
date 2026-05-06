import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PriceAlertButton } from '@/components/phone/PriceAlertButton'
import { SaveButton } from '@/components/phone/SaveButton'
import { Card } from '@/components/ui'
import { formatNaira, formatRelativeTime } from '@/lib/formatters'
import type { RelatedCompareAction } from '@/lib/relatedCompare'
import type { PriceDropRadarItem } from '@/types'
import { PriceChangeBadge } from './PriceChangeBadge'

interface DealCardProps {
  deal: PriceDropRadarItem
  compareAction: RelatedCompareAction<PriceDropRadarItem> | null
}

const STORE_LABELS = {
  jumia: 'Jumia',
  slot: 'Slot',
} as const

const buildDealDetailHref = (deal: PriceDropRadarItem) =>
  deal.variant_id
    ? `/phones/${deal.phone_slug}?variant_id=${deal.variant_id}#variant-pricing`
    : `/phones/${deal.phone_slug}`

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

const SIGNAL_TONE_CLASSES = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  caution: 'border-amber-200 bg-amber-50 text-amber-700',
  warning: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-border bg-surfaceHigh text-text-secondary',
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

export const DealCard = ({ deal, compareAction }: DealCardProps) => {
  const hasRealImage = !!deal.image_url && !deal.image_url.includes('placeholder')
  const storeLabel = STORE_LABELS[deal.store]
  const ownership = deal.ownership
  const detailHref = buildDealDetailHref(deal)

  return (
    <Card className="flex h-full flex-col overflow-hidden border-borderHigh bg-surface p-0 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-4 py-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {storeLabel} drop
          </p>
          <p className="text-xs text-text-muted">
            Updated {formatRelativeTime(deal.scraped_at)}
          </p>
        </div>
        <PriceChangeBadge
          amount_ngn={deal.change_amount_ngn}
          percent={deal.change_percent}
          compact
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-start gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-border bg-surfaceHigh">
            {hasRealImage ? (
              <Image
                src={`${deal.image_url!}?v=${deal.scraped_at}`}
                alt={deal.phone_name}
                width={88}
                height={88}
                className="h-[88px] w-[88px] object-contain"
              />
            ) : (
              <PhoneThumbPlaceholder />
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
              {deal.brand_name}
            </p>
            {deal.variant_label ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {deal.variant_label}
              </p>
            ) : null}
            <Link
              href={detailHref}
              className="block text-lg font-black leading-tight tracking-tight text-text-primary transition-colors duration-fast hover:text-accent"
            >
              {deal.phone_name}
            </Link>
            <p className="text-sm text-text-secondary">
              Was {formatNaira(deal.previous_price_ngn)}, now {formatNaira(deal.current_price_ngn)}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DealStat label="Current price" value={formatNaira(deal.current_price_ngn)} />
          <DealStat label="Previous price" value={formatNaira(deal.previous_price_ngn)} />
        </div>

        {ownership ? (
          <div className="rounded-2xl border border-borderHigh bg-surfaceHigh px-3 py-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Long-term ownership
                </p>
                <p className="text-sm leading-relaxed text-text-secondary">
                  Decide adds the after-purchase layer too, so a live drop does not hide support, repair, or resale tradeoffs.
                </p>
              </div>

              <div className="grid gap-2">
                <OwnershipSignalBadge
                  label="Support runway"
                  value={SUPPORT_LABELS[ownership.longevity_signal.support_outlook]}
                  tone={getSupportTone(ownership.longevity_signal.support_outlook)}
                />
                <OwnershipSignalBadge
                  label="Repair reality"
                  value={REPAIR_LABELS[ownership.repair_support_signal.outlook]}
                  tone={getRepairTone(ownership.repair_support_signal.outlook)}
                />
                <OwnershipSignalBadge
                  label="Resale confidence"
                  value={RESALE_LABELS[ownership.resale_value_signal.outlook]}
                  tone={getResaleTone(ownership.resale_value_signal.outlook)}
                />
              </div>

              <p className="text-xs leading-relaxed text-text-muted">
                {ownership.longevity_signal.summary}
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-accent/15 bg-tealTint px-3 py-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Decide first
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                The drop matters, but the better move is to check Decide&apos;s read before you leave for {storeLabel}. A lower price is only useful if the phone still fits your budget, timing, and tradeoffs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/buy-now-or-wait/${deal.phone_slug}`}
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Read Decide take
              </Link>
              <Link
                href={`/worth-it/${deal.phone_slug}`}
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Still worth it
              </Link>
              <Link
                href={detailHref}
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                View phone
              </Link>
              <Link
                href={compareAction?.href ?? '/compare'}
                title={
                  compareAction
                    ? compareAction.compare_context
                      ? `Compare ${deal.phone_name} with ${compareAction.counterpart.phone_name}: ${compareAction.compare_context}`
                      : `Compare ${deal.phone_name} with ${compareAction.counterpart.phone_name}`
                    : undefined
                }
                className="text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
              >
                {compareAction ? 'Compare with closest match' : 'Compare options'}
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-borderHigh bg-surfaceHigh px-3 py-3">
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="max-w-2xl space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Watch this drop
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                If the move is interesting but you are not ready to buy yet, keep it inside Decide now. Save it to your watchlist or protect it with a target alert before the market shifts again.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <PriceAlertButton
                phoneId={deal.phone_id}
                phoneName={deal.phone_name}
                variantId={deal.variant_id}
                variantLabel={deal.variant_label}
                lowestPrice={deal.current_price_ngn}
                buttonLabel="Set alert"
                triggerVariant="inlineSecondary"
                triggerClassName="w-full min-w-[150px] sm:w-auto"
              />
              <SaveButton
                phoneId={deal.phone_id}
                phoneName={deal.phone_name}
                variant="inline"
                className="w-full min-w-[190px] sm:w-auto"
              />
            </div>
          </div>
        </div>

        {deal.url ? (
          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Store exit
              </p>
              <p className="text-xs leading-relaxed text-text-muted">
                Open the retailer only after the Decide read still checks out.
              </p>
            </div>

            <a
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Open on {storeLabel}
            </a>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

interface DealStatProps {
  label: string
  value: string
}

const DealStat = ({ label, value }: DealStatProps) => (
  <div className="rounded-lg border border-border bg-surfaceHigh px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

interface OwnershipSignalBadgeProps {
  label: string
  value: string
  tone: string
}

const OwnershipSignalBadge = ({
  label,
  value,
  tone,
}: OwnershipSignalBadgeProps) => (
  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
      {label}
    </span>
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${tone}`}
    >
      {value}
    </span>
  </div>
)

const PhoneThumbPlaceholder = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="text-text-muted"
  >
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="18.5" r="1" fill="currentColor" />
  </svg>
)
