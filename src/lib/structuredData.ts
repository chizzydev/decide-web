export const merchantReturnPolicyStructuredData = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'NG',
  returnPolicyCategory: 'https://schema.org/MerchantReturnUnspecified',
}

export const getStructuredDataSellerName = (store: string | null | undefined) => {
  const normalizedStore = store?.toLowerCase()

  if (normalizedStore === 'jumia') return 'Jumia Nigeria'
  if (normalizedStore === 'slot') return 'Slot Nigeria'

  return store ?? 'Retail partner'
}

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
  hasMerchantReturnPolicy: merchantReturnPolicyStructuredData,
})
