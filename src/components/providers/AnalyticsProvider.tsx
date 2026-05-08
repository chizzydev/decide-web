'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '')
const SESSION_KEY = 'decide_analytics_session_id'

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

const getSessionId = () => {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY)
    if (existing) return existing

    const next = createSessionId()
    window.localStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return createSessionId()
  }
}

const postAnalyticsEvent = (payload: Record<string, unknown>) => {
  if (!API_BASE_URL) return

  const url = `${API_BASE_URL}/api/v1/analytics/events`
  const body = JSON.stringify(payload)

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon(url, blob)) return
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never interrupt browsing.
  })
}

export function AnalyticsProvider() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const search = searchParams.toString()
    postAnalyticsEvent({
      event_name: 'page_view',
      path: `${pathname}${search ? `?${search}` : ''}`,
      referrer: document.referrer || null,
      source: 'web',
      session_id: getSessionId(),
    })
  }, [pathname, searchParams])

  return null
}
