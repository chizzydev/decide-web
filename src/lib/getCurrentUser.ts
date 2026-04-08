// decide-web/src/lib/getCurrentUser.ts
// Server-side helper — retrieves the current session user.
// Use in Server Components and Route Handlers.

import { getServerSession } from 'next-auth'
import { authOptions }      from './auth'

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

export const requireAuth = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorised')
  return user
}