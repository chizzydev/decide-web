// decide-web/src/components/ui/Card.tsx
// Container component for grouping related content.
// Used for phone cards, result cards, spec panels, and form sections.
// Supports interactive (hoverable) and static variants.

import React from 'react'

type CardVariant = 'default' | 'elevated' | 'interactive' | 'accent'

interface CardProps {
  variant?:   CardVariant
  children:   React.ReactNode
  className?: string
  onClick?:   () => void
  // Marks the card as selected — used in the compare tray
  // and assistant step selections
  selected?:  boolean
  // Accessible label for interactive cards
  ariaLabel?: string
}

const VARIANTS: Record<CardVariant, string> = {
  // Standard card — panels, spec sheets, form sections
  default:
    'bg-surface border border-border',

  // Slightly lifted — modals, dropdowns, floating elements
  elevated:
    'bg-surfaceHigh border border-border shadow-md',

  // Clickable card — phone cards, brand pickers, usage options
  // Hover lifts the border colour and adds a subtle background shift
  interactive:
    'bg-surface border border-border cursor-pointer hover:border-borderHigh hover:bg-surfaceHigh transition-all duration-fast active:scale-[0.99]',

  // Selected state with amber border — active assistant step selection
  // or a phone added to the compare tray
  accent:
    'bg-accent-subtle border border-accent shadow-accent',
}

export const Card = ({
  variant   = 'default',
  children,
  className = '',
  onClick,
  selected  = false,
  ariaLabel,
}: CardProps) => {
  const isInteractive = !!onClick || variant === 'interactive'

  // When selected, override the border with the accent colour
  // regardless of the base variant
  const selectedClass = selected
    ? 'border-accent bg-accent-subtle shadow-accent'
    : ''

  const Tag = isInteractive ? 'button' : 'div'

  return (
    <Tag
      className={[
        'rounded-md p-4',
        VARIANTS[variant],
        selectedClass,
        // Remove default button styles when rendered as a button
        isInteractive ? 'text-left w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isInteractive && selected ? true : undefined}
    >
      {children}
    </Tag>
  )
}

// ── Card sub-components ────────────────────────────────────────
// Allow structured content without prop drilling.
// Usage:
//   <Card>
//     <Card.Header>Title</Card.Header>
//     <Card.Body>Content</Card.Body>
//     <Card.Footer>Actions</Card.Footer>
//   </Card>

interface CardSectionProps {
  children:   React.ReactNode
  className?: string
}

Card.Header = function CardHeader({
  children,
  className = '',
}: CardSectionProps) {
  return (
    <div
      className={[
        'mb-3 pb-3 border-b border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

Card.Body = function CardBody({
  children,
  className = '',
}: CardSectionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({
  children,
  className = '',
}: CardSectionProps) {
  return (
    <div
      className={[
        'mt-3 pt-3 border-t border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}