'use client'

// decide-web/src/components/providers/SessionProvider.tsx
// Wraps the app in NextAuth's SessionProvider.
// Must be a client component — placed in root layout.

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export const SessionProvider = ({ children }: { children: React.ReactNode }) => (
  <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
)