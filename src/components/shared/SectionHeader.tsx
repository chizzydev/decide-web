// decide-web/src/components/shared/SectionHeader.tsx
// Reusable section heading pattern used across browse,
// results, and detail pages.
// Supports an optional subtitle and a trailing action (e.g. "View All" link).

import React from 'react'

interface SectionHeaderProps {
  title:      string
  subtitle?:  string
  action?:    React.ReactNode
  className?: string
}

export const SectionHeader = ({
  title,
  subtitle,
  action,
  className = '',
}: SectionHeaderProps) => {
  return (
    <div
      className={[
        'flex items-start justify-between gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 mt-1">
          {action}
        </div>
      )}
    </div>
  )
}