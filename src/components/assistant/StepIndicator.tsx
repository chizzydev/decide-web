// decide-web/src/components/assistant/StepIndicator.tsx
// Shows the user's progress through the assistant flow.
// Renders a row of dots — filled for completed steps,
// active for the current step, empty for upcoming steps.
// Compact enough to sit in the top bar alongside other elements.

import React from 'react'
import type { OsType } from '@/types'

interface StepIndicatorProps {
  current:  number    // 1-based current step number
  total:    number    // Total number of steps for this OS path
  osType:   OsType | null
  className?: string
}

export const StepIndicator = ({
  current,
  total,
  osType,
  className = '',
}: StepIndicatorProps) => {
  return (
    <div
      className={[
        'flex items-center gap-1.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => {
        const stepNumber  = index + 1
        const isCompleted = stepNumber < current
        const isActive    = stepNumber === current
        const isUpcoming  = stepNumber > current

        return (
          <span
            key={index}
            className={[
              'rounded-full transition-all duration-normal',
              // Active step — wider pill to make it stand out
              isActive    ? 'w-4 h-1.5 bg-accent'        : '',
              // Completed step — solid filled dot
              isCompleted ? 'w-1.5 h-1.5 bg-accent/60'   : '',
              // Upcoming step — empty dot
              isUpcoming  ? 'w-1.5 h-1.5 bg-border'      : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          />
        )
      })}

      {/* Screen reader text */}
      <span className="sr-only">
        Step {current} of {total}
        {osType ? ` — ${osType === 'ios' ? 'iPhone' : 'Android'} path` : ''}
      </span>
    </div>
  )
}