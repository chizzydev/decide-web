// decide-web/src/components/assistant/StepPriorities.tsx
// The final input step — priority weight sliders.
// The user sets how much they care about battery, camera,
// performance, and build on a 1–10 scale.
// These weights feed directly into the scoring engine's
// weighted average calculation on the backend.

'use client'

import React from 'react'
import { useAssistant } from '@/hooks/useAssistant'
import { Button, Slider } from '@/components/ui'
import { PRIORITY_OPTIONS } from '@/lib/constants'

export const StepPriorities = () => {
  const {
    priorities,
    updatePriority,
    submitAssistant,
    loading,
    error,
    os_type,
  } = useAssistant()

  const stepNumber = os_type === 'ios' ? 4 : 5

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="space-y-2">
        <p className="text-xs font-bold tracking-wider uppercase text-accent">
          Step {stepNumber}
        </p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight leading-tight">
          What matters most to you?
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Drag each slider to show how important each feature is.
          Higher means you care more. Your top priorities shape
          the recommendations.
        </p>
      </div>

      {/* Priority sliders */}
      <div
        className="space-y-6"
        role="group"
        aria-label="Set your priority weights"
      >
        {PRIORITY_OPTIONS.map((option) => {
          const value = priorities[option.key]

          return (
            <div key={option.key} className="space-y-1">
              <Slider
                label={`${option.icon} ${option.label}`}
                description={option.description}
                value={value}
                min={1}
                max={10}
                step={1}
                onChange={(v) => updatePriority(option.key, v)}
                leftLabel="Not important"
                rightLabel="Essential"
              />

              {/* Inline hint at extreme values */}
              {value >= 9 && (
                <p className="text-xs text-accent pl-1">
                  Top priority — we will weight this heavily.
                </p>
              )}
              {value <= 2 && (
                <p className="text-xs text-text-muted pl-1">
                  We will treat this as a low priority.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary of current weights — helps user review before submitting */}
      <PrioritySummary priorities={priorities} />

      {/* Submit */}
      <div className="space-y-3">
        <Button
          onClick={submitAssistant}
          fullWidth
          size="lg"
          loading={loading}
          aria-label="Get my phone recommendations"
        >
          {loading ? 'Finding your phones...' : 'Get My Recommendations →'}
        </Button>

        {error && (
          <p
            className="text-xs text-error text-center"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// ── PrioritySummary ────────────────────────────────────────────
// Shows the user a ranked summary of their priorities before
// they submit. Helps them catch mistakes — e.g. forgetting
// to raise battery after sliding it to 1 by accident.

import type { PriorityWeights } from '@/types'

interface PrioritySummaryProps {
  priorities: PriorityWeights
}

const PRIORITY_LABELS: Record<keyof PriorityWeights, string> = {
  battery:     'Battery',
  camera:      'Camera',
  performance: 'Performance',
  build:       'Build Quality',
}

const PrioritySummary = ({ priorities }: PrioritySummaryProps) => {
  // Sort priorities by weight descending so the user sees
  // their most important categories first
  const sorted = (
    Object.entries(priorities) as Array<[keyof PriorityWeights, number]>
  ).sort(([, a], [, b]) => b - a)

  return (
    <div className="bg-surfaceHigh border border-border rounded-md p-4 space-y-3">
      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
        Your priorities — ranked
      </p>

      <div className="space-y-2">
        {sorted.map(([key, value], index) => {
          // Visual weight bar proportional to the score
          const widthPercent = `${Math.round((value / 10) * 100)}%`

          const isTop    = index === 0
          const isBottom = index === sorted.length - 1

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {/* Rank number */}
                  <span
                    className={[
                      'text-xs font-black tabular-nums w-4',
                      isTop ? 'text-accent' : 'text-text-muted',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    #{index + 1}
                  </span>

                  <span
                    className={[
                      'text-xs font-semibold',
                      isTop ? 'text-text-primary' : 'text-text-secondary',
                    ].join(' ')}
                  >
                    {PRIORITY_LABELS[key]}
                  </span>
                </div>

                <span
                  className={[
                    'text-xs font-bold tabular-nums',
                    isTop    ? 'text-accent'
                    : isBottom ? 'text-text-muted'
                    :            'text-text-secondary',
                  ].join(' ')}
                  aria-label={`${PRIORITY_LABELS[key]}: ${value} out of 10`}
                >
                  {value}/10
                </span>
              </div>

              {/* Weight bar */}
              <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-normal',
                    isTop    ? 'bg-accent'
                    : isBottom ? 'bg-border'
                    :            'bg-borderHigh',
                  ].join(' ')}
                  style={{ width: widthPercent }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}