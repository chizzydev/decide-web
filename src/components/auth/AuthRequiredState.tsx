'use client'

import React from 'react'
import Link from 'next/link'

interface AuthRequiredStateProps {
  eyebrow: string
  title: string
  description: string
  callbackUrl: string
  primaryLabel?: string
  secondaryLabel?: string
}

const buildAuthHref = (path: '/login' | '/register', callbackUrl: string) =>
  `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}`

export const AuthRequiredState = ({
  eyebrow,
  title,
  description,
  callbackUrl,
  primaryLabel = 'Sign in',
  secondaryLabel = 'Create account',
}: AuthRequiredStateProps) => (
  <section className="mx-auto max-w-3xl px-4 py-16">
    <div className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface shadow-sm">
      <div className="space-y-5 px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-white text-accent shadow-sm">
          <LockIcon />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            {description}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href={buildAuthHref('/login', callbackUrl)}
            className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
          >
            {primaryLabel}
          </Link>
          <Link
            href={buildAuthHref('/register', callbackUrl)}
            className="inline-flex h-11 items-center justify-center rounded-md border border-borderHigh bg-white px-6 text-sm font-bold text-text-primary transition-colors duration-fast hover:border-accent/40 hover:text-accent"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  </section>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect
      x="5"
      y="10"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 10V7a4 4 0 0 1 8 0v3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M12 14v2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)
