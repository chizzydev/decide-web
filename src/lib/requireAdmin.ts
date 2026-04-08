// decide-web/src/lib/requireAdmin.ts
// Server-side guard — throws if current user is not an admin.
// Used in admin layout and admin server components.

import { redirect }        from 'next/navigation'
import { getCurrentUser }  from './getCurrentUser'

export const requireAdmin = async () => {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin') {
    redirect('/')
  }

  return user
}