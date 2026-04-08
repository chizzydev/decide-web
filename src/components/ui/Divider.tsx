// decide-web/src/components/ui/Divider.tsx
// Horizontal or vertical separator line.
// Used between spec sections, inside cards, and between list items.

import React from 'react'

type DividerOrientation = 'horizontal' | 'vertical'

interface DividerProps {
  orientation?: DividerOrientation
  // Optional label centered on the divider — e.g. "or"
  label?:       string
  className?:   string
}

export const Divider = ({
  orientation = 'horizontal',
  label,
  className   = '',
}: DividerProps) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={[
          'w-px self-stretch bg-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  // Horizontal with optional centered label
  if (label) {
    return (
      <div
        className={[
          'flex items-center gap-3',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        role="separator"
        aria-orientation="horizontal"
        aria-label={label}
      >
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-semibold text-text-muted tracking-wider uppercase">
          {label}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    )
  }

  return (
    <hr
      className={[
        'border-none h-px bg-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="separator"
      aria-orientation="horizontal"
    />
  )
}