const PRODUCTION_API_URL = 'https://decide-api-production-8aa7.up.railway.app'
const DEVELOPMENT_API_URL = 'http://localhost:3001'

const FRONTEND_HOSTS = new Set([
  'decide.com.ng',
  'www.decide.com.ng',
  'localhost:3000',
  '127.0.0.1:3000',
])

const DEFAULT_API_URL =
  process.env.NODE_ENV === 'development' ? DEVELOPMENT_API_URL : PRODUCTION_API_URL

const normalizeApiBaseUrl = (value: string | undefined) => {
  const candidate = value?.trim().replace(/\/+$/, '')

  if (!candidate) return DEFAULT_API_URL

  try {
    const url = new URL(candidate)

    if (FRONTEND_HOSTS.has(url.host)) {
      return DEFAULT_API_URL
    }

    return candidate
  } catch {
    return DEFAULT_API_URL
  }
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
