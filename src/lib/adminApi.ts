'use client'

import { requestJsonWithBackendAuth } from './backendAuth'

export async function requestAdminJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return requestJsonWithBackendAuth<T>(`/admin${endpoint}`, options)
}
