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

export interface BreadcrumbStructuredDataItem {
  name: string
  url: string
}

export const buildBreadcrumbStructuredData = (
  items: BreadcrumbStructuredDataItem[]
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export interface ItemListStructuredDataItem {
  name: string
  url: string
  image?: string | null
  description?: string
  brandName?: string | null
}

export const buildItemListStructuredData = ({
  name,
  description,
  url,
  items,
}: {
  name: string
  description: string
  url: string
  items: ItemListStructuredDataItem[]
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  description,
  url,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.url,
    item: {
      '@type': 'Thing',
      name: item.name,
      url: item.url,
      image: item.image ?? undefined,
      description: item.description,
      brand: item.brandName
        ? {
            '@type': 'Brand',
            name: item.brandName,
          }
        : undefined,
    },
  })),
})

export const buildFaqStructuredData = (
  faqs: Array<{ question: string; answer: string }>
) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
})

export const buildWebPageStructuredData = ({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name,
  description,
  url,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Decide',
    url: 'https://www.decide.com.ng',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Decide',
    url: 'https://www.decide.com.ng',
  },
})
