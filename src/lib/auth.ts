// decide-web/src/lib/auth.ts
// NextAuth configuration — credentials + Google OAuth.
// Validates credentials against decide-api, then stores backend auth material
// in the NextAuth JWT so the browser only receives a short-lived access token.

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set.')
}

type BackendAuthResponse = {
  user: {
    id: string
    email: string
    display_name: string | null
    avatar_url: string | null
    role: string
    provider: 'credentials' | 'google'
  }
  access_token: string
  refresh_token: string
  access_token_expires_at: string
  refresh_token_expires_at: string
}

const REFRESH_RETRY_BACKOFF_MS = 5_000

const readBackendSession = async (
  path: '/api/v1/mobile-auth/login' | '/api/v1/mobile-auth/google' | '/api/v1/mobile-auth/refresh',
  body: Record<string, unknown>
): Promise<BackendAuthResponse | null> => {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    if (!text) return null

    let json: { success?: boolean; data?: unknown }
    try {
      json = JSON.parse(text)
    } catch {
      return null
    }

    if (!json.success || !json.data) return null

    return json.data as BackendAuthResponse
  } catch {
    return null
  }
}

const shouldRefreshAccessToken = (expiresAt?: number) => {
  if (!expiresAt) return false
  return Date.now() >= expiresAt - 60_000
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const backendSession = await readBackendSession('/api/v1/mobile-auth/login', {
          email: credentials.email,
          password: credentials.password,
        })

        if (!backendSession) return null

        return {
          id: backendSession.user.id,
          email: backendSession.user.email,
          name: backendSession.user.display_name,
          image: backendSession.user.avatar_url,
          role: backendSession.user.role,
          provider: backendSession.user.provider,
          backendAccessToken: backendSession.access_token,
          backendRefreshToken: backendSession.refresh_token,
          backendAccessTokenExpiresAt: backendSession.access_token_expires_at,
          backendRefreshTokenExpiresAt: backendSession.refresh_token_expires_at,
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const backendSession = await readBackendSession('/api/v1/mobile-auth/google', {
          id_token: (account as { id_token?: string } | null)?.id_token,
        })

        if (!backendSession) {
          return false
        }

        user.id = backendSession.user.id
        user.role = backendSession.user.role
        user.provider = backendSession.user.provider
        user.backendAccessToken = backendSession.access_token
        user.backendRefreshToken = backendSession.refresh_token
        user.backendAccessTokenExpiresAt = backendSession.access_token_expires_at
        user.backendRefreshTokenExpiresAt = backendSession.refresh_token_expires_at
        user.googleIdToken = (account as { id_token?: string } | null)?.id_token
      }

      return true
    },

    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = user.role ?? 'user'
        token.provider = user.provider ?? 'credentials'
        token.backendAccessToken = user.backendAccessToken
        token.backendRefreshToken = user.backendRefreshToken
        token.backendAccessTokenExpiresAt = user.backendAccessTokenExpiresAt
          ? Date.parse(user.backendAccessTokenExpiresAt)
          : undefined
        token.backendRefreshTokenExpiresAt = user.backendRefreshTokenExpiresAt
          ? Date.parse(user.backendRefreshTokenExpiresAt)
          : undefined
        token.googleIdToken = user.googleIdToken
        token.backendAuthError = undefined
        token.backendRefreshRetryAt = undefined
      }

      if (trigger === 'update' && updateData) {
        if (updateData.name !== undefined) token.name = updateData.name
        if (updateData.role !== undefined) token.role = updateData.role
        if (updateData.image !== undefined) token.picture = updateData.image
      }

      if (!token.backendRefreshToken || !token.backendAccessToken) {
        return token
      }

      if (!shouldRefreshAccessToken(token.backendAccessTokenExpiresAt)) {
        return token
      }

      const refreshStillValid =
        !token.backendRefreshTokenExpiresAt ||
        Date.now() < token.backendRefreshTokenExpiresAt

      if (!refreshStillValid) {
        token.backendAccessToken = undefined
        token.backendRefreshToken = undefined
        token.backendAccessTokenExpiresAt = undefined
        token.backendRefreshTokenExpiresAt = undefined
        token.backendAuthError = 'RefreshTokenExpired'
        token.backendRefreshRetryAt = undefined
        return token
      }

      if (
        token.backendRefreshRetryAt &&
        Date.now() < token.backendRefreshRetryAt
      ) {
        return token
      }

      const refreshed = await readBackendSession('/api/v1/mobile-auth/refresh', {
        refresh_token: token.backendRefreshToken,
      })

      if (!refreshed) {
        token.backendAuthError = 'RefreshAccessTokenError'
        token.backendRefreshRetryAt = Date.now() + REFRESH_RETRY_BACKOFF_MS
        return token
      }

      token.id = refreshed.user.id
      token.name = refreshed.user.display_name ?? token.name
      token.email = refreshed.user.email
      token.role = refreshed.user.role
      token.provider = refreshed.user.provider
      token.backendAccessToken = refreshed.access_token
      token.backendRefreshToken = refreshed.refresh_token
      token.backendAccessTokenExpiresAt = Date.parse(refreshed.access_token_expires_at)
      token.backendRefreshTokenExpiresAt = Date.parse(refreshed.refresh_token_expires_at)
      token.backendAuthError = undefined
      token.backendRefreshRetryAt = undefined

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.provider = token.provider as 'credentials' | 'google' | undefined
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string
        if (token.picture) session.user.image = token.picture as string
      }

      session.backendAccessToken = (token.backendAccessToken as string | undefined) ?? null
      session.backendAuthError = (token.backendAuthError as string | undefined) ?? null
      session.googleIdToken = (token.googleIdToken as string | undefined) ?? null

      return session
    },
  },
}
