// decide-web/src/lib/api.ts
// Shared public API client for Decide web.
// Account-owned routes that require bearer auth should go through
// requestWithBackendAuth in lib/backendAuth instead of this file.

import type {
  ApiResponse,
  Brand,
  BuyNowWaitResponse,
  CompareBody,
  CompareResult,
  PhoneCard,
  PhoneDetail,
  PhoneMarketplaceOffersResponse,
  PhoneFilters,
  PhonePriceHistoryResponse,
  PriceDropRadarFilters,
  PriceDropRadarResponse,
  PriceHistoryQuery,
  MarketplaceLeadsResponse,
  RecommendationResult,
  StillWorthItResponse,
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

const REQUEST_TIMEOUT_MS = 15_000

type DecideRequestInit = RequestInit & {
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

async function request<T>(
  endpoint: string,
  options: DecideRequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}/api/v1${endpoint}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const handleAbort = () => controller.abort()

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort()
    } else {
      options.signal.addEventListener('abort', handleAbort, { once: true })
    }
  }

  let response: Response

  try {
    response = await fetch(url, {
      ...defaultOptions,
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    } as RequestInit)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Decide is taking too long to load this data. Please try again.')
    }

    throw error
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', handleAbort)
  }

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
    return request<PhoneCard[]>(`/phones${query ? `?${query}` : ''}`, {
      next: { revalidate: 60, tags: ['phones'] },
    })
  },

  getFeatured: (): Promise<PhoneCard[]> =>
    request<PhoneCard[]>('/phones/featured', {
      next: { revalidate: 60, tags: ['phones'] },
    }),

  search: (query: string): Promise<PhoneCard[]> => {
    const params = new URLSearchParams({ q: query })
    return request<PhoneCard[]>(`/phones/search?${params.toString()}`, {
      next: { revalidate: 30, tags: ['phones'] },
    })
  },

  getBySlug: (slug: string): Promise<PhoneDetail> =>
    request<PhoneDetail>(`/phones/${slug}`, {
      next: { revalidate: 120, tags: ['phones', `phone:${slug}`] },
    }),

  getMarketplaceOffers: (slug: string): Promise<PhoneMarketplaceOffersResponse> =>
    request<PhoneMarketplaceOffersResponse>(`/phones/${slug}/marketplace-offers`, {
      cache: 'no-store',
    }),
}

export const brandsApi = {
  getAll: (os_type?: 'android' | 'ios'): Promise<Brand[]> => {
    const query = os_type ? `?os_type=${os_type}` : ''
    return request<Brand[]>(`/brands${query}`, {
      next: { revalidate: 300, tags: ['brands'] },
    })
  },

  getBySlug: (slug: string): Promise<Brand> =>
    request<Brand>(`/brands/${slug}`, {
      next: { revalidate: 300, tags: ['brands', `brand:${slug}`] },
    }),
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

  getBySlugs: (
    slugA: string,
    slugB: string,
    options: {
      leftVariantId?: number
      rightVariantId?: number
    } = {}
  ): Promise<CompareResult> => {
    const params = new URLSearchParams()

    if (options.leftVariantId !== undefined) {
      params.set('left_variant_id', String(options.leftVariantId))
    }

    if (options.rightVariantId !== undefined) {
      params.set('right_variant_id', String(options.rightVariantId))
    }

    const suffix = params.toString()

    return request<CompareResult>(
      `/compare/${slugA}/vs/${slugB}${suffix ? `?${suffix}` : ''}`,
      {
        next: {
          revalidate: 120,
          tags: ['compare', `phone:${slugA}`, `phone:${slugB}`],
        },
      }
    )
  },
}

export const marketApi = {
  getPhonePriceHistory: (
    slug: string,
    query: PriceHistoryQuery = {}
  ): Promise<PhonePriceHistoryResponse> => {
    const params = new URLSearchParams()

    if (query.days !== undefined) {
      params.set('days', String(query.days))
    }
    if (query.store) {
      params.set('store', query.store)
    }
    if (query.variant_id !== undefined) {
      params.set('variant_id', String(query.variant_id))
    }

    const suffix = params.toString()

    return request<PhonePriceHistoryResponse>(
      `/market/phones/${slug}/price-history${suffix ? `?${suffix}` : ''}`,
      { next: { revalidate: 60, tags: ['market', `phone:${slug}`] } }
    )
  },

  getPriceDropRadar: (
    filters: PriceDropRadarFilters = {}
  ): Promise<PriceDropRadarResponse> => {
    const params = new URLSearchParams()

    if (filters.limit !== undefined) {
      params.set('limit', String(filters.limit))
    }
    if (filters.os_type) {
      params.set('os_type', filters.os_type)
    }
    if (filters.brand_slug) {
      params.set('brand_slug', filters.brand_slug)
    }
    if (filters.max_price !== undefined) {
      params.set('max_price', String(filters.max_price))
    }
    if (filters.min_drop_ngn !== undefined) {
      params.set('min_drop_ngn', String(filters.min_drop_ngn))
    }

    const suffix = params.toString()

    return request<PriceDropRadarResponse>(
      `/market/deals/radar${suffix ? `?${suffix}` : ''}`,
      { next: { revalidate: 30, tags: ['market'] } }
    )
  },

  getMarketplaceLeads: (limit = 12): Promise<MarketplaceLeadsResponse> => {
    const params = new URLSearchParams({ limit: String(limit) })
    return request<MarketplaceLeadsResponse>(
      `/market/marketplace-leads?${params.toString()}`,
      { next: { revalidate: 30, tags: ['marketplace'] } }
    )
  },
}

export const editorialApi = {
  getBuyNowWait: (slug: string): Promise<BuyNowWaitResponse> =>
    request<BuyNowWaitResponse>(`/editorial/phones/${slug}/buy-now-or-wait`, {
      cache: 'no-store',
    }),

  getStillWorthIt: (slug: string): Promise<StillWorthItResponse> =>
    request<StillWorthItResponse>(`/editorial/phones/${slug}/still-worth-it`, {
      cache: 'no-store',
    }),
}

export const agentApi = {
  decide: (message: string): Promise<any> =>
    request<any>('/agent/decide', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
}
