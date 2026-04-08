// decide-web/src/components/phone/SpecRow.tsx
// A single labelled specification row used on the phone detail page
// and the comparison table.
// Handles all value types — strings, numbers, booleans, and nulls —
// and renders them consistently.

import React from 'react'
import { Tooltip } from '@/components/ui'

type SpecValue = string | number | boolean | null | undefined

interface SpecRowProps {
  label:        string
  value:        SpecValue
  // Optional description surfaced in a tooltip on the label
  description?: string
  // Renders the value with an accent colour — used for winning
  // spec values in the comparison table
  highlight?:   boolean
  // Dimmed — used for losing spec values in the comparison table
  dimmed?:      boolean
  // Renders a top border — used to separate spec sections
  divider?:     boolean
  className?:   string
}

// Formats any SpecValue into a display string.
// Handles all edge cases so every consumer gets consistent output.
const formatSpecValue = (value: SpecValue): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'string' && value.trim() === '') return '—'
  return String(value)
}

export const SpecRow = ({
  label,
  value,
  description,
  highlight = false,
  dimmed    = false,
  divider   = false,
  className = '',
}: SpecRowProps) => {
  const displayValue = formatSpecValue(value)
  const isUnavailable = displayValue === '—'

  const labelContent = (
    <span
      className={[
        'text-xs font-semibold text-text-muted',
        description ? 'cursor-help underline decoration-dotted underline-offset-2' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )

  return (
    <div
      className={[
        'flex items-center justify-between gap-4',
        'py-2.5 min-h-[2.5rem]',
        divider ? 'border-t border-border mt-1 pt-3.5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Label — wrapped in tooltip when description is provided */}
      <div className="shrink-0 min-w-[7rem]">
        {description ? (
          <Tooltip content={description} position="right">
            <span className="inline-block">
              {labelContent}
            </span>
          </Tooltip>
        ) : (
          labelContent
        )}
      </div>

      {/* Value */}
      <span
        className={[
          'text-sm text-right leading-snug',
          isUnavailable
            ? 'text-text-muted'
            : highlight
            ? 'font-bold text-accent'
            : dimmed
            ? 'text-text-muted line-through'
            : 'font-medium text-text-primary',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`${label}: ${displayValue}`}
      >
        {displayValue}
      </span>
    </div>
  )
}

// ── SpecSection ────────────────────────────────────────────────
// Groups related SpecRow instances under a named heading.
// Used on the phone detail page to organise specs into
// Display, Camera, Battery, etc. sections.

interface SpecSectionProps {
  title:      string
  children:   React.ReactNode
  className?: string
}

export const SpecSection = ({
  title,
  children,
  className = '',
}: SpecSectionProps) => {
  return (
    <div className={['space-y-0', className].filter(Boolean).join(' ')}>

      {/* Section heading */}
      <div className="flex items-center gap-3 mb-1">
        <h3 className="text-xs font-bold tracking-wider uppercase text-text-muted">
          {title}
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/50">
        {children}
      </div>
    </div>
  )
}

// ── CompareSpecRow ─────────────────────────────────────────────
// Three-column variant used inside the comparison table.
// Shows the spec label in the centre column and one phone's
// value on each side.

interface CompareSpecRowProps {
  label:        string
  valueA:       SpecValue
  valueB:       SpecValue
  // Which side wins — 'a', 'b', or null for a draw
  winner?:      'a' | 'b' | null
  // Visually separates spec sections in the comparison table
  divider?:     boolean
  description?: string
  // Marks this row as high priority based on user's weights
  isPriority?:  boolean
  className?:   string
}

export const CompareSpecRow = ({
  label,
  valueA,
  valueB,
  winner      = null,
  divider     = false,
  description,
  isPriority  = false,
  className   = '',
}: CompareSpecRowProps) => {
  const displayA = formatSpecValue(valueA)
  const displayB = formatSpecValue(valueB)

  return (
    <div
      className={[
        'grid grid-cols-3 gap-2 py-3 items-center',
        divider ? 'border-t-2 border-border mt-2 pt-4' : 'border-t border-border/50',
        isPriority ? 'bg-accent-subtle/30' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Phone A value */}
      <div className="text-right">
        <span
          className={[
            'text-sm leading-snug',
            displayA === '—'
              ? 'text-text-muted'
              : winner === 'a'
              ? 'font-bold text-accent'
              : winner === 'b'
              ? 'text-text-muted'
              : 'font-medium text-text-primary',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={`${label} for first phone: ${displayA}`}
        >
          {displayA}
          {winner === 'a' && (
            <span className="ml-1 text-xs" aria-label="Winner">
              ✓
            </span>
          )}
        </span>
      </div>

      {/* Centre label */}
      <div className="text-center px-1">
        {description ? (
          <Tooltip content={description} position="top">
            <span className="text-xs font-semibold text-text-muted cursor-help underline decoration-dotted underline-offset-2">
              {label}
            </span>
          </Tooltip>
        ) : (
          <span
            className={[
              'text-xs font-semibold',
              isPriority ? 'text-accent' : 'text-text-muted',
            ].join(' ')}
          >
            {label}
          </span>
        )}

        {/* Priority indicator */}
        {isPriority && (
          <div className="flex justify-center mt-0.5">
            <span className="w-1 h-1 rounded-full bg-accent" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Phone B value */}
      <div className="text-left">
        <span
          className={[
            'text-sm leading-snug',
            displayB === '—'
              ? 'text-text-muted'
              : winner === 'b'
              ? 'font-bold text-accent'
              : winner === 'a'
              ? 'text-text-muted'
              : 'font-medium text-text-primary',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={`${label} for second phone: ${displayB}`}
        >
          {winner === 'b' && (
            <span className="mr-1 text-xs" aria-label="Winner">
              ✓
            </span>
          )}
          {displayB}
        </span>
      </div>
    </div>
  )
}