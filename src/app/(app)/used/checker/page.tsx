import type { Metadata } from 'next'
import Link from 'next/link'
import { DecisionLoopPanel } from '@/components/market/DecisionLoopPanel'
import { StructuredData } from '@/components/seo/StructuredData'
import { Badge } from '@/components/ui'
import { phonesApi } from '@/lib/api'
import { filterUserFacingPhones } from '@/lib/brandCatalog'
import { formatNaira } from '@/lib/formatters'
import { absoluteUrl, buildPageMetadata } from '@/lib/seo'
import { getPrimaryPhoneCardCompareAction } from '@/lib/relatedCompare'
import { curateShowcasePhones } from '@/lib/showcasePhones'
import type { PhoneCard } from '@/types'

export const metadata: Metadata = buildPageMetadata({
  title: 'Used Phone Checker - Decide',
  description:
    "Use Decide's Nigeria-focused used phone checker to understand seller language, spot red flags, and open model-specific inspection guides before you pay.",
  path: '/used/checker',
  keywords: [
    'used phone checker Nigeria',
    'tokunbo phone guide Nigeria',
    'how to buy used phone Nigeria',
  ],
  type: 'article',
})

const SELLER_TERMS = [
  {
    term: 'Brand new non-active',
    verdict: 'Best-case label, but still verify the activation story before paying.',
    tone: 'safe',
  },
  {
    term: 'UK used / US used',
    verdict: 'Not automatically bad, but treat it as a full inspection job, not a casual purchase.',
    tone: 'caution',
  },
  {
    term: 'Refurbished',
    verdict: 'Not necessarily a dealbreaker, but only if it is disclosed honestly and the replaced parts are clear.',
    tone: 'caution',
  },
  {
    term: 'Converted / locked',
    verdict: 'Walk away unless you can prove exactly what was changed and why.',
    tone: 'danger',
  },
] as const

const TRUST_PILLARS = [
  {
    eyebrow: 'Identity first',
    title: 'Confirm what the phone actually is',
    description:
      'Match the model, IMEI, and seller story. The first risk in the Nigerian used market is paying for the wrong variant or a half-explained device history.',
  },
  {
    eyebrow: 'Inspect the hardware',
    title: 'Check the parts that make or break the deal',
    description:
      'Battery, screen, cameras, Face ID, ports, and charging behavior are not small details. They are the real difference between a fair deal and hidden future cost.',
  },
  {
    eyebrow: 'Verify the lock state',
    title: 'Activation and account checks are mandatory',
    description:
      'Never rely on seller words alone. If the phone is still linked, converted, or remotely controllable, you should know before money changes hands.',
  },
  {
    eyebrow: 'Think beyond today',
    title: 'Factor repair and support into the price',
    description:
      'A lower asking price means less if parts are scarce, service is weak, or the model is already aging out of the support window in Nigeria.',
  },
] as const

const getFeaturedWithPrice = async (): Promise<PhoneCard[]> => {
  try {
    const [featuredPhones, catalogPhones] = await Promise.all([
      phonesApi.getFeatured(),
      phonesApi.getAll({ limit: 18 }),
    ])

    return curateShowcasePhones({
      featured: filterUserFacingPhones(featuredPhones),
      catalog: filterUserFacingPhones(catalogPhones),
      limit: 6,
    })
  } catch {
    return []
  }
}

const getLowestTrackedPrice = (phone: PhoneCard): number | null => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

export default async function UsedCheckerPage() {
  const phones = await getFeaturedWithPrice()
  const compareActionsBySlug = new Map(
    phones.map((phone) => [phone.slug, getPrimaryPhoneCardCompareAction(phone, phones)])
  )
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Used Phone Checker - Decide',
    description:
      "Use Decide's Nigeria-focused used phone checker to understand seller language, spot red flags, and open model-specific inspection guides before you pay.",
    url: absoluteUrl('/used/checker'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: phones.slice(0, 6).map((phone, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/used/${phone.slug}`),
        item: {
          '@type': 'Product',
          name: phone.name,
          brand: {
            '@type': 'Brand',
            name: phone.brand_name,
          },
          image: phone.image_url ?? undefined,
        },
      })),
    },
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <StructuredData data={structuredData} />
      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Used phone trust layer
            </p>
            <div className="space-y-2">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-primary md:text-4xl">
                Used phone checker for Nigeria
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">
                Use this page before you pay for any tokunbo or foreign-used phone. It helps you decode seller language, spot red flags, and move into model-specific inspection guides before you commit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/phones"
                className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Browse phones
              </Link>
              <Link
                href="/deals/under/200k"
                className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Open budget guides
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <CheckerStat label="Best for" value="Tokunbo and used offers" />
            <CheckerStat label="Main goal" value="Trust before payment" />
            <CheckerStat label="Next step" value="Open a model guide" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TRUST_PILLARS.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm"
          >
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {pillar.eyebrow}
              </p>
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight text-text-primary">
                  {pillar.title}
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {pillar.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Seller language decoder
              </p>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                What common labels should mean to you
              </h2>
            </div>

            <div className="space-y-2">
              {SELLER_TERMS.map((item) => (
                <div
                  key={item.term}
                  className="rounded-xl border border-border bg-surfaceHigh px-4 py-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-text-primary">{item.term}</p>
                      <TrustBadge tone={item.tone} />
                    </div>
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {item.verdict}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                5-step rule
              </p>
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                What you should always do before paying
              </h2>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
              <ChecklistItem
                step={1}
                text="Write down the IMEI and match it to the box, tray, or seller story before you talk yourself into the deal."
              />
              <ChecklistItem
                step={2}
                text="Ask the seller to boot or reset the phone in front of you. Reluctance is a signal, not a small inconvenience."
              />
              <ChecklistItem
                step={3}
                text="Test the expensive-risk parts: screen, cameras, ports, biometrics, charging, speakers, and battery behavior."
              />
              <ChecklistItem
                step={4}
                text="Ask directly which parts have been changed and whether the phone was used abroad, refurbished, or converted."
              />
              <ChecklistItem
                step={5}
                text="Only after the inspection should you compare the asking price against Decide's timing, worth-it, and budget context."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Model-specific guides
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Open a used guide for the exact phone you are considering
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
              The generic checker helps you think better. The model pages go further by adapting the inspection guide to the phone&apos;s OS, brand, and support reality in Nigeria.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {phones.map((phone) => (
            <article
              key={phone.slug}
              className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm"
            >
              <UsedGuideCard
                phone={phone}
                compareAction={compareActionsBySlug.get(phone.slug) ?? null}
              />
            </article>
          ))}
        </div>
      </section>

      <DecisionLoopPanel
        title="Keep the used check inside the full Decide flow"
        description="Authenticity and seller trust are only part of the answer. These next steps help you test timing, value, and alternatives before you spend."
        items={[
          {
            eyebrow: 'Budget lane',
            title: 'Open the budget routes first',
            description:
              'Budget pages help you understand whether the used offer is really saving enough compared with live tracked market options.',
            href: '/deals/under/200k',
            label: 'Open budget guides',
          },
          {
            eyebrow: 'Analyzer',
            title: 'Analyze a phone in isolation',
            description:
              'Use Analyze when you already have one specific device in mind and want a clearer yes, no, or maybe before you pay a seller.',
            href: '/analyze',
            label: 'Open Analyze',
          },
          {
            eyebrow: 'Compare',
            title: 'Pressure-test the used offer against alternatives',
            description:
              'Compare helps when a seller is pushing one phone but you suspect a nearby alternative may simply be the smarter buy.',
            href: '/compare',
            label: 'Compare phones',
          },
        ]}
      />
    </div>
  )
}

const UsedGuideCard = ({
  phone,
  compareAction,
}: {
  phone: PhoneCard
  compareAction: ReturnType<typeof getPrimaryPhoneCardCompareAction>
}) => (
  <div className="space-y-3">
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {phone.brand_name}
      </p>
      <h3 className="text-xl font-black tracking-tight text-text-primary">
        {phone.name}
      </h3>
    </div>

    <div className="flex flex-wrap gap-2">
      <Badge variant="default">{phone.gray_market_risk} risk</Badge>
      {phone.local_support_quality ? (
        <Badge variant="default">{phone.local_support_quality} support</Badge>
      ) : null}
    </div>

    <p className="text-sm leading-relaxed text-text-secondary">
      {getLowestTrackedPrice(phone) != null
        ? `Tracked from ${formatNaira(getLowestTrackedPrice(phone)!)} in the current market. Use the guide before you let price pressure rush the decision.`
        : 'Open the guide to pressure-test the model before you pay a seller.'}
    </p>

    <div className="flex flex-wrap gap-3">
      <Link
        href={`/used/${phone.slug}`}
        className="inline-flex items-center text-sm font-bold text-accent transition-colors duration-fast hover:text-accent-hover"
      >
        Open used guide
      </Link>
      <Link
        href={`/worth-it/${phone.slug}`}
        className="inline-flex items-center text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
      >
        Still worth it
      </Link>
      {compareAction ? (
        <Link
          href={compareAction.href}
          title={`Compare ${phone.name} with ${compareAction.counterpart.name}`}
          className="inline-flex items-center text-sm font-semibold text-text-secondary transition-colors duration-fast hover:text-text-primary"
        >
          Compare with closest match
        </Link>
      ) : null}
    </div>
  </div>
)

interface CheckerStatProps {
  label: string
  value: string
}

const CheckerStat = ({ label, value }: CheckerStatProps) => (
  <div className="rounded-2xl border border-accent/10 bg-white/80 px-3 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)

const ChecklistItem = ({ step, text }: { step: number; text: string }) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-surfaceHigh px-4 py-4">
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
      {step}
    </span>
    <p>{text}</p>
  </div>
)

const TrustBadge = ({ tone }: { tone: 'safe' | 'caution' | 'danger' }) => {
  const badgeClass = {
    safe: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    caution: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
  }[tone]

  const label = {
    safe: 'safer',
    caution: 'verify hard',
    danger: 'walk away',
  }[tone]

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${badgeClass}`}>
      {label}
    </span>
  )
}
