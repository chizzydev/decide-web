'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { requestWithBackendAuth } from '@/lib/backendAuth'

type SavedPhonesContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  isSaved: (phoneId: number) => boolean
  markSaved: (phoneId: number) => void
  markUnsaved: (phoneId: number) => void
  replaceAll: (phoneIds: number[]) => void
}

const SavedPhonesContext = createContext<SavedPhonesContextValue | null>(null)

let cachedUserId: string | null = null
let cachedSavedPhoneIds: number[] | null = null
let inFlightSavedPhones: Promise<number[]> | null = null

const dedupePhoneIds = (phoneIds: number[]) => [...new Set(phoneIds)]

const setSavedPhonesCache = (phoneIds: number[]) => {
  cachedSavedPhoneIds = dedupePhoneIds(phoneIds)
}

const loadSavedPhoneIds = async () => {
  if (cachedSavedPhoneIds) {
    return cachedSavedPhoneIds
  }

  if (!inFlightSavedPhones) {
    inFlightSavedPhones = requestWithBackendAuth<Array<{ phone_id: number }>>(
      '/saved/me'
    )
      .then((rows) => {
        const phoneIds = dedupePhoneIds(rows.map((row) => row.phone_id))
        setSavedPhonesCache(phoneIds)
        inFlightSavedPhones = null
        return phoneIds
      })
      .catch((error) => {
        inFlightSavedPhones = null
        throw error
      })
  }

  return inFlightSavedPhones
}

export const SavedPhonesProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { data: session, status } = useSession()
  const userId = session?.user?.id ?? null
  const [savedPhoneIds, setSavedPhoneIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const replaceAll = (phoneIds: number[]) => {
    const nextIds = dedupePhoneIds(phoneIds)
    setSavedPhonesCache(nextIds)
    setSavedPhoneIds(new Set(nextIds))
  }

  const markSaved = (phoneId: number) => {
    setSavedPhoneIds((prev) => {
      if (prev.has(phoneId)) {
        return prev
      }

      const next = new Set(prev)
      next.add(phoneId)
      setSavedPhonesCache([...next])
      return next
    })
  }

  const markUnsaved = (phoneId: number) => {
    setSavedPhoneIds((prev) => {
      if (!prev.has(phoneId)) {
        return prev
      }

      const next = new Set(prev)
      next.delete(phoneId)
      setSavedPhonesCache([...next])
      return next
    })
  }

  useEffect(() => {
    let cancelled = false

    if (status === 'loading') {
      setIsLoading(cachedSavedPhoneIds == null)
      return () => {
        cancelled = true
      }
    }

    if (!userId) {
      cachedUserId = null
      cachedSavedPhoneIds = null
      inFlightSavedPhones = null
      setSavedPhoneIds(new Set())
      setIsLoading(false)
      return
    }

    if (cachedUserId !== userId) {
      cachedUserId = userId
      cachedSavedPhoneIds = null
      inFlightSavedPhones = null
    }

    if (cachedSavedPhoneIds) {
      setSavedPhoneIds(new Set(cachedSavedPhoneIds))
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    loadSavedPhoneIds()
      .then((phoneIds) => {
        if (!cancelled) {
          setSavedPhoneIds(new Set(phoneIds))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [status, userId])

  return (
    <SavedPhonesContext.Provider
      value={{
        isAuthenticated: !!userId,
        isLoading: status === 'loading' || isLoading,
        isSaved: (phoneId: number) => savedPhoneIds.has(phoneId),
        markSaved,
        markUnsaved,
        replaceAll,
      }}
    >
      {children}
    </SavedPhonesContext.Provider>
  )
}

export const useSavedPhones = () => {
  const context = useContext(SavedPhonesContext)

  if (!context) {
    throw new Error('useSavedPhones must be used inside SavedPhonesProvider.')
  }

  return context
}
