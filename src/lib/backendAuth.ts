'use client'

import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server.'
  )
}

export type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorEnvelope = {
  message?: string
}

type BackendAuthErrorCode = 'missing_session' | 'unauthorized'

export class BackendAuthError extends Error {
  code: BackendAuthErrorCode
  status?: number

  constructor(message: string, code: BackendAuthErrorCode, status?: number) {
    super(message)
    this.name = 'BackendAuthError'
    this.code = code
    this.status = status
  }
}

const buildBackendHeaders = (options: RequestInit, accessToken: string) => ({
  'Content-Type': 'application/json',
  ...(options.headers ?? {}),
  Authorization: `Bearer ${accessToken}`,
})

async function requireBackendAccessToken() {
  const session = await getSession()
  const accessToken = session?.backendAccessToken

  if (!accessToken) {
    throw new BackendAuthError(
      'Your secure Decide session is missing. Please sign in again.',
      'missing_session'
    )
  }

  return accessToken
}

export async function requestJsonWithBackendAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await requireBackendAccessToken()

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...options,
    headers: buildBackendHeaders(options, accessToken),
  })

  let json: unknown = null

  try {
    json = await response.json()
  } catch {
    throw new Error('Received an invalid response from Decide.')
  }

  if (response.status === 401 || response.status === 403) {
    let message = 'Your secure Decide session ended. Please sign in again.'

    if (
      typeof json === 'object' &&
      json !== null &&
      'message' in json &&
      typeof (json as ApiErrorEnvelope).message === 'string'
    ) {
      message = (json as ApiErrorEnvelope).message ?? message
    }

    throw new BackendAuthError(message, 'unauthorized', response.status)
  }

  return json as T
}

export async function requestWithBackendAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const json = await requestJsonWithBackendAuth<ApiEnvelope<T>>(endpoint, options)

  if (!json.success) {
    throw new Error(json.message ?? 'An unexpected error occurred.')
  }

  return json.data
}
