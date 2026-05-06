'use client'

import { BackendAuthError, requestJsonWithBackendAuth } from './backendAuth'

export async function requestAdminJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    return await requestJsonWithBackendAuth<T>(`/admin${endpoint}`, options)
  } catch (error) {
    if (error instanceof BackendAuthError) {
      if (typeof window !== 'undefined') {
        const callbackUrl = `${window.location.pathname}${window.location.search}`
        window.location.assign(
          `/login?reason=session-expired&callbackUrl=${encodeURIComponent(callbackUrl)}`
        )
      }

      return {
        success: false,
        message: 'Your Decide admin session ended. Please sign in again.',
      } as T
    }

    throw error
  }
}
