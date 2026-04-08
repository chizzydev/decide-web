// decide-web/src/lib/scoring.ts
// Client-side scoring utilities.
// Used to provide instant visual feedback on the results page
// without waiting for an additional API call.
// The authoritative scoring happens on the backend in scoringService.ts —
// this is a lightweight mirror for UI purposes only.

import type { ScoredPhone, PriorityWeights } from '@/types'

// Returns the score for a specific priority category from a phone.
export const getScoreForPriority = (
  phone: ScoredPhone,
  priority: keyof PriorityWeights
): number => {
  const scoreMap: Record<keyof PriorityWeights, number> = {
    battery:     phone.score_battery,
    camera:      phone.score_camera,
    performance: phone.score_performance,
    build:       phone.score_build,
  }
  return scoreMap[priority]
}

// Converts a raw 1–10 score to a percentage width for CSS progress bars.
export const scoreToPercent = (score: number): string => {
  return `${Math.round((score / 10) * 100)}%`
}

// Returns a Tailwind bg class for a score value.
// Colour scale:
//   8–10  → success green  (excellent)
//   6–7   → teal-500       (good — brand colour, reads as positive)
//   4–5   → warning amber  (average — caution)
//   0–3   → error red      (poor)
export const scoreToColour = (score: number): string => {
  if (score >= 8) return 'bg-success'
  if (score >= 6) return 'bg-teal-500'
  if (score >= 4) return 'bg-warning'
  return 'bg-error'
}

// Returns a Tailwind text class for a match percentage.
// Used on ResultCard to colour the match percentage badge.
//   80%+  → success green
//   60%+  → teal-500 (active, positive signal)
//   <60%  → slate (neutral, not a strong match)
export const matchToColour = (percentage: number): string => {
  if (percentage >= 80) return 'text-success'
  if (percentage >= 60) return 'text-teal-500'
  return 'text-slate-500'
}

// Sorts an array of scored phones by final score descending.
export const sortByScore = (phones: ScoredPhone[]): ScoredPhone[] => {
  return [...phones].sort((a, b) => b.final_score - a.final_score)
}

// Returns the priority keys sorted by weight descending.
export const getSortedPriorities = (
  priorities: PriorityWeights
): Array<keyof PriorityWeights> => {
  return (Object.keys(priorities) as Array<keyof PriorityWeights>).sort(
    (a, b) => priorities[b] - priorities[a]
  )
}