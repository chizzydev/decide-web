// decide-web/src/components/layout/Footer.tsx
// Shared footer rendered on all pages in both route groups.
// Dark navy-700 surface — creates a strong visual anchor at the bottom
// of every page and contrasts cleanly with the white/off-white body.

import React from 'react'
import Link from 'next/link'

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'support@decide.com.ng'

const FOOTER_LINKS = {
  Product: [
    { href: '/assistant', label: 'Find My Phone'       },
    { href: '/analyze',   label: 'Should I Buy This?'  },
    { href: '/phones',    label: 'Browse Phones'        },
    { href: '/brands',    label: 'Browse Brands'        },
    { href: '/compare',   label: 'Compare Phones'       },
  ],
  Support: [
    { href: '/alerts',       label: 'Price Alerts' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about',        label: 'About Decide' },
  ],
}

const SOCIAL_LINKS = [
  { label: 'X', href: process.env.NEXT_PUBLIC_SOCIAL_X_URL },
  { label: 'WhatsApp', href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP_URL },
  { label: 'Facebook', href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL },
].filter((link): link is { label: string; href: string } => Boolean(link.href))

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-navy-700 mt-10 md:mt-16">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-28 md:pb-12">

        {/* Top row — brand and link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/[0.08]">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link
              href="/"
              className="inline-block font-ui font-black text-xl tracking-tight mb-3"
            >
              <span className="text-white">deci</span>
              {/* teal-400 on dark surface — lighter shade reads well on navy */}
              <span className="text-teal-400">de</span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Nigeria&apos;s smartest phone advisor. Answer five questions.
              Get the right phone for your budget and lifestyle — with
              real Nigerian prices and gray market warnings.
            </p>

            <p className="mt-4 text-xs text-slate-500 leading-relaxed max-w-xs">
              Prices are tracked from Nigerian store listings and updated as new
              checks are available. Always verify before buying because store
              prices can change after publication.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-flex text-sm font-semibold text-teal-300 transition-colors duration-fast hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>

            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Decide social links">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center rounded-md border border-white/10 px-3 text-xs font-bold text-slate-300 transition-colors duration-fast hover:border-teal-400/50 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3">
                {group}
              </p>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-fast"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row — legal */}
        <div className="pt-6 flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="text-xs text-slate-500">
            © {currentYear} Decide. Built for Nigerians.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors duration-fast"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors duration-fast"
            >
              Terms of Use
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
