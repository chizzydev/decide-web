'use client'

import * as Sentry from '@sentry/nextjs'
import React, { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-bg px-4 font-ui text-text-primary">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Decide
            </p>
            <h1 className="text-2xl font-black tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm leading-relaxed text-text-secondary">
              We could not load this part of Decide properly. Try again, and if it
              repeats, the error has been reported.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
