'use client'

import React from 'react'

interface ErrorProps {
  error:  Error & { digest?: string }
  reset:  () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-2xl" aria-hidden="true">⚠️</p>
        <h2 className="text-xl font-black text-text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-text-secondary">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}