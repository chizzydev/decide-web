// decide-web/src/components/ui/Badge.tsx
// Small label used for tags, status indicators, and category labels.
// Examples: "Best Battery", "Gray Market Risk", "5G Ready", "Featured"

import React from 'react'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted'

interface BadgeProps {
  variant?:   BadgeVariant
  children:   React.ReactNode
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  // Neutral — general tags like "Best Battery", "USB-C"
  default:
    'bg-surfaceHigh text-text-secondary border border-border',

  // Teal — "Best Match", active filters, featured labels
  // Used sparingly — same rules as the accent colour itself
  accent:
    'bg-accent-subtle text-teal-600 border border-teal-600/30',

  // Green — "Officially Available", confirmed in stock
  success:
    'bg-success-subtle text-emerald-800 border border-emerald-700/30',

  // Orange — "Verify Before Buying", medium gray market risk
  warning:
    'bg-warning-subtle text-amber-800 border border-amber-700/35',

  // Red — "Gray Market Risk", out of stock, high risk
  error:
    'bg-error-subtle text-red-800 border border-red-700/30',

  // Dimmed — secondary tags, less important metadata
  muted:
    'bg-surface text-text-muted border border-border',
}

export const Badge = ({
  variant   = 'default',
  children,
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={[
        'inline-flex items-center gap-1',
        'px-2 py-0.5',
        'rounded-sm',
        'text-xs font-semibold tracking-wider uppercase',
        'whitespace-nowrap',
        VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
