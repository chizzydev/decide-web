import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Decide',
  description: 'How Decide handles account, alert, payment-status, and product usage information.',
}

const SECTIONS = [
  {
    title: 'Information we collect',
    body: [
      'Decide collects the information needed to operate your account and phone decision features. This may include your name, email address, saved phones, watchlist activity, price alerts, reviews, alert preferences, and Alert Pro payment status.',
      'We may also collect basic technical information such as device type, browser, app version, IP address, usage events, error logs, and security signals so we can keep Decide reliable, secure, and useful.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'We use your information to authenticate your account, sync your watchlist, deliver alerts, process subscription status, improve recommendations, prevent abuse, investigate errors, and protect the integrity of Decide.',
      'We do not sell your personal information. Payment card or bank details are handled by the payment provider. Decide stores only the payment reference, provider status, and subscription result needed to activate and support Alert Pro.',
    ],
  },
  {
    title: 'Alerts, marketplace leads, and third parties',
    body: [
      'Price alerts and marketplace leads depend on tracked store and listing data. If you open a third-party store, payment provider, or marketplace listing, their own privacy policy applies to what you do there.',
      'Jiji and other marketplace leads are treated as seller-led opportunities, not guaranteed safe deals. Avoid sharing sensitive information with sellers until you have verified the listing and handoff process.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can remove saved phones, delete alerts, sign out, and manage account-owned activity from Decide. You can also contact support if you need help with your account or want certain information reviewed.',
      'If you use Alert Pro, access lasts for the paid 30-day period. You can stop renewing the plan when the period ends.',
    ],
  },
  {
    title: 'Security and retention',
    body: [
      'We use reasonable technical and operational safeguards to protect account and alert data. No online system is perfect, so you should also protect your login details and avoid sharing sensitive payment or account information with sellers.',
      'We keep information for as long as needed to provide Decide, comply with obligations, prevent fraud, resolve disputes, and improve the product.',
    ],
  },
  {
    title: 'Updates',
    body: [
      'We may update this Privacy Policy as Decide grows. When changes are meaningful, we will make reasonable efforts to make the updated policy easy to find.',
    ],
  },
] as const

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          Privacy Policy
        </p>
        <h1 className="text-4xl font-black tracking-tight text-text-primary">
          Privacy Policy
        </h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          How Decide handles account, alert, payment-status, and product usage information.
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
