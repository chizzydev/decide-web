'use client'

import { API_BASE_URL } from '@/lib/apiBaseUrl'

const SESSION_KEY = 'decide_analytics_session_id'

const getSessionId = () => {
  try {
    let sessionId = window.localStorage.getItem(SESSION_KEY)
    if (!sessionId) {
      sessionId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
      window.localStorage.setItem(SESSION_KEY, sessionId)
    }
    return sessionId
  } catch {
    return null
  }
}

export const trackDecideEvent = (
  eventName: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {}
) => {
  if (typeof window === 'undefined') return

  const payload = JSON.stringify({
    event_name: eventName,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    source: 'web',
    session_id: getSessionId(),
    metadata,
  })

  void fetch(`${API_BASE_URL}/api/v1/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Product analytics should never block the user's action.
  })
}
