import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { formatNaira, formatNairaCompact, formatRelativeTime } from '@/lib/formatters'
import type { PhonePriceHistoryResponse, StorePriceHistorySeries } from '@/types'
import { PriceChangeBadge } from './PriceChangeBadge'

const STORE_META = {
  jumia: {
    label: 'Jumia',
    stroke: '#0F9D8A',
    dot: 'bg-accent',
  },
  slot: {
    label: 'Slot',
    stroke: '#111827',
    dot: 'bg-text-primary',
  },
} as const

interface PriceHistoryChartProps {
  history: PhonePriceHistoryResponse
  detailPath: string
}

interface ChartPoint {
  x: number
  y: number
}

const getChartPoints = (
  series: StorePriceHistorySeries,
  width: number,
  height: number,
  padding: number,
  minPrice: number,
  maxPrice: number,
  minTime: number,
  maxTime: number
): ChartPoint[] => {
  const priceRange = Math.max(maxPrice - minPrice, 1)
  const timeRange = Math.max(maxTime - minTime, 1)

  return series.points.map((point) => {
    const timestamp = new Date(point.scraped_at).getTime()
    const x =
      padding + ((timestamp - minTime) / timeRange) * (width - padding * 2)
    const y =
      height -
      padding -
      ((point.price_ngn - minPrice) / priceRange) * (height - padding * 2)

    return { x, y }
  })
}

export const PriceHistoryChart = ({ history, detailPath }: PriceHistoryChartProps) => {
  const populatedSeries = history.series.filter((series) => series.points.length > 0)

  if (populatedSeries.length === 0) {
    return null
  }

  const width = 680
  const height = 240
  const padding = 24
  const allPoints = populatedSeries.flatMap((series) => series.points)
  const prices = allPoints.map((point) => point.price_ngn)
  const times = allPoints.map((point) => new Date(point.scraped_at).getTime())
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const currentBestPrice = history.summary.lowest_current_price_ngn
  const freshest = history.summary.freshest_scraped_at

  return (
    <div id="price-history">
      <Card className="overflow-hidden border-borderHigh bg-surface shadow-sm">
        <div className="border-b border-border bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Price intelligence
            </p>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-text-primary">
                Price history for the last {history.days} days
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
                This chart shows how tracked prices moved across Nigeria-facing stores, so buyers can see whether this is a steady price or a fresh drop.
              </p>
            </div>
            {history.available_variants.length > 0 ? (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Tracking variant
                </p>
                <div className="flex flex-wrap gap-2">
                  {history.available_variants.map((variant) => {
                    const isActive = variant.id === history.selected_variant_id

                    return (
                      <Link
                        key={variant.id}
                        href={`${detailPath}?variant_id=${variant.id}#price-history`}
                        className={[
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-fast',
                          isActive
                            ? 'border-accent bg-accent text-white'
                            : 'border-border bg-white text-text-secondary hover:border-borderHigh hover:text-text-primary',
                        ].join(' ')}
                      >
                        <span>{variant.label}</span>
                        {variant.is_default ? (
                          <span
                            className={[
                              'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-accent-subtle text-teal-700',
                            ].join(' ')}
                          >
                            Default
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatChip
              label="Best current"
              value={currentBestPrice ? formatNairaCompact(currentBestPrice) : 'N/A'}
            />
            <StatChip
              label="Tracked stores"
              value={String(history.summary.tracked_store_count)}
            />
            <StatChip
              label="Freshest update"
              value={freshest ? formatRelativeTime(freshest) : 'Waiting'}
            />
          </div>
        </div>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
        <div className="overflow-x-auto">
          <div className="min-w-[620px] rounded-xl border border-border bg-surfaceHigh/70 p-4">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-[220px] w-full"
              role="img"
              aria-label={`Price history for ${history.phone_name}${history.selected_variant_label ? ` (${history.selected_variant_label})` : ''}`}
            >
              {[0, 1, 2, 3].map((index) => {
                const y = padding + ((height - padding * 2) / 3) * index
                return (
                  <line
                    key={index}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="4 6"
                  />
                )
              })}

              {populatedSeries.map((series) => {
                const pathPoints = getChartPoints(
                  series,
                  width,
                  height,
                  padding,
                  minPrice,
                  maxPrice,
                  minTime,
                  maxTime
                )
                const polylinePoints = pathPoints
                  .map((point) => `${point.x},${point.y}`)
                  .join(' ')

                return (
                  <g key={series.store}>
                    <polyline
                      fill="none"
                      stroke={STORE_META[series.store].stroke}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={polylinePoints}
                    />
                    {pathPoints.map((point, index) => (
                      <circle
                        key={`${series.store}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="3.5"
                        fill={STORE_META[series.store].stroke}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {populatedSeries.map((series) => {
            const meta = STORE_META[series.store]

            return (
              <div
                key={series.store}
                className="rounded-xl border border-border bg-surfaceHigh px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={['h-2.5 w-2.5 rounded-full', meta.dot].join(' ')} />
                      <p className="text-sm font-bold text-text-primary">
                        {meta.label}
                      </p>
                    </div>
                    <p className="text-2xl font-black tracking-tight text-text-primary">
                      {series.current_price_ngn
                        ? formatNaira(series.current_price_ngn)
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {series.freshest_scraped_at
                        ? `Updated ${formatRelativeTime(series.freshest_scraped_at)}`
                        : 'Still gathering history'}
                    </p>
                  </div>
                  <PriceChangeBadge
                    amount_ngn={series.change_amount_ngn}
                    percent={series.change_percent}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            Use this trend together with the live price alert above if you want Decide to notify you when a better tracked price appears.
          </p>
          <Link
            href="/deals"
            className="font-semibold text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            See more live drops
          </Link>
        </div>
        </div>
      </Card>
    </div>
  )
}

interface StatChipProps {
  label: string
  value: string
}

const StatChip = ({ label, value }: StatChipProps) => (
  <div className="rounded-xl border border-accent/10 bg-white/80 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
  </div>
)
