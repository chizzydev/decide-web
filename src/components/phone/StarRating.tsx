'use client'

// decide-web/src/components/phone/StarRating.tsx
// Reusable star rating component.
// read-only mode: displays filled/empty stars
// interactive mode: clickable stars for review form

import React from 'react'

interface StarRatingProps {
  rating:      number          // current rating value 1-5
  max?:        number          // defaults to 5
  interactive?: boolean        // if true, stars are clickable
  size?:        'sm' | 'md' | 'lg'
  onChange?:   (rating: number) => void
}

export const StarRating = ({
  rating,
  max        = 5,
  interactive = false,
  size        = 'md',
  onChange,
}: StarRatingProps) => {
  const [hovered, setHovered] = React.useState(0)

  const sizeMap = {
    sm:  'w-3.5 h-3.5',
    md:  'w-5 h-5',
    lg:  'w-6 h-6',
  }

  const starSize = sizeMap[size]
  const display  = interactive ? (hovered || rating) : rating

  return (
    <div
      className="flex items-center gap-0.5"
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? 'Select rating' : `${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const value   = i + 1
        const filled  = value <= display

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${value} star${value !== 1 ? 's' : ''}`}
              className="transition-transform duration-fast hover:scale-110 focus:outline-none"
            >
              <StarIcon
                filled={filled}
                className={`${starSize} ${filled ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'} transition-colors duration-fast`}
              />
            </button>
          )
        }

        return (
          <StarIcon
            key={value}
            filled={filled}
            className={`${starSize} ${filled ? 'text-amber-400' : 'text-slate-200'}`}
          />
        )
      })}
    </div>
  )
}

const StarIcon = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  </svg>
)