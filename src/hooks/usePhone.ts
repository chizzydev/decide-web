// decide-web/src/hooks/usePhone.ts
// Fetches a single phone by slug for the detail page.

import { useState, useEffect } from 'react'
import { phonesApi } from '@/lib/api'
import type { PhoneDetail, FetchState } from '@/types'

export const usePhone = (slug: string): FetchState<PhoneDetail> => {
  const [state, setState] = useState<FetchState<PhoneDetail>>({
    data:    null,
    loading: true,
    error:   null,
  })

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    const fetch = async (): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const data = await phonesApi.getBySlug(slug)
        if (!cancelled) setState({ data, loading: false, error: null })
      } catch (err) {
        if (!cancelled) {
          setState({
            data:    null,
            loading: false,
            error:   err instanceof Error ? err.message : 'Failed to load phone.',
          })
        }
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [slug])

  return state
}