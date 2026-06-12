// decide-web/src/app/api/auth/[...nextauth]/route.ts

import { createHash } from 'crypto'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const nextAuthHandler = NextAuth(authOptions) as (
  request: Request,
  context?: unknown
) => Promise<Response>

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BLOCK_MS = 15 * 60 * 1000
const MAX_EMAIL_FAILURES = 5
const MAX_IP_FAILURES = 12

type AttemptRecord = {
  count: number
  firstAttemptAt: number
  blockedUntil?: number
}

const emailAttempts = new Map<string, AttemptRecord>()
const ipAttempts = new Map<string, AttemptRecord>()

const hashKey = (value: string) =>
  createHash('sha256').update(value).digest('hex')

const normalizeEmail = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim()

  return (
    firstForwardedIp ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

const isCredentialsCallback = (request: Request) => {
  const pathname = new URL(request.url).pathname
  return pathname.endsWith('/api/auth/callback/credentials')
}

const getCredentialsIdentity = async (request: Request) => {
  try {
    const formData = await request.clone().formData()
    return {
      emailKey: normalizeEmail(formData.get('email')),
      ipKey: getClientIp(request),
    }
  } catch {
    return {
      emailKey: '',
      ipKey: getClientIp(request),
    }
  }
}

const getActiveBlockUntil = (record?: AttemptRecord) => {
  if (!record?.blockedUntil) return null
  if (Date.now() < record.blockedUntil) return record.blockedUntil
  return null
}

const getCurrentRecord = (store: Map<string, AttemptRecord>, key: string) => {
  const now = Date.now()
  const current = store.get(key)

  if (!current) return undefined

  if (current.blockedUntil && now < current.blockedUntil) {
    return current
  }

  if (now - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    store.delete(key)
    return undefined
  }

  return current
}

const recordFailure = (
  store: Map<string, AttemptRecord>,
  key: string,
  maxFailures: number
) => {
  const now = Date.now()
  const current = getCurrentRecord(store, key)
  const nextRecord: AttemptRecord = current
    ? { ...current, count: current.count + 1 }
    : { count: 1, firstAttemptAt: now }

  if (nextRecord.count >= maxFailures) {
    nextRecord.blockedUntil = now + LOGIN_BLOCK_MS
  }

  store.set(key, nextRecord)
  return nextRecord.blockedUntil && now < nextRecord.blockedUntil
    ? nextRecord.blockedUntil
    : null
}

const clearAttempts = (emailKey: string, ipKey: string) => {
  if (emailKey) emailAttempts.delete(hashKey(emailKey))
  ipAttempts.delete(hashKey(ipKey))
}

const tooManyAttemptsResponse = (blockedUntil: number) => {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((blockedUntil - Date.now()) / 1000)
  )
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
  const url = `/login?error=TooManyLoginAttempts&retryAfter=${retryAfterSeconds}&retryAfterMinutes=${retryAfterMinutes}`

  return Response.json(
    {
      ok: false,
      status: 429,
      error: 'TooManyLoginAttempts',
      message:
        'Too many failed sign-in attempts. Please wait a few minutes and try again.',
      url,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': String(MAX_EMAIL_FAILURES),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

const getCallbackError = async (response: Response) => {
  const location = response.headers.get('location') ?? ''
  if (location) {
    try {
      const url = new URL(location, response.url || 'http://localhost')
      const error = url.searchParams.get('error')

      if (error) {
        return {
          error,
          retryAfter: Number.parseInt(url.searchParams.get('retryAfter') || '', 10),
          retryAfterMinutes: Number.parseInt(
            url.searchParams.get('retryAfterMinutes') || '',
            10
          ),
        }
      }
    } catch {
      // Ignore malformed redirect URLs and fall through to JSON parsing.
    }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  try {
    const body = (await response.clone().json()) as { url?: string; error?: string }
    if (body.error === 'TooManyLoginAttempts') {
      return {
        error: body.error,
        retryAfter: Number.NaN,
        retryAfterMinutes: Number.NaN,
      }
    }

    if (!body.url) return null

    const url = new URL(body.url, response.url || 'http://localhost')
    const error = url.searchParams.get('error')

    if (!error) return null

    return {
      error,
      retryAfter: Number.parseInt(url.searchParams.get('retryAfter') || '', 10),
      retryAfterMinutes: Number.parseInt(
        url.searchParams.get('retryAfterMinutes') || '',
        10
      ),
    }
  } catch {
    return null
  }
}

const isCredentialsFailure = async (response: Response) => {
  const callbackError = await getCallbackError(response)
  if (callbackError?.error === 'CredentialsSignin') return true
  if (response.status === 401) return true

  return false
}

export const GET = nextAuthHandler

export async function POST(request: Request, context: unknown) {
  if (!isCredentialsCallback(request)) {
    return nextAuthHandler(request, context)
  }

  const { emailKey, ipKey } = await getCredentialsIdentity(request)
  const hashedEmailKey = emailKey ? hashKey(emailKey) : ''
  const hashedIpKey = hashKey(ipKey)
  const emailBlockedUntil = hashedEmailKey
    ? getActiveBlockUntil(getCurrentRecord(emailAttempts, hashedEmailKey))
    : null
  const ipBlockedUntil = getActiveBlockUntil(getCurrentRecord(ipAttempts, hashedIpKey))
  const existingBlockUntil = Math.max(emailBlockedUntil ?? 0, ipBlockedUntil ?? 0)

  if (existingBlockUntil > Date.now()) {
    return tooManyAttemptsResponse(existingBlockUntil)
  }

  const response = await nextAuthHandler(request, context)
  const callbackError = await getCallbackError(response)

  if (callbackError?.error === 'TooManyLoginAttempts') {
    const retryAfterSeconds = Number.isNaN(callbackError.retryAfter)
      ? LOGIN_BLOCK_MS / 1000
      : callbackError.retryAfter

    return tooManyAttemptsResponse(Date.now() + retryAfterSeconds * 1000)
  }

  if (await isCredentialsFailure(response)) {
    const newEmailBlockUntil = hashedEmailKey
      ? recordFailure(emailAttempts, hashedEmailKey, MAX_EMAIL_FAILURES)
      : null
    const newIpBlockUntil = recordFailure(ipAttempts, hashedIpKey, MAX_IP_FAILURES)
    const newBlockUntil = Math.max(newEmailBlockUntil ?? 0, newIpBlockUntil ?? 0)

    if (newBlockUntil > Date.now()) {
      return tooManyAttemptsResponse(newBlockUntil)
    }

    return response
  }

  clearAttempts(emailKey, ipKey)
  return response
}
