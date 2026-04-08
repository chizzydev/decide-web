// decide-web/src/app/admin/layout.tsx
// Admin layout — persistent sidebar + protected route.
// Checks admin role on every render — redirects non-admins.

import { requireAdmin } from '@/lib/requireAdmin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen flex bg-bg">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}