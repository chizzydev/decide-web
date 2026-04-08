// decide-web/src/components/assistant/StepOs.tsx
// Step 1 of the assistant flow — OS selection.
// The first and most consequential choice:
// Android opens a 5-step path, iOS opens a 4-step path.
// Design priority: make both options feel equally valid.
// No default, no pre-selection — the user must make an explicit choice.

'use client'

import React from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { Card } from '@/components/ui'
import type { OsType } from '@/types'

interface OsOption {
  os:          OsType
  label:       string
  description: string
  traits:      string[]
  icon:        React.ReactNode
}

const OS_OPTIONS: OsOption[] = [
  {
    os:          'android',
    label:       'Android',
    description: 'More choice, more value',
    traits: [
      'Samsung, Tecno, Infinix, Xiaomi, Google',
      'Wide range from ₦30k to ₦500k+',
      'Customisable, feature-rich',
      'Best value for money in Nigeria',
    ],
    icon: <AndroidIcon />,
  },
  {
    os:          'ios',
    label:       'iPhone',
    description: 'Premium, polished, long-lasting',
    traits: [
      'Apple only',
      'Starts from ₦300k+',
      'Consistent, secure, great resale value',
      'iStore support available in Lagos',
    ],
    icon: <AppleIcon />,
  },
]

export const StepOs = () => {
  const { selectOs } = useAssistant()

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          Step 1
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          Android or iPhone?
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          This shapes everything — your budget options, available brands,
          and the stores where you can buy.
        </p>
      </div>

      {/* OS option cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        role="group"
        aria-label="Choose your operating system"
      >
        {OS_OPTIONS.map((option) => (
          <OsCard
            key={option.os}
            option={option}
            onSelect={() => selectOs(option.os)}
          />
        ))}
      </div>

      {/* Helper note */}
      <p className="text-xs text-text-muted text-center">
        Not sure?{' '}
        <span className="text-text-secondary">
          Most Nigerian buyers under ₦200k choose Android.
        </span>
      </p>
    </div>
  )
}

// ── OsCard ────────────────────────────────────────────────────

interface OsCardProps {
  option:   OsOption
  onSelect: () => void
}

const OsCard = ({ option, onSelect }: OsCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={[
        'group w-full text-left',
        'bg-surface border border-border rounded-md',
        'p-6 space-y-4',
        'hover:border-borderHigh hover:bg-surfaceHigh',
        'active:scale-[0.99]',
        'transition-all duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      ].join(' ')}
      aria-label={`Choose ${option.label}`}
    >
      {/* Icon and label */}
      <div className="flex items-center gap-3">
        <div
          className={[
            'w-10 h-10 rounded-sm flex items-center justify-center shrink-0',
            'bg-surfaceHigh border border-border',
            'group-hover:border-borderHigh',
            'transition-colors duration-fast',
          ].join(' ')}
        >
          {option.icon}
        </div>

        <div>
          <p className="text-base font-bold text-text-primary">
            {option.label}
          </p>
          <p className="text-xs text-text-secondary">
            {option.description}
          </p>
        </div>
      </div>

      {/* Trait list */}
      <ul className="space-y-1.5">
        {option.traits.map((trait) => (
          <li
            key={trait}
            className="flex items-start gap-2 text-sm text-text-secondary"
          >
            <span
              className="mt-0.5 w-1 h-1 rounded-full bg-accent shrink-0 translate-y-1"
              aria-hidden="true"
            />
            {trait}
          </li>
        ))}
      </ul>

      {/* CTA hint */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-text-muted">
          {option.os === 'android' ? '5 steps' : '4 steps'}
        </span>
        <span
          className={[
            'text-xs font-semibold text-text-muted',
            'group-hover:text-accent',
            'transition-colors duration-fast',
          ].join(' ')}
        >
          Choose {option.label} →
        </span>
      </div>
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────

function AndroidIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#3DDC84]"
      aria-hidden="true"
    >
      <path d="M17.523 15.341a.857.857 0 01-.857-.857.857.857 0 01.857-.857.857.857 0 01.857.857.857.857 0 01-.857.857m-11.046 0a.857.857 0 01-.857-.857.857.857 0 01.857-.857.857.857 0 01.857.857.857.857 0 01-.857.857M17.8 10.5l1.77-3.065a.37.37 0 00-.134-.505.369.369 0 00-.505.134L17.15 10.14a10.845 10.845 0 00-10.3 0L5.07 7.064a.37.37 0 00-.505-.134.369.369 0 00-.134.505L6.2 10.5C3.648 11.938 2.013 14.43 2 17.25h20c-.013-2.82-1.648-5.312-4.2-6.75" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-text-primary"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}