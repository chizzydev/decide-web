import type { PhoneCard } from '@/types'

const getLowestTrackedPrice = (phone: PhoneCard): number | null => {
  const prices = phone.prices
    .filter((price) => price.price_ngn > 0)
    .map((price) => price.price_ngn)

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const getBrandKey = (phone: PhoneCard) => phone.brand_name.trim().toLowerCase()

const rankPhone = (phone: PhoneCard) => {
  const lowestPrice = getLowestTrackedPrice(phone)

  return (
    (phone.is_featured ? 10_000 : 0) +
    (lowestPrice != null ? 1_000 : 0) +
    phone.score_value * 10 +
    Math.min(phone.review_count, 200) +
    (phone.has_5g ? 15 : 0)
  )
}

const dedupePhones = (phones: PhoneCard[]) => {
  const seen = new Set<string>()

  return phones.filter((phone) => {
    if (seen.has(phone.slug)) {
      return false
    }

    seen.add(phone.slug)
    return true
  })
}

export const curateShowcasePhones = ({
  featured,
  catalog,
  limit = 6,
}: {
  featured: PhoneCard[]
  catalog: PhoneCard[]
  limit?: number
}) => {
  const merged = dedupePhones(
    [...featured, ...catalog].sort((left, right) => rankPhone(right) - rankPhone(left))
  )

  const curated: PhoneCard[] = []
  const usedBrands = new Set<string>()

  for (const phone of merged) {
    const brandKey = getBrandKey(phone)

    if (usedBrands.has(brandKey)) {
      continue
    }

    curated.push(phone)
    usedBrands.add(brandKey)

    if (curated.length >= limit) {
      return curated
    }
  }

  for (const phone of merged) {
    if (curated.some((candidate) => candidate.slug === phone.slug)) {
      continue
    }

    curated.push(phone)

    if (curated.length >= limit) {
      break
    }
  }

  return curated
}
