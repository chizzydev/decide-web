// decide-web/src/components/assistant/StepUsage.tsx
// Step 4 on Android (Step 3 on iOS) — primary usage selection.
// The user picks the single thing they use their phone for most.
// This feeds directly into the scoring engine's usage bonuses
// which weight certain brands and specs higher for each usage type.

'use client'

import React from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { USAGE_OPTIONS } from '@/lib/constants'
import type { UsageType } from '@/types'

export const StepUsage = () => {
  const { selectUsage, usage_type, os_type } = useAssistant()

  const stepNumber = os_type === 'ios' ? 3 : 4

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          Step {stepNumber}
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          How do you mainly use your phone?
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Pick the one that fits best. This helps us prioritise
          what matters most for your lifestyle.
        </p>
      </div>

      {/* Usage option grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="group"
        aria-label="Choose your primary phone usage"
      >
        {USAGE_OPTIONS.map((option) => {
          const isSelected = usage_type === option.slug

          return (
            <UsageCard
              key={option.slug}
              icon={option.icon}
              label={option.label}
              description={option.description}
              selected={isSelected}
              onSelect={() => selectUsage(option.slug as UsageType)}
            />
          )
        })}
      </div>

      {/* Helper note */}
      <p className="text-xs text-text-muted text-center">
        Most people use their phone for several things —
        just pick the one that matters most to you.
      </p>
    </div>
  )
}

// ── UsageCard ─────────────────────────────────────────────────

interface UsageCardProps {
  icon:        string
  label:       string
  description: string
  selected:    boolean
  onSelect:    () => void
}

const UsageCard = ({
  icon,
  label,
  description,
  selected,
  onSelect,
}: UsageCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={[
        'group relative w-full text-left',
        'flex flex-col gap-3 p-4 rounded-md border',
        'transition-all duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'bg-accent-subtle border-accent shadow-accent'
          : 'bg-surface border-border hover:border-borderHigh hover:bg-surfaceHigh active:scale-[0.98]',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={`${label} — ${description}`}
    >
      {/* Icon */}
      <span
        className="text-2xl leading-none"
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Label and description */}
      <div className="space-y-0.5">
        <p
          className={[
            'text-sm font-bold leading-tight',
            selected ? 'text-accent' : 'text-text-primary',
          ].join(' ')}
        >
          {label}
        </p>
        <p className="text-xs text-text-secondary leading-snug">
          {description}
        </p>
      </div>

      {/* Selected indicator */}
      {selected && (
        <span
          className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 5L4 7.5L8.5 2.5"
              stroke="#0F0F0D"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  )
}