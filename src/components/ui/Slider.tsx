// decide-web/src/components/ui/Slider.tsx
// Range slider used in the priority selection step (Step 5).
// Renders a native input[type=range] with custom styling
// and a live value label so the user sees their selection clearly.

import React from 'react'

interface SliderProps {
  label:      string
  value:      number
  min?:       number
  max?:       number
  step?:      number
  onChange:   (value: number) => void
  // Optional description shown below the label
  description?: string
  // Optional left and right endpoint labels
  // e.g. leftLabel="Not Important" rightLabel="Essential"
  leftLabel?:  string
  rightLabel?: string
  className?:  string
}

export const Slider = ({
  label,
  value,
  min         = 1,
  max         = 10,
  step        = 1,
  onChange,
  description,
  leftLabel,
  rightLabel,
  className   = '',
}: SliderProps) => {
  // Calculate the fill percentage for the custom track fill
  const fillPercent = ((value - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(Number(e.target.value))
  }

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>

      {/* Label row — name on the left, current value on the right */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-text-primary">
            {label}
          </span>
          {description && (
            <p className="text-xs text-text-muted mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Live value badge */}
        <span
          className="min-w-[2rem] text-center text-sm font-bold text-accent tabular-nums"
          aria-live="polite"
          aria-label={`${label} priority: ${value} out of ${max}`}
        >
          {value}
        </span>
      </div>

      {/* Slider track and thumb */}
      <div className="relative flex items-center h-5">
        {/*
          The native range input is the actual interactive element.
          Custom appearance is achieved via CSS injected in globals.css
          using the [type=range] selector combined with Tailwind utilities.
          The coloured fill behind the thumb is achieved with a
          gradient background that updates as the value changes.
        */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-1 rounded-sm appearance-none cursor-pointer bg-border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          style={{
            // Gradient fills the track from the left up to the thumb position
            // using our amber accent colour, with the unfilled portion in border colour
            background: `linear-gradient(
              to right,
              #FFBA08 0%,
              #FFBA08 ${fillPercent}%,
              #2A2A24 ${fillPercent}%,
              #2A2A24 100%
            )`,
          }}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>

      {/* Endpoint labels */}
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between mt-1.5">
          {leftLabel && (
            <span className="text-xs text-text-muted">{leftLabel}</span>
          )}
          {rightLabel && (
            <span className="text-xs text-text-muted">{rightLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}