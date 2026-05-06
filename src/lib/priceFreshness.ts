export type PriceFreshnessStatus = 'fresh' | 'aging' | 'stale'

export const TRACKED_PRICE_AGING_HOURS = 24
export const TRACKED_PRICE_STALE_HOURS = 72

const getHoursSince = (isoString: string): number => {
  const parsed = new Date(isoString).getTime()

  if (Number.isNaN(parsed)) {
    return Number.POSITIVE_INFINITY
  }

  return (Date.now() - parsed) / (1000 * 60 * 60)
}

export const getPriceFreshnessStatus = (
  isoString: string
): PriceFreshnessStatus => {
  const hoursSince = getHoursSince(isoString)

  if (hoursSince >= TRACKED_PRICE_STALE_HOURS) {
    return 'stale'
  }

  if (hoursSince >= TRACKED_PRICE_AGING_HOURS) {
    return 'aging'
  }

  return 'fresh'
}

export const getPriceFreshnessLabel = (status: PriceFreshnessStatus) => {
  if (status === 'fresh') return 'Fresh'
  if (status === 'aging') return 'Aging'
  return 'Stale'
}

export const getPriceFreshnessSummary = (
  status: PriceFreshnessStatus
): string => {
  if (status === 'fresh') {
    return 'Latest tracked store check is still fresh enough to use with confidence.'
  }

  if (status === 'aging') {
    return 'Latest tracked store check is getting older, so confirm before acting on a tight price difference.'
  }

  return 'Latest tracked store check is stale, so treat these prices as context and recheck the retailer before buying.'
}

