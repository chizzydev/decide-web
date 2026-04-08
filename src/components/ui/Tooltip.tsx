// decide-web/src/components/ui/Tooltip.tsx
// Shows a short contextual label on hover or focus.
// Used for abbreviated specs, score bar explanations,
// and gray market warning details.
// Pure CSS-driven positioning — no JavaScript positioning library needed.

'use client'

import React, { useState } from 'react'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content:    string
  children:   React.ReactNode
  position?:  TooltipPosition
  className?: string
}

// Positioning classes for the tooltip bubble relative to the trigger
const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
}

// Arrow indicator pointing from the bubble toward the trigger
const ARROW_CLASSES: Record<TooltipPosition, string> = {
  top:    'top-full left-1/2 -translate-x-1/2 border-t-surfaceHigh border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surfaceHigh border-x-transparent border-t-transparent',
  left:   'left-full top-1/2 -translate-y-1/2 border-l-surfaceHigh border-y-transparent border-r-transparent',
  right:  'right-full top-1/2 -translate-y-1/2 border-r-surfaceHigh border-y-transparent border-l-transparent',
}

export const Tooltip = ({
  content,
  children,
  position  = 'top',
  className = '',
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)

  // Unique ID for aria-describedby association
  const tooltipId = React.useId()

  const show = (): void => setVisible(true)
  const hide = (): void => setVisible(false)

  return (
    <div
      className={['relative inline-flex', className].filter(Boolean).join(' ')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {/* Trigger — the element the tooltip is attached to */}
      <div
        aria-describedby={visible ? tooltipId : undefined}
        className="inline-flex"
      >
        {children}
      </div>

      {/* Tooltip bubble */}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={[
            'absolute z-tooltip pointer-events-none',
            'px-2.5 py-1.5 rounded-sm',
            'bg-surfaceHigh border border-border',
            'text-xs font-medium text-text-primary',
            'whitespace-nowrap shadow-md',
            'animate-fade-in',
            POSITION_CLASSES[position],
          ].join(' ')}
        >
          {content}

          {/* Arrow */}
          <span
            className={[
              'absolute w-0 h-0',
              'border-4',
              ARROW_CLASSES[position],
            ].join(' ')}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}