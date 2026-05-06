import React from 'react'

interface VerdictReasonListProps {
  title: string
  items: string[]
  tone?: 'positive' | 'warning'
}

export const VerdictReasonList = ({
  title,
  items,
  tone = 'positive',
}: VerdictReasonListProps) => {
  if (items.length === 0) {
    return null
  }

  const bulletClass = tone === 'positive' ? 'bg-accent' : 'bg-warning'

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
            <span
              className={['mt-2 h-1.5 w-1.5 shrink-0 rounded-full', bulletClass].join(' ')}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
