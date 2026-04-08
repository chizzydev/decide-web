// decide-web/src/components/assistant/StepBrand.tsx
// Step 2 of the Android path — brand preference selection.
// Skipped entirely on the iOS path (Apple is set automatically).
// Allows the user to express a brand preference or choose
// "No preference" to see all Android phones ranked by fit.

'use client'

import React from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { BrandLogo } from '@/components/shared'
import { ANDROID_BRANDS } from '@/lib/constants'
import type { BrandPreference } from '@/types'

// "No preference" is a valid selection — it tells the scoring engine
// not to apply any brand filter when fetching recommendations.
const NO_PREFERENCE: {
  slug:        BrandPreference
  label:       string
  description: string
} = {
  slug:        'any',
  label:       'No Preference',
  description: 'Show me the best phones regardless of brand',
}

export const StepBrand = () => {
  const { selectBrand, brand_preference } = useAssistant()

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          Step 2
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          Any brand in mind?
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          If you have a preference we will prioritise it.
          Otherwise we will find the best phone across all brands.
        </p>
      </div>

      {/* Brand grid */}
      <div
        className="space-y-3"
        role="group"
        aria-label="Choose a brand preference"
      >
        {/* No preference — full width, at the top */}
        <NoPreferenceCard
          selected={brand_preference === 'any'}
          onSelect={() => selectBrand('any')}
        />

        {/* Brand grid — 2 columns on mobile, 4 on wider screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ANDROID_BRANDS.map((brand) => (
            <BrandCard
              key={brand.slug}
              slug={brand.slug}
              label={brand.label}
              selected={brand_preference === brand.slug}
              onSelect={() => selectBrand(brand.slug as BrandPreference)}
            />
          ))}
        </div>
      </div>

      {/* Helper note */}
      <p className="text-xs text-text-muted text-center">
        You can always compare phones across brands after seeing your results.
      </p>
    </div>
  )
}

// ── NoPreferenceCard ───────────────────────────────────────────

interface NoPreferenceCardProps {
  selected: boolean
  onSelect: () => void
}

const NoPreferenceCard = ({ selected, onSelect }: NoPreferenceCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={[
        'w-full text-left px-4 py-3 rounded-md border',
        'flex items-center justify-between gap-3',
        'transition-all duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'bg-accent-subtle border-accent shadow-accent'
          : 'bg-surface border-border hover:border-borderHigh hover:bg-surfaceHigh',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={NO_PREFERENCE.label}
    >
      <div>
        <p
          className={[
            'text-sm font-bold',
            selected ? 'text-accent' : 'text-text-primary',
          ].join(' ')}
        >
          {NO_PREFERENCE.label}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {NO_PREFERENCE.description}
        </p>
      </div>

      {/* Selected checkmark */}
      {selected && (
        <span
          className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <CheckIcon />
        </span>
      )}
    </button>
  )
}

// ── BrandCard ─────────────────────────────────────────────────

interface BrandCardProps {
  slug:     string
  label:    string
  selected: boolean
  onSelect: () => void
}

const BrandCard = ({
  slug,
  label,
  selected,
  onSelect,
}: BrandCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={[
        'group w-full flex flex-col items-center justify-center gap-2',
        'p-4 rounded-md border',
        'transition-all duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'bg-accent-subtle border-accent shadow-accent'
          : 'bg-surface border-border hover:border-borderHigh hover:bg-surfaceHigh active:scale-[0.98]',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={`Choose ${label}`}
    >
      {/* Brand logo */}
      <div
        className={[
          'w-10 h-10 rounded-sm flex items-center justify-center',
          'border transition-colors duration-fast',
          selected
            ? 'bg-accent-subtle border-accent/30'
            : 'bg-surfaceHigh border-border group-hover:border-borderHigh',
        ].join(' ')}
      >
        <BrandLogo
          brandSlug={slug}
          brandName={label}
          size="md"
        />
      </div>

      {/* Brand name */}
      <span
        className={[
          'text-xs font-semibold text-center leading-tight',
          selected ? 'text-accent' : 'text-text-secondary',
        ].join(' ')}
      >
        {label}
      </span>

      {/* Selected indicator */}
      {selected && (
        <span
          className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center"
          aria-hidden="true"
        >
          <CheckIcon small />
        </span>
      )}
    </button>
  )
}

// ── CheckIcon ─────────────────────────────────────────────────

const CheckIcon = ({ small = false }: { small?: boolean }) => (
  <svg
    width={small ? '8' : '10'}
    height={small ? '8' : '10'}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1.5 5L4 7.5L8.5 2.5"
      stroke="#0F0F0D"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)