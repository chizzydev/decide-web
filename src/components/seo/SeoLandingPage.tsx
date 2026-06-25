import Image from 'next/image'
import Link from 'next/link'
import { StructuredData } from '@/components/seo/StructuredData'
import { PriceChangeBadge } from '@/components/market/PriceChangeBadge'
import { Card } from '@/components/ui'
import { formatGb, formatMah, formatRelativeTime } from '@/lib/formatters'
import {
  getSeoLandingBestForLabels,
  type SeoLandingPageConfig,
} from '@/lib/seoLandingPages'
import type { SeoLandingPageData, SeoLandingPhoneResult } from '@/lib/seoLandingPageData'

const NAIRA = '\u20A6'

const formatSeoNaira = (amount: number) =>
  `${NAIRA}${amount.toLocaleString('en-NG')}`

const formatSeoNairaCompact = (amount: number) => {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000
    return `${NAIRA}${millions % 1 === 0 ? millions : millions.toFixed(1)}M`
  }

  if (amount >= 1000) {
    const thousands = amount / 1000
    return `${NAIRA}${thousands % 1 === 0 ? thousands : thousands.toFixed(1)}k`
  }

  return formatSeoNaira(amount)
}

interface SeoLandingPageProps {
  config: SeoLandingPageConfig
  data: SeoLandingPageData
  structuredData: Record<string, unknown>[]
}

const getPriceLabel = (item: SeoLandingPhoneResult) =>
  item.lowestPrice != null ? formatSeoNaira(item.lowestPrice) : 'Price watch'

const getStoreSummary = (item: SeoLandingPhoneResult) =>
  item.trackedStoreLabels.length > 0
    ? item.trackedStoreLabels.join(' + ')
    : item.phone.marketplace_signal_count
      ? 'Jiji context available'
      : 'Waiting for trusted price'

const getDetailHref = (item: SeoLandingPhoneResult) => `/phones/${item.phone.slug}`

const getBuyOrWaitHref = (item: SeoLandingPhoneResult) =>
  `/buy-now-or-wait/${item.phone.slug}`

const getPriceHistoryHref = (item: SeoLandingPhoneResult) =>
  `/phones/${item.phone.slug}/price-history`

export const SeoLandingPage = ({
  config,
  data,
  structuredData,
}: SeoLandingPageProps) => {
  const lead = data.phones[0] ?? null
  const updatedAt = data.updatedAt ?? data.marketGeneratedAt

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <StructuredData data={structuredData} />

      <nav className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/" className="transition-colors duration-fast hover:text-text-secondary">
          Decide
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-secondary">{config.h1}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface shadow-sm">
        <div className="grid gap-6 px-5 py-7 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              Nigeria's phone buying intelligence
            </p>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-5xl">
                {config.h1}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-text-secondary md:text-lg">
                {config.intro}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {config.searchVariants.slice(0, 5).map((variant) => (
                <span
                  key={variant}
                  className="rounded-full border border-accent/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-text-secondary"
                >
                  {variant}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/compare"
                className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
              >
                Compare phones
              </Link>
              <Link
                href="/deals/today"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
              >
                Check live drops
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <HeroStat
              label="Ranked phones"
              value={data.phones.length > 0 ? String(data.phones.length) : 'Watching'}
            />
            <HeroStat
              label="Latest price signal"
              value={updatedAt ? formatRelativeTime(updatedAt) : 'Waiting'}
            />
            <HeroStat
              label="Lead pick"
              value={lead ? lead.phone.name : 'Building shortlist'}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Why this page exists
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Built for the way people actually search
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {config.whyThisPageExists}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {config.pickingMethod.map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-white px-4 py-4">
                <p className="text-sm leading-relaxed text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.phones.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Ranked shortlist
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                Best current Decide picks for this search
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
                These are ranked with live price context, phone scores, and search-intent fit.
                Verify external store or marketplace details before paying.
              </p>
            </div>
            {updatedAt ? (
              <p className="text-xs font-semibold text-text-muted">
                Updated {formatRelativeTime(updatedAt)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.phones.slice(0, 10).map((item) => (
              <SeoPhoneRankCard key={item.phone.slug} config={config} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-16 text-center shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            Decide is still building this shortlist
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            There is not enough current trusted-store data for this page yet. Browse all phones or
            open today's live drops while Decide keeps watching the market.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/phones"
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-black text-white"
            >
              Browse phones
            </Link>
            <Link
              href="/deals/today"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary"
            >
              Open deals
            </Link>
          </div>
        </section>
      )}

      {data.phones.length > 0 ? <SeoComparisonTable items={data.phones.slice(0, 8)} /> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Decide method
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                Why these phones were picked
              </h2>
            </div>
            <div className="space-y-3">
              {config.pickingMethod.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-white px-4 py-4">
                  <p className="text-sm leading-relaxed text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-900">
              Decide does not sell phones directly. We help you decide what to buy, whether to buy
              now or wait, and where to verify the latest external price before you pay.
            </p>
          </div>
        </Card>

        <Card className="border-borderHigh bg-surface px-5 py-5 shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Related searches
              </p>
              <h2 className="text-2xl font-black tracking-tight text-text-primary">
                Keep narrowing the decision
              </h2>
            </div>
            <div className="space-y-2">
              {config.relatedLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="flex rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold text-text-primary transition-colors duration-fast hover:border-borderHigh hover:bg-surfaceHigh"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-borderHigh bg-surface px-5 py-5 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              FAQ
            </p>
            <h2 className="text-2xl font-black tracking-tight text-text-primary">
              Questions buyers ask before paying
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {config.faq.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-border bg-white px-4 py-4">
                <h3 className="text-base font-black text-text-primary">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const HeroStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-white/80 px-4 py-4">
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-2 text-lg font-black tracking-tight text-text-primary">{value}</p>
  </div>
)

const SeoPhoneRankCard = ({
  config,
  item,
}: {
  config: SeoLandingPageConfig
  item: SeoLandingPhoneResult
}) => {
  const labels = getSeoLandingBestForLabels(config, item.phone)

  return (
    <article className="overflow-hidden rounded-2xl border border-borderHigh bg-surface shadow-sm">
      <div className="grid gap-0 sm:grid-cols-[160px_1fr]">
        <Link
          href={getDetailHref(item)}
          className="relative flex min-h-44 items-center justify-center border-b border-border bg-surfaceHigh p-5 sm:border-b-0 sm:border-r"
        >
          {item.phone.image_url && !item.phone.image_url.includes('placeholder') ? (
            <Image
              src={item.phone.image_url}
              alt={item.phone.name}
              width={132}
              height={132}
              className="max-h-32 object-contain"
            />
          ) : (
            <div className="text-sm font-semibold text-text-muted">No image</div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-text-primary px-2.5 py-1 text-xs font-black text-white">
            #{item.rank}
          </span>
        </Link>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                  {item.phone.brand_name}
                </p>
                <Link
                  href={getDetailHref(item)}
                  className="text-xl font-black tracking-tight text-text-primary transition-colors duration-fast hover:text-accent"
                >
                  {item.phone.name}
                </Link>
              </div>
              <div className="text-right">
                <p className="text-xl font-black tracking-tight text-text-primary">
                  {getPriceLabel(item)}
                </p>
                <p className="text-xs text-text-muted">{getStoreSummary(item)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-accent/15 bg-tealTint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {item.deal ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <PriceChangeBadge
                amount_ngn={item.deal.change_amount_ngn}
                percent={item.deal.change_percent}
                compact
              />
              <p className="text-xs font-semibold text-emerald-800">
                Current tracked drop on {item.deal.store === 'jumia' ? 'Jumia' : 'Slot'}.
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-white px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Buy-or-wait read
            </p>
            <p className="mt-1 text-sm font-black text-text-primary">{item.verdict.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {item.verdict.summary}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SignalList title="Pros" items={item.pros} />
            <SignalList title="Watch-outs" items={item.cons} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={getDetailHref(item)}
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-black text-white transition-colors duration-fast hover:bg-accent-hover"
            >
              View phone
            </Link>
            <Link
              href={getBuyOrWaitHref(item)}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Buy or wait
            </Link>
            <Link
              href={getPriceHistoryHref(item)}
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
            >
              Price history
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

const SignalList = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-2xl border border-border bg-white px-4 py-4">
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
      {title}
    </p>
    <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-text-secondary">
      {items.map((item) => (
        <li key={item}>- {item}</li>
      ))}
    </ul>
  </div>
)

const SeoComparisonTable = ({ items }: { items: SeoLandingPhoneResult[] }) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
        Comparison table
      </p>
      <h2 className="text-2xl font-black tracking-tight text-text-primary">
        Compare the shortlist quickly
      </h2>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-borderHigh bg-surface shadow-sm">
      <table className="min-w-[820px] w-full text-left text-sm">
        <thead className="bg-surfaceHigh text-xs uppercase tracking-[0.14em] text-text-muted">
          <tr>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Best current</th>
            <th className="px-4 py-3">Stores</th>
            <th className="px-4 py-3">Battery</th>
            <th className="px-4 py-3">Camera</th>
            <th className="px-4 py-3">RAM / Storage</th>
            <th className="px-4 py-3">Verdict</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.phone.slug} className="align-top">
              <td className="px-4 py-4">
                <Link
                  href={getDetailHref(item)}
                  className="font-bold text-text-primary transition-colors duration-fast hover:text-accent"
                >
                  {item.phone.name}
                </Link>
                <p className="mt-1 text-xs text-text-muted">{item.phone.brand_name}</p>
              </td>
              <td className="px-4 py-4 font-bold text-text-primary">
                {item.lowestPrice != null ? formatSeoNairaCompact(item.lowestPrice) : 'Watching'}
              </td>
              <td className="px-4 py-4 text-text-secondary">{getStoreSummary(item)}</td>
              <td className="px-4 py-4 text-text-secondary">
                {formatMah(item.phone.battery_mah)}
              </td>
              <td className="px-4 py-4 text-text-secondary">
                {item.phone.main_camera_mp ? `${item.phone.main_camera_mp}MP` : 'Unknown'}
              </td>
              <td className="px-4 py-4 text-text-secondary">
                {formatGb(item.phone.ram_gb)} / {formatGb(item.phone.storage_gb)}
              </td>
              <td className="px-4 py-4 text-text-secondary">{item.verdict.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)
