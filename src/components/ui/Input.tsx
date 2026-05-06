// decide-web/src/components/ui/Input.tsx
// Text input component used across search, forms, and alert creation.
// Supports an optional leading icon and trailing element (clear button, etc).

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  error?:       string
  hint?:        string
  leadingIcon?: React.ReactNode
  trailing?:    React.ReactNode
  fullWidth?:   boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leadingIcon,
      trailing,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id ?? props.name ?? generatedId

    const hasError = !!error

    return (
      <div className={fullWidth ? 'w-full' : 'w-auto'}>

        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-xs font-semibold tracking-wider uppercase text-text-secondary"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">

          {/* Leading icon */}
          {leadingIcon && (
            <div
              className="absolute left-3 flex items-center text-text-muted pointer-events-none"
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              // Base
              'w-full bg-surface border rounded-sm',
              'font-ui text-sm text-text-primary placeholder:text-text-muted',
              'transition-colors duration-fast',
              'h-10 px-3',

              // Focus state
              'focus:outline-none focus:border-borderHigh focus:bg-surfaceHigh',

              // Error state overrides focus
              hasError
                ? 'border-error focus:border-error'
                : 'border-border',

              // Padding adjustments for icons
              leadingIcon ? 'pl-9'  : '',
              trailing    ? 'pr-10' : '',

              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error`
              : hint ? `${inputId}-hint`
              : undefined
            }
            {...props}
          />

          {/* Trailing element */}
          {trailing && (
            <div className="absolute right-3 flex items-center">
              {trailing}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint text — only shown when there is no error */}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-xs text-text-muted"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
