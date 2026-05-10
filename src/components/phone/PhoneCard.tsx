// decide-web/src/components/phone/PhoneCard.tsx
// The primary phone display unit used across browse, search,
// featured, and brand pages.
// Shows the key specs a Nigerian buyer cares about at a glance —
// price, battery, camera, storage, and market availability.

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge, Tooltip } from '@/components/ui'
import { PriceChangeBadge } from '@/components/market/PriceChangeBadge'
import { StarRating } from '@/components/phone/StarRating'
import { SaveButton } from '@/components/phone/SaveButton'
import { BrandLogo, PriceDisplay, AvailabilityBadge } from '@/components/shared'
import type { RelatedCompareAction } from '@/lib/relatedCompare'
import { mapToComparePhone } from '@/lib/compareContext'
import { useCompareStore } from '@/store/compareStore'
import { formatGb, formatMah, formatMp, formatHz } from '@/lib/formatters'
import { buildVersionedImageUrl } from '@/lib/imageUrl'
import type {
  CatalogDiscoverySignal,
  PhoneCard as PhoneCardType,
} from '@/types'

interface PhoneCardProps {
  phone: PhoneCardType
  signal?: CatalogDiscoverySignal
  compareAction?: RelatedCompareAction<PhoneCardType> | null
  featured?: boolean
  className?: string
}

export const PhoneCard = ({
  phone,
  signal,
  compareAction,
  featured = false,
  className = '',
}: PhoneCardProps) => {
  const addPhone = useCompareStore((s) => s.addPhone)
  const removePhone = useCompareStore((s) => s.removePhone)
  const isInTray = useCompareStore((s) => s.isInTray(phone.slug))
  const isTrayFull = useCompareStore((s) => s.isTrayFull())
  const hasTrustedPrice = (phone.prices ?? []).length > 0
  const hasJijiContext = (phone.marketplace_signal_count ?? 0) > 0
  const versionedImageUrl = buildVersionedImageUrl(phone.image_url, phone.updated_at)

  const handleCompareToggle = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()

    if (isInTray) {
      removePhone(phone.slug)
    } else {
      addPhone(mapToComparePhone(phone))
    }
  }

  const canAddToTray = !isTrayFull || isInTray

  return (
    <article
      className={[
        'group relative bg-surface border rounded-lg overflow-hidden',
        'transition-all duration-normal',
        'hover:border-borderHigh hover:shadow-md',
        featured ? 'border-teal-600/30' : 'border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Featured teal top bar — replaces border glow */}
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-600 to-teal-400 z-10" />
      )}

      <Link
        href={`/phones/${phone.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-label={`View details for ${phone.name}`}
      >
        {/* Image area — tealTint on featured, surfaceHigh otherwise */}
        <div
          className={[
            'relative flex items-center justify-center h-44 overflow-hidden',
            featured ? 'bg-tealTint' : 'bg-surfaceHigh',
          ].join(' ')}
        >
          {versionedImageUrl && !versionedImageUrl.includes('placeholder') ? (
            <Image
              src={versionedImageUrl}
              alt={phone.name}
              width={160}
              height={160}
              className="object-contain w-32 h-32 transition-transform duration-slow group-hover:scale-105"
            />
          ) : (
            <PhonePlaceholder />
          )}

          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 left-3">
              <Badge variant="accent">Featured</Badge>
            </div>
          )}

          {/* 5G badge */}
          {phone.has_5g && (
            <div className="absolute top-3 right-3">
              <Badge variant="default">5G</Badge>
            </div>
          )}

          {/* Save button */}
          <div className="absolute bottom-3 right-3" onClick={(e) => e.preventDefault()}>
            <SaveButton phoneId={phone.id} phoneName={phone.name} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Brand and name */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <BrandLogo
                brandSlug={phone.brand_name.toLowerCase().split(' ')[0]}
                brandName={phone.brand_name}
                logoUrl={phone.brand_logo_url}
                size="xs"
              />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                {phone.brand_name}
              </span>
            </div>
            <h3 className="text-sm font-bold text-text-primary leading-snug line-clamp-2">
              {phone.name}
            </h3>
          </div>

          {/* Key specs row — slate pills, not teal */}
          <div className="flex flex-wrap gap-1.5">
            {phone.battery_mah && (
              <Tooltip content="Battery capacity" position="top">
                <SpecPill icon="🔋" value={formatMah(phone.battery_mah)} />
              </Tooltip>
            )}
            {phone.main_camera_mp && (
              <Tooltip content="Main camera" position="top">
                <SpecPill icon="📷" value={formatMp(phone.main_camera_mp)} />
              </Tooltip>
            )}
            {phone.ram_gb && (
              <Tooltip content="RAM" position="top">
                <SpecPill icon="⚡" value={formatGb(phone.ram_gb)} />
              </Tooltip>
            )}
            {phone.refresh_rate_hz && phone.refresh_rate_hz >= 90 && (
              <Tooltip content="Display refresh rate" position="top">
                <SpecPill icon="🖥️" value={formatHz(phone.refresh_rate_hz)} />
              </Tooltip>
            )}
          </div>

          {/* Tags — slate only, teal reserved for interactive */}
          {(phone.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(phone.tags ?? []).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
              {(phone.tags ?? []).length > 2 && (
                <Badge variant="muted">+{phone.tags.length - 2}</Badge>
              )}
            </div>
          )}

          {signal && (
            <div className="space-y-2 rounded-xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {signal.price_drop ? (
                  <PriceChangeBadge
                    amount_ngn={signal.price_drop.amount_ngn}
                    percent={signal.price_drop.percent}
                    compact
                  />
                ) : null}
                <SignalPill
                  label={signal.verdict.label}
                  tone={signal.verdict.tone}
                />
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                {signal.price_drop ? (
                  <>
                    Recently cheaper on{' '}
                    <span className="font-semibold text-text-primary">
                      {signal.price_drop.store === 'jumia' ? 'Jumia' : 'Slot'}
                    </span>
                    . {signal.verdict.summary}
                  </>
                ) : (
                  signal.verdict.summary
                )}
              </p>
            </div>
          )}

          {/* Rating */}
          {Number(phone.review_count) > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Number(phone.average_rating)} size="sm" />
              <span className="text-xs text-text-muted">
                {Number(phone.average_rating).toFixed(1)}
                <span className="ml-1">({phone.review_count})</span>
              </span>
            </div>
          )}

          {/* Price and availability */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <PriceDisplay prices={phone.prices} compact compactStoreSummary />
            <AvailabilityBadge risk={phone.gray_market_risk} compact />
          </div>

          {!hasTrustedPrice && hasJijiContext ? (
            <p className="text-xs leading-relaxed text-amber-700">
              No trusted retail price yet. Open the details page to check Jiji used-market prices and context.
            </p>
          ) : null}
        </div>
      </Link>

      {signal || compareAction ? (
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3 text-xs">
          {signal ? (
            <Link
              href={signal.verdict.href}
              className="font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
            >
              {signal.verdict.link_label}
            </Link>
          ) : null}
          {compareAction ? (
            <Link
              href={compareAction.href}
              className="max-w-full truncate font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
              title={
                compareAction.compare_context
                  ? `Compare with ${compareAction.counterpart.name}: ${compareAction.compare_context}`
                  : compareAction.reason
                    ? `Compare with ${compareAction.counterpart.name}: ${compareAction.reason}`
                    : `Compare with ${compareAction.counterpart.name}`
              }
            >
              Compare with {compareAction.counterpart.name}
            </Link>
          ) : null}
          {signal?.price_drop ? (
            <Link
              href={signal.price_drop.href}
              className="font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
            >
              Live drop context
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Compare toggle */}
      <div className="px-4 pb-4">
        <Tooltip
          content={
            isInTray
              ? 'Remove from comparison'
              : isTrayFull
                ? 'Remove a phone to add another'
                : 'Add to comparison'
          }
          position="top"
        >
          <button
            onClick={handleCompareToggle}
            disabled={!canAddToTray}
            className={[
              'w-full h-8 rounded-md text-xs font-semibold tracking-wide',
              'border transition-all duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isInTray
                ? 'border-accent text-accent bg-accent-subtle hover:bg-accent hover:text-navy-800'
                : 'border-border text-slate-400 hover:border-borderHigh hover:text-text-primary',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={
              isInTray
                ? `Remove ${phone.name} from comparison`
                : `Add ${phone.name} to comparison`
            }
            aria-pressed={isInTray}
          >
            {isInTray ? '✓ In comparison' : 'Compare'}
          </button>
        </Tooltip>
      </div>
    </article>
  )
}

// ── SpecPill ──────────────────────────────────────────────────────────────────
// Slate background — not teal. Teal is reserved for interactive elements only.

interface SpecPillProps {
  icon: string
  value: string
}

const SpecPill = ({ icon, value }: SpecPillProps) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-surfaceHigh border border-border text-xs text-slate-700">
    <span aria-hidden="true">{icon}</span>
    {value}
  </span>
)

interface SignalPillProps {
  label: string
  tone: 'positive' | 'neutral' | 'warning'
}

const SignalPill = ({ label, tone }: SignalPillProps) => {
  const toneClass =
    tone === 'positive'
      ? 'border-accent/15 bg-white text-accent'
      : tone === 'warning'
        ? 'border-warning/20 bg-warning-subtle text-warning'
        : 'border-border bg-surfaceHigh text-text-primary'

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em]',
        toneClass,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

// ── PhonePlaceholder ──────────────────────────────────────────────────────────

const PhonePlaceholder = () => (
  <div className="w-32 h-32 flex items-center justify-center text-text-muted">
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" />
    </svg>
  </div>
)
