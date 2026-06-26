// decide-web/src/components/layout/Footer.tsx
// Shared footer rendered on all pages in both route groups.

import Link from 'next/link'

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'support@decide.com.ng'

const FOOTER_LINKS = {
  Product: [
    { href: '/assistant', label: 'Find My Phone' },
    { href: '/analyze', label: 'Should I Buy This?' },
    { href: '/phones', label: 'Browse Phones' },
    { href: '/brands', label: 'Browse Brands' },
    { href: '/compare', label: 'Compare Phones' },
  ],
  Guides: [
    { href: '/phone-buying-intelligence-nigeria', label: 'Phone Buying Intelligence' },
    { href: '/compare-phone-prices-nigeria', label: 'Compare Phone Prices' },
    { href: '/best-phones-in-nigeria', label: 'Best Phones in Nigeria' },
    { href: '/best-phones-under-200000-naira-nigeria', label: 'Phones Under N200k' },
    { href: '/phone-price-drops-nigeria', label: 'Phone Price Drops' },
  ],
  'Buy Safely': [
    { href: '/jumia-phone-prices-nigeria', label: 'Jumia Phone Prices' },
    { href: '/slot-phone-prices-nigeria', label: 'Slot Phone Prices' },
    { href: '/jiji-used-phones-nigeria', label: 'Jiji Used Phones' },
    { href: '/where-to-buy-phones-in-nigeria', label: 'Where To Buy Phones' },
    { href: '/safest-places-to-buy-phones-in-nigeria', label: 'Safe Buying Guide' },
  ],
  Brands: [
    { href: '/best-samsung-phones-in-nigeria', label: 'Samsung Phones' },
    { href: '/best-tecno-phones-in-nigeria', label: 'Tecno Phones' },
    { href: '/best-infinix-phones-in-nigeria', label: 'Infinix Phones' },
    { href: '/best-redmi-xiaomi-phones-in-nigeria', label: 'Redmi/Xiaomi Phones' },
    { href: '/best-iphones-in-nigeria', label: 'iPhones' },
  ],
  'Use Cases': [
    { href: '/best-gaming-phones-under-200000-naira-nigeria', label: 'Gaming Under N200k' },
    { href: '/best-camera-phones-under-200000-naira-nigeria', label: 'Camera Under N200k' },
    { href: '/phones-with-strong-battery-in-nigeria', label: 'Strong Battery Phones' },
    { href: '/best-fast-charging-phones-in-nigeria', label: 'Fast Charging Phones' },
    { href: '/best-phones-for-content-creation-in-nigeria', label: 'Creator Phones' },
  ],
  Support: [
    { href: '/alerts', label: 'Price Alerts' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About Decide' },
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
    <footer className="mt-0 bg-navy-700">
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-12 md:pb-12">
        <div className="grid grid-cols-2 gap-8 border-b border-white/[0.08] pb-10 md:grid-cols-8">
          <div className="col-span-2 md:col-span-2">
            <Link
              href="/"
              className="mb-3 inline-block font-ui text-xl font-black tracking-tight"
            >
              <span className="text-white">deci</span>
              <span className="text-teal-400">de</span>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              Decide is Nigeria&apos;s phone buying intelligence platform. Compare
              live phone prices, price drops, buy-or-wait verdicts, Jiji context,
              and safer buying guidance before you pay.
            </p>

            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-300">
              Decide does not sell phones directly. We help you decide what to
              buy and where to verify the latest external price.
            </p>

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-flex text-sm font-semibold text-teal-300 transition-colors duration-fast hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>

            {SOCIAL_LINKS.length > 0 ? (
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
            ) : null}
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
                {group}
              </p>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-slate-300 transition-colors duration-fast hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-6">
          <p className="text-xs text-slate-300">
            &copy; {currentYear} Decide. Built for Nigerians.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-slate-300 transition-colors duration-fast hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-slate-300 transition-colors duration-fast hover:text-white"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
