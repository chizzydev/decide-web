// decide-web/src/components/ui/Spinner.tsx
// Standalone loading spinner for full-page and section loading states.
// For inline button loading, Button.tsx uses its own internal spinner
// to avoid a circular dependency within the ui/ folder.

import React from 'react'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  size?:      SpinnerSize
  label?:     string   // Accessible label — defaults to "Loading"
  className?: string
  // Centers the spinner in its container
  centered?:  boolean
}

const SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export const Spinner = ({
  size      = 'md',
  label     = 'Loading',
  className = '',
  centered  = false,
}: SpinnerProps) => {
  return (
    <div
      className={[
        centered ? 'flex items-center justify-center w-full py-12' : 'inline-flex',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label={label}
    >
      <svg
        className={['animate-spin text-accent', SIZES[size]].join(' ')}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}