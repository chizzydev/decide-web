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
        'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        <h2 className="break-words text-2xl font-bold tracking-tight text-text-primary">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-1 w-full sm:w-auto sm:shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
