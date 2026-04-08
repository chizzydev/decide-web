// decide-web/src/components/shared/AvailabilityBadge.tsx
// Communicates Nigerian market availability and gray market risk
// in a single compact badge.
// This is one of Decide's core differentiators — honest market context
// that GSMArena and similar sites do not provide.

import React from 'react'
import { Badge, Tooltip } from '@/components/ui'
import { GRAY_MARKET_LABELS } from '@/lib/constants'
import type { GrayMarketRisk } from '@/types'

interface AvailabilityBadgeProps {
  risk:         GrayMarketRisk
  // Optional detail shown in a tooltip on hover
  note?:        string | null
  // Compact hides the label text — shows only the coloured dot
  // Used in tight layouts like the compare table
  compact?:     boolean
  className?:   string
}

// Maps risk level to the Badge variant
const RISK_TO_VARIANT: Record<GrayMarketRisk, 'success' | 'warning' | 'error'> = {
  low:    'success',
  medium: 'warning',
  high:   'error',
}

// Maps risk level to a screen-reader-friendly description
const RISK_DESCRIPTIONS: Record<GrayMarketRisk, string> = {
  low:
    'This phone is officially available in Nigeria with local warranty support.',
  medium:
    'This phone may be imported. Verify warranty coverage before purchasing.',
  high:
    'High gray market risk. No official Nigerian warranty. Buy only from trusted sources.',
}

export const AvailabilityBadge = ({
  risk,
  note,
  compact   = false,
  className = '',
}: AvailabilityBadgeProps) => {
  const variant     = RISK_TO_VARIANT[risk]
  const label       = GRAY_MARKET_LABELS[risk]
  const description = RISK_DESCRIPTIONS[risk]

  // The tooltip content combines the risk description with
  // the phone-specific note from the database if one exists
  const tooltipContent = note
    ? `${description} ${note}`
    : description

  const badge = compact ? (
    // Compact — coloured dot only, no text
    <span
      className={[
        'inline-flex items-center justify-center',
        'w-2 h-2 rounded-full',
        variant === 'success' ? 'bg-success' :
        variant === 'warning' ? 'bg-warning' :
                                'bg-error',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={`Market availability: ${label}`}
    />
  ) : (
    // Full badge with label text
    <Badge
      variant={variant}
      className={className}
    >
      {/* Coloured dot for quick visual scanning */}
      <span
        className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'success' ? 'bg-success' :
          variant === 'warning' ? 'bg-warning' :
                                  'bg-error',
        ].join(' ')}
        aria-hidden="true"
      />
      {label}
    </Badge>
  )

  return (
    <Tooltip content={tooltipContent} position="top">
      <span
        tabIndex={0}
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
        aria-describedby={undefined}
      >
        {badge}
      </span>
    </Tooltip>
  )
}