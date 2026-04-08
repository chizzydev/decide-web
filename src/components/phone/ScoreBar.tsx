// decide-web/src/components/phone/ScoreBar.tsx
// Renders a labelled horizontal score bar for a single priority category.
// Used on result cards and the phone detail page to show
// battery, camera, performance, and build quality scores visually.

import React from 'react'
import { Tooltip } from '@/components/ui'
import { scoreToPercent, scoreToColour } from '@/lib/scoring'

interface ScoreBarProps {
  label:        string
  score:        number      // 1–10
  isPriority?:  boolean
  description?: string
  className?:   string
}

const scoreLabel = (score: number): string => {
  if (score >= 9) return 'Excellent'
  if (score >= 7) return 'Good'
  if (score >= 5) return 'Average'
  if (score >= 3) return 'Below Average'
  return 'Poor'
}

export const ScoreBar = ({
  label,
  score,
  isPriority  = false,
  description,
  className   = '',
}: ScoreBarProps) => {
  const percent     = scoreToPercent(score)
  const colourClass = scoreToColour(score)

  const bar = (
    <div
      className={[
        'w-full space-y-1',
        isPriority ? 'opacity-100' : 'opacity-80',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Priority indicator dot — teal via accent token */}
          {isPriority && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
              aria-hidden="true"
            />
          )}
          <span
            className={[
              'text-xs font-semibold truncate',
              isPriority ? 'text-text-primary' : 'text-slate-500',
            ].join(' ')}
          >
            {label}
          </span>
        </div>

        {/* Score number and label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={[
              'text-xs font-bold tabular-nums',
              isPriority ? 'text-text-primary' : 'text-slate-500',
            ].join(' ')}
            aria-label={`${label} score: ${score} out of 10`}
          >
            {score}
            <span className="font-regular text-slate-400">/10</span>
          </span>
          <span className="hidden sm:block text-xs text-slate-400">
            {scoreLabel(score)}
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        className="relative h-1.5 w-full rounded-full bg-surfaceHigh overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-label={`${label}: ${score} out of 10`}
      >
        {/* Fill */}
        <div
          className={[
            'absolute left-0 top-0 h-full rounded-full',
            'transition-all duration-slow',
            colourClass,
            isPriority ? 'opacity-100' : 'opacity-70',
          ].join(' ')}
          style={{ width: percent }}
        />

        {/* Teal glow on high-priority bars — replaces amber hardcode */}
        {isPriority && score >= 7 && (
          <div
            className="absolute left-0 top-0 h-full rounded-full opacity-30 blur-sm"
            style={{
              width:      percent,
              background: '#14b8a6', // teal-500
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )

  if (description) {
    return (
      <Tooltip content={description} position="top">
        <div className="w-full cursor-help">{bar}</div>
      </Tooltip>
    )
  }

  return bar
}

// ── ScoreBarGroup ─────────────────────────────────────────────────────────────

import type { PriorityWeights } from '@/types'

interface ScoreBarGroupProps {
  scores: {
    battery:     number
    camera:      number
    performance: number
    build:       number
  }
  priorities?: PriorityWeights
  className?:  string
}

const SCORE_META: Record<
  keyof ScoreBarGroupProps['scores'],
  { label: string; description: string }
> = {
  battery: {
    label:       'Battery',
    description: 'How long the phone lasts on a full charge under typical Nigerian usage — calls, social media, and WhatsApp.',
  },
  camera: {
    label:       'Camera',
    description: 'Overall photo and video quality including low-light performance and selfie camera.',
  },
  performance: {
    label:       'Performance',
    description: 'Speed, smoothness, and multitasking capability. Covers the chipset, RAM, and software optimisation.',
  },
  build: {
    label:       'Build Quality',
    description: 'Materials, durability, weight, and overall premium feel in the hand.',
  },
}

export const ScoreBarGroup = ({
  scores,
  priorities,
  className = '',
}: ScoreBarGroupProps) => {
  const keys = (
    Object.keys(scores) as Array<keyof typeof scores>
  ).sort((a, b) => {
    if (!priorities) return 0
    return (priorities[b] ?? 5) - (priorities[a] ?? 5)
  })

  return (
    <div className={['space-y-2.5', className].filter(Boolean).join(' ')}>
      {keys.map((key) => (
        <ScoreBar
          key={key}
          label={SCORE_META[key].label}
          score={scores[key]}
          isPriority={!!priorities && (priorities[key] ?? 0) >= 7}
          description={SCORE_META[key].description}
        />
      ))}
    </div>
  )
}