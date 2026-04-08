// decide-web/src/components/ui/Button.tsx
// The primary interactive element across the entire app.
// Sharp corners, amber accent, fast hover transitions.
// Never a pill shape — border-radius is always radius.sm (4px).

import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  fullWidth?: boolean
  children:  React.ReactNode
}

// Base classes shared across all variants
const BASE =
  'inline-flex items-center justify-center font-ui font-semibold tracking-wide transition-all duration-fast select-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

const VARIANTS: Record<ButtonVariant, string> = {
  // The one accent colour — used sparingly on the most important CTA only
  primary:
    'bg-accent text-black hover:bg-accent-hover active:scale-[0.98]',

  // Outlined — secondary actions like "Go Back" or "View Details"
  secondary:
    'bg-transparent border border-border text-text-primary hover:border-borderHigh hover:bg-surfaceHigh active:scale-[0.98]',

  // No border or background — tertiary actions and nav links
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surfaceHigh active:scale-[0.98]',

  // Destructive actions — delete alert, clear comparison
  danger:
    'bg-transparent border border-error text-error hover:bg-error-subtle active:scale-[0.98]',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8  px-3 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = ({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading

  return (
    <button
      className={[
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Inline spinner — avoids importing the Spinner component
// and creating a circular dependency within the ui/ folder.
// Kept minimal — just enough to communicate loading state.
const Spinner = ({ size }: { size: 'sm' | 'md' }) => {
  const dimension = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'

  return (
    <svg
      className={`${dimension} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}