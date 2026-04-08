// decide-web/src/hooks/useCompare.ts
// Submits two phone slugs to the compare endpoint
// and returns the structured comparison result.

import { useState } from 'react'
import { compareApi } from '@/lib/api'
import type { CompareResult, FetchState, PriorityWeights } from '@/types'

interface UseCompareReturn extends FetchState<CompareResult> {
  fetchComparison: (
    slug_a: string,
    slug_b: string,
    priorities?: PriorityWeights
  ) => Promise<void>
}

export const useCompare = (): UseCompareReturn => {
  const [state, setState] = useState<FetchState<CompareResult>>({
    data:    null,
    loading: false,
    error:   null,
  })

  const fetchComparison = async (
    slug_a: string,
    slug_b: string,
    priorities?: PriorityWeights
  ): Promise<void> => {
    setState({ data: null, loading: true, error: null })

    try {
      const data = await compareApi.compareTwoPhones({
        slug_a,
        slug_b,
        priorities,
      })

      setState({ data, loading: false, error: null })
    } catch (err) {
      setState({
        data:    null,
        loading: false,
        error:   err instanceof Error ? err.message : 'Failed to compare phones.',
      })
    }
  }

  return { ...state, fetchComparison }
}