import * as Sentry from '@sentry/nextjs'

const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.05')

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.05,
  })
}
