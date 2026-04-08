// decide-web/src/hooks/usePriceAlert.ts
// Handles authenticated price alerts.
// Alerts are now account-owned rather than email-managed.

import { useState } from 'react'
import { requestWithBackendAuth } from '@/lib/backendAuth'
import type { PriceAlert, CreateAlertBody, FetchState } from '@/types'

interface UsePriceAlertReturn {
  alerts:       FetchState<PriceAlert[]>
  creating:     boolean
  createError:  string | null
  fetchAlerts:  ()                               => Promise<void>
  createAlert:  (body: CreateAlertBody)          => Promise<boolean>
  deleteAlert:  (id: number)                     => Promise<boolean>
}

export const usePriceAlert = (): UsePriceAlertReturn => {
  const [alerts, setAlerts] = useState<FetchState<PriceAlert[]>>({
    data:    null,
    loading: false,
    error:   null,
  })

  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchAlerts = async (): Promise<void> => {
    setAlerts({ data: null, loading: true, error: null })

    try {
      const data = await requestWithBackendAuth<PriceAlert[]>('/alerts/me')
      setAlerts({ data, loading: false, error: null })
    } catch (err) {
      setAlerts({
        data:    null,
        loading: false,
        error:   err instanceof Error ? err.message : 'Failed to load alerts.',
      })
    }
  }

  // Returns true on success, false on failure.
  // The component checks the return value to show a success message.
  const createAlert = async (body: CreateAlertBody): Promise<boolean> => {
    setCreating(true)
    setCreateError(null)

    try {
      const newAlert = await requestWithBackendAuth<PriceAlert>('/alerts/me', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      // Optimistically append the new alert to the current list
      // without requiring a full refetch
      setAlerts((prev) => ({
        ...prev,
        data: prev.data ? [...prev.data, newAlert] : [newAlert],
      }))

      setCreating(false)
      return true
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to create alert.'
      )
      setCreating(false)
      return false
    }
  }

  // Returns true on success, false on failure.
  const deleteAlert = async (id: number): Promise<boolean> => {
    try {
      await requestWithBackendAuth<null>(`/alerts/me/${id}`, {
        method: 'DELETE',
      })

      // Optimistically remove the deleted alert from the list
      setAlerts((prev) => ({
        ...prev,
        data: prev.data?.filter((a) => a.id !== id) ?? null,
      }))

      return true
    } catch (err) {
      return false
    }
  }

  return {
    alerts,
    creating,
    createError,
    fetchAlerts,
    createAlert,
    deleteAlert,
  }
}
