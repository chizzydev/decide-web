import type { StoreType } from './phone'

export interface CatalogVerdictSignal {
  label: string
  summary: string
  tone: 'positive' | 'neutral' | 'warning'
  href: string
  link_label: string
}

export interface CatalogPriceDropSignal {
  amount_ngn: number
  percent: number | null
  store: StoreType
  href: string
}

export interface CatalogDiscoverySignal {
  verdict: CatalogVerdictSignal
  price_drop?: CatalogPriceDropSignal
}
