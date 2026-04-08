// decide-web/src/types/next-auth.d.ts
// Extends NextAuth default types to include id and role on session user.

import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:    string
      role:  string
      provider?: 'credentials' | 'google'
    } & DefaultSession['user']
    backendAccessToken?: string | null
    backendAuthError?: string | null
    googleIdToken?: string | null
  }

  interface User {
    id: string
    role?: string
    provider?: 'credentials' | 'google'
    backendAccessToken?: string
    backendRefreshToken?: string
    backendAccessTokenExpiresAt?: string
    backendRefreshTokenExpiresAt?: string
    googleIdToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    provider?: 'credentials' | 'google'
    backendAccessToken?: string
    backendRefreshToken?: string
    backendAccessTokenExpiresAt?: number
    backendRefreshTokenExpiresAt?: number
    backendAuthError?: string
    googleIdToken?: string
  }
}
