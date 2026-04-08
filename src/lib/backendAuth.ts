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

const buildBackendHeaders = (options: RequestInit, accessToken: string) => ({
  'Content-Type': 'application/json',
  ...(options.headers ?? {}),
  Authorization: `Bearer ${accessToken}`,
})

async function requireBackendAccessToken() {
  const session = await getSession()
  const accessToken = session?.backendAccessToken

  if (!accessToken) {
    throw new Error('Your secure Decide session is missing. Please sign in again.')
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

  return (await response.json()) as T
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
