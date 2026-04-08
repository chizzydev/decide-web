// decide-web/src/hooks/useBrands.ts
// Fetches the brand list — optionally filtered by OS type.

import { useState, useEffect } from 'react'
import { brandsApi } from '@/lib/api'
import type { Brand, FetchState } from '@/types'
import type { OsType } from '@/types'

export const useBrands = (os_type?: OsType): FetchState<Brand[]> => {
  const [state, setState] = useState<FetchState<Brand[]>>({
    data:    null,
    loading: true,
    error:   null,
  })

  useEffect(() => {
    let cancelled = false

    const fetch = async (): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const data = await brandsApi.getAll(os_type)
        if (!cancelled) setState({ data, loading: false, error: null })
      } catch (err) {
        if (!cancelled) {
          setState({
            data:    null,
            loading: false,
            error:   err instanceof Error ? err.message : 'Failed to load brands.',
          })
        }
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [os_type])

  return state
}