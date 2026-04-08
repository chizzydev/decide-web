// decide-web/src/components/ui/Skeleton.tsx
// Animated placeholder shown while content is loading.
// Prevents layout shift by occupying the same space as the real content.
// Used in phone cards, result cards, and the compare table.

import React from 'react'

interface SkeletonProps {
  // Width and height can be any valid Tailwind width/height class
  // or an explicit pixel/rem value via inline style
  width?:     string
  height?:    string
  className?: string
  // Rounded variant for circular skeletons — avatar images, score dots
  rounded?:   boolean
}

export const Skeleton = ({
  width,
  height,
  className = '',
  rounded   = false,
}: SkeletonProps) => {
  return (
    <div
      className={[
        'animate-pulse bg-surfaceHigh',
        rounded ? 'rounded-full' : 'rounded-sm',
        width   ? width  : 'w-full',
        height  ? height : 'h-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    />
  )
}

// ── Skeleton compositions ──────────────────────────────────────
// Pre-built skeleton layouts for common loading states.
// Use these instead of manually composing Skeleton instances
// in every component that needs a loading state.

// Matches the layout of PhoneCard
export const PhoneCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-md p-4 space-y-3">
    {/* Phone image placeholder */}
    <Skeleton height="h-40" className="rounded-sm" />

    {/* Brand and name */}
    <div className="space-y-2">
      <Skeleton width="w-16" height="h-3" />
      <Skeleton width="w-3/4" height="h-4" />
    </div>

    {/* Spec pills */}
    <div className="flex gap-2">
      <Skeleton width="w-12" height="h-5" />
      <Skeleton width="w-16" height="h-5" />
      <Skeleton width="w-10" height="h-5" />
    </div>

    {/* Price */}
    <div className="pt-1 border-t border-border">
      <Skeleton width="w-24" height="h-5" />
    </div>
  </div>
)

// Matches the layout of ResultCard
export const ResultCardSkeleton = () => (
  <div className="bg-surface border border-border rounded-md p-5 space-y-4">
    {/* Match percentage badge */}
    <div className="flex items-center justify-between">
      <Skeleton width="w-24" height="h-5" />
      <Skeleton width="w-16" height="h-5" />
    </div>

    {/* Phone image and name */}
    <div className="flex gap-4">
      <Skeleton width="w-20" height="h-20" className="shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton width="w-16" height="h-3" />
        <Skeleton width="w-3/4" height="h-5" />
        <Skeleton width="w-1/2" height="h-3" />
      </div>
    </div>

    {/* Score bars */}
    <div className="space-y-2.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <Skeleton width="w-20" height="h-3" />
            <Skeleton width="w-6"  height="h-3" />
          </div>
          <Skeleton height="h-1.5" />
        </div>
      ))}
    </div>

    {/* Store price buttons */}
    <div className="flex gap-2 pt-1">
      <Skeleton height="h-9" className="flex-1" />
      <Skeleton height="h-9" className="flex-1" />
    </div>
  </div>
)

// Matches the layout of a single compare table row
export const CompareRowSkeleton = () => (
  <div className="grid grid-cols-3 gap-4 py-3 border-b border-border">
    <Skeleton width="w-24" height="h-4" />
    <Skeleton width="w-20" height="h-4" />
    <Skeleton width="w-20" height="h-4" />
  </div>
)

// Full compare table skeleton — 8 rows
export const CompareTableSkeleton = () => (
  <div>
    {Array.from({ length: 8 }).map((_, i) => (
      <CompareRowSkeleton key={i} />
    ))}
  </div>
)

// Grid of phone card skeletons for the browse page
interface PhoneGridSkeletonProps {
  count?: number
}

export const PhoneGridSkeleton = ({ count = 6 }: PhoneGridSkeletonProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <PhoneCardSkeleton key={i} />
    ))}
  </div>
)