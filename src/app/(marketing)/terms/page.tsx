import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use - Decide',
  description: 'The rules and responsibilities for using Decide safely and fairly.',
}

const SECTIONS = [
  {
    title: 'What Decide provides',
    body: [
      'Decide provides phone research, recommendation, comparison, price intelligence, watchlist, alert, marketplace context, and buying guidance for Nigerian phone buyers.',
      'Decide is an advisory product. It does not guarantee that any phone, seller, price, store listing, marketplace listing, warranty, or payment path will remain available, accurate, safe, or suitable for you.',
    ],
  },
  {
    title: 'Your responsibility before buying',
    body: [
      'You are responsible for verifying the phone, seller, condition, warranty, variant, RAM, storage, IMEI, iCloud or lock status, payment method, delivery, and handoff before you pay.',
      'Do not rely on a low price alone. If a listing looks unusually cheap, incomplete, mismatched, rushed, or unsafe, treat it as risky until independently verified.',
    ],
  },
  {
    title: 'Prices, alerts, and availability',
    body: [
      'Prices can change after Decide records them. Alerts depend on available tracked data and may be delayed, missed, duplicated, or affected by store changes, network issues, scraping limitations, listing errors, or marketplace volatility.',
      'Trusted retail prices and Jiji marketplace leads are deliberately separated. A marketplace lead is not a safe-to-pay recommendation; it is a prompt to inspect carefully.',
    ],
  },
  {
    title: 'Alert Pro',
    body: [
      'Alert Pro is a 30-day subscription that unlocks higher alert limits, Smart Nearby Alerts, and optional Jiji marketplace leads. Paid access is activated only after verified payment confirmation from the payment provider.',
      'Decide may adjust pricing, feature limits, or availability over time. Active paid periods will keep the access granted for that period unless fraud, abuse, chargeback misuse, or technical misuse is detected.',
    ],
  },
  {
    title: 'Fair use',
    body: [
      'You agree not to misuse Decide, scrape it aggressively, attack the service, bypass security controls, manipulate payments, abuse alerts, submit misleading reviews, or interfere with other users.',
      'We may limit, suspend, or remove access where we reasonably believe an account is being used for fraud, spam, abuse, security attacks, or activity that harms Decide or its users.',
    ],
  },
  {
    title: 'Third-party services',
    body: [
      'Decide may link to stores, marketplaces, payment providers, or other third-party services. Those services are controlled by their owners, not Decide.',
      'When you leave Decide or interact with a third-party service, their terms, policies, prices, seller rules, and dispute processes apply.',
    ],
  },
  {
    title: 'Changes to these terms',
    body: [
      'We may update these Terms of Use as Decide changes. Continued use of Decide after updates means you accept the revised terms.',
    ],
  },
] as const

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Terms of Use
        </p>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">
          Terms of Use
        </h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          The rules and responsibilities for using Decide safely and fairly.
        </p>
      </header>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm">
            <h2 className="text-xl font-black tracking-tight text-text-primary">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
      >
        Back to Decide
      </Link>
    </main>
  )
}
