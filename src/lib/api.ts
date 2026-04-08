// decide-web/src/lib/api.ts
// Shared public API client for Decide web.
// Account-owned routes that require bearer auth should go through
// requestWithBackendAuth in lib/backendAuth instead of this file.

import type {
  ApiResponse,
  Brand,
  CompareBody,
  CompareResult,
  PhoneCard,
  PhoneDetail,
  PhoneFilters,
  RecommendationResult,
  UserPreferences,
} from '@/types'
import type { AnalyzeInput, AnalyzeResult } from '@/types/analyzer'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart the dev server.'
  )
}

const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}/api/v1${endpoint}`

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  })

  const json: ApiResponse<T> = await response.json()

  if (!json.success || !response.ok) {
    throw new Error(json.message ?? 'An unexpected error occurred.')
  }

  return json.data as T
}

export const phonesApi = {
  getAll: (filters: PhoneFilters = {}): Promise<PhoneCard[]> => {
    const params = new URLSearchParams()

    if (filters.os_type) params.set('os_type', filters.os_type)
    if (filters.brand_slug) params.set('brand_slug', filters.brand_slug)
    if (filters.search) params.set('search', filters.search)
    if (filters.is_featured !== undefined) {
      params.set('is_featured', String(filters.is_featured))
    }
    if (filters.min_price !== undefined) {
      params.set('min_price', String(filters.min_price))
    }
    if (filters.max_price !== undefined) {
      params.set('max_price', String(filters.max_price))
    }
    if (filters.limit !== undefined) {
      params.set('limit', String(filters.limit))
    }
    if (filters.offset !== undefined) {
      params.set('offset', String(filters.offset))
    }

    const query = params.toString()
    return request<PhoneCard[]>(`/phones${query ? `?${query}` : ''}`)
  },

  getFeatured: (): Promise<PhoneCard[]> => request<PhoneCard[]>('/phones/featured'),

  search: (query: string): Promise<PhoneCard[]> => {
    const params = new URLSearchParams({ q: query })
    return request<PhoneCard[]>(`/phones/search?${params.toString()}`)
  },

  getBySlug: (slug: string): Promise<PhoneDetail> =>
    request<PhoneDetail>(`/phones/${slug}`),
}

export const brandsApi = {
  getAll: (os_type?: 'android' | 'ios'): Promise<Brand[]> => {
    const query = os_type ? `?os_type=${os_type}` : ''
    return request<Brand[]>(`/brands${query}`)
  },

  getBySlug: (slug: string): Promise<Brand> =>
    request<Brand>(`/brands/${slug}`),
}

export const recommendApi = {
  getRecommendations: (
    preferences: UserPreferences
  ): Promise<RecommendationResult> =>
    request<RecommendationResult>('/recommend', {
      method: 'POST',
      body: JSON.stringify(preferences),
    }),
}

export const analyzeApi = {
  analyze: (input: AnalyzeInput): Promise<AnalyzeResult> =>
    request<AnalyzeResult>('/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}

export const compareApi = {
  compareTwoPhones: (body: CompareBody): Promise<CompareResult> =>
    request<CompareResult>('/compare', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const agentApi = {
  decide: (message: string): Promise<any> =>
    request<any>('/agent/decide', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
}
