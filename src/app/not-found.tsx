// decide-web/src/app/not-found.tsx
// Custom 404 page — shown when a route or resource is not found.

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-2xl" aria-hidden="true">📱</p>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-text-secondary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}