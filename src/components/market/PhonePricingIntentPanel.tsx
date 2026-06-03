import Link from 'next/link'
import { Card } from '@/components/ui'
import type { PhonePricingIntentLink } from '@/lib/phonePricingSeo'

interface PhonePricingIntentPanelProps {
  title?: string
  description?: string
  links: PhonePricingIntentLink[]
  activeKey?: PhonePricingIntentLink['key'] | null
}

export const PhonePricingIntentPanel = ({
  title = 'Dedicated price pages',
  description = 'These intent pages turn Decide price data into direct answers for the exact searches buyers already make.',
  links,
  activeKey = null,
}: PhonePricingIntentPanelProps) => (
  <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
    <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 md:px-6">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight text-text-primary">{title}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
    </div>

    <div className="grid gap-3 px-5 py-5 md:grid-cols-2 md:px-6">
      {links.map((link) => {
        const isActive = link.key === activeKey

        return (
          <Link
            key={link.key}
            href={link.href}
            className={[
              'rounded-2xl border px-4 py-4 transition-colors duration-fast',
              isActive
                ? 'border-accent bg-accent-subtle/60'
                : 'border-border bg-white hover:border-borderHigh hover:bg-surfaceHigh',
            ].join(' ')}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              {link.label}
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">
              {link.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {link.description}
            </p>
          </Link>
        )
      })}
    </div>
  </Card>
)
