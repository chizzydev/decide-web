export const getStructuredDataSellerName = (store: string | null | undefined) => {
  const normalizedStore = store?.toLowerCase()

  if (normalizedStore === 'jumia') return 'Jumia Nigeria'
  if (normalizedStore === 'slot') return 'Slot Nigeria'

  return store ?? 'Retail partner'
}

export const buildProductStructuredDataDescription = (
  phoneName: string,
  context = 'tracked Nigerian prices, buying timing, ownership risk, and safer alternatives'
) => `${phoneName} buying context from Decide, covering ${context}.`

interface BuildOfferStructuredDataOptions {
  price: number
  url?: string | null
  inStock?: boolean
  sellerName?: string | null
}

export const buildOfferStructuredData = ({
  price,
  url,
  inStock = true,
  sellerName,
}: BuildOfferStructuredDataOptions) => ({
  '@type': 'Offer',
  price,
  priceCurrency: 'NGN',
  availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  seller: {
    '@type': 'Organization',
    name: sellerName ?? 'Retail partner',
  },
  url: url ?? undefined,
})
