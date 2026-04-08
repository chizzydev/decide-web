// decide-web/src/hooks/usePhones.ts
// Fetches a filtered, paginated list of phones.
// Re-fetches automatically when filters change.

import { useState, useEffect } from 'react'
import { phonesApi } from '@/lib/api'
import type { PhoneCard, PhoneFilters, FetchState } from '@/types'

export const usePhones = (filters: PhoneFilters = {}): FetchState<PhoneCard[]> => {
  const [state, setState] = useState<FetchState<PhoneCard[]>>({
    data:    null,
    loading: true,
    error:   null,
  })

  useEffect(() => {
    let cancelled = false

    const fetch = async (): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const data = await phonesApi.getAll(filters)
        if (!cancelled) setState({ data, loading: false, error: null })
      } catch (err) {
        if (!cancelled) {
          setState({
            data:    null,
            loading: false,
            error:   err instanceof Error ? err.message : 'Failed to load phones.',
          })
        }
      }
    }

    fetch()

    // Cleanup — prevents state updates on unmounted components
    return () => { cancelled = true }

  // Stringify filters so the effect re-runs only when the actual
  // filter values change, not on every render (object reference changes)
  }, [JSON.stringify(filters)])

  return state
}