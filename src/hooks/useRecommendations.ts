// decide-web/src/hooks/useRecommendations.ts
// Submits user preferences to the recommendation engine
// and returns the scored results.
// Called by the assistant flow when the user completes all steps.

import { useState } from 'react'
import { recommendApi } from '@/lib/api'
import type { UserPreferences, RecommendationResult, FetchState } from '@/types'
import { useAssistantStore } from '@/store/assistantStore'

interface UseRecommendationsReturn extends FetchState<RecommendationResult> {
  fetchRecommendations: (preferences: UserPreferences) => Promise<void>
}

export const useRecommendations = (): UseRecommendationsReturn => {
  const setResult  = useAssistantStore((s) => s.setResult)
  const setLoading = useAssistantStore((s) => s.setLoading)
  const setError   = useAssistantStore((s) => s.setError)

  const [state, setState] = useState<FetchState<RecommendationResult>>({
    data:    null,
    loading: false,
    error:   null,
  })

  const fetchRecommendations = async (
    preferences: UserPreferences
  ): Promise<void> => {
    setState({ data: null, loading: true, error: null })
    setLoading(true)
    setError(null)

    try {
      const data = await recommendApi.getRecommendations(preferences)

      setState({ data, loading: false, error: null })
      setResult(data)
      setLoading(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to get recommendations.'

      setState({ data: null, loading: false, error: message })
      setError(message)
      setLoading(false)
    }
  }

  return { ...state, fetchRecommendations }
}