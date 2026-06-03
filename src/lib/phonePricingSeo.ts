import type { Metadata } from 'next'
import type {
  BuyNowWaitResponse,
  PhoneDetail,
  PhonePriceHistoryResponse,
  StillWorthItResponse,
} from '@/types'
import { editorialApi, marketApi, phonesApi } from '@/lib/api'
import { buildPageMetadata } from '@/lib/seo'
import {
  buildBuyNowWaitHref,
  buildPhoneCheapestPriceHref,
  buildPhoneDetailHref,
  buildPhonePriceDropHref,
  buildPhonePriceHistoryHref,
  buildPhonePriceTodayHref,
  buildPhoneStorePriceHref,
  buildWorthItHref,
} from '@/lib/variantHref'

export type PhonePricingIntentKey =
  | 'price-history'
  | 'cheapest-price'
  | 'price-in-nigeria-today'
  | 'price-drop'
  | 'price-in-jumia'
  | 'price-in-slot'

export interface PhonePricingIntentLink {
  key: PhonePricingIntentKey
  href: string
  label: string
  title: string
  description: string
}

type SupportedStore = 'jumia' | 'slot'

export interface PhonePricingSeoBundle {
  phone: PhoneDetail
  priceHistory: PhonePriceHistoryResponse | null
  buyNowWait: BuyNowWaitResponse | null
  stillWorthIt: StillWorthItResponse | null
  selectedVariantId: number | null
  selectedVariantLabel: string | null
  currentPrices: PhoneDetail['prices']
  cheapestPrice: PhoneDetail['prices'][number] | null
  highestCurrentPrice: PhoneDetail['prices'][number] | null
  priceSpreadNgn: number | null
  strongestDrop:
    | (PhonePriceHistoryResponse['series'][number] & {
        label: 'jumia' | 'slot'
      })
    | null
  intentLinks: PhonePricingIntentLink[]
}

const STORE_LABELS: Record<SupportedStore, string> = {
  jumia: 'Jumia',
  slot: 'Slot',
}

export const getStoreLabel = (store: SupportedStore) => STORE_LABELS[store]

const isStorePriceRow = (price: PhoneDetail['prices'][number]) =>
  price.in_stock && price.price_ngn > 0

export const buildPhonePricingIntentLinks = (
  slug: string,
  variantId: number | null
): PhonePricingIntentLink[] => [
  {
    key: 'price-history',
    href: buildPhonePriceHistoryHref(slug, { variantId }),
    label: 'Price history',
    title: 'Price history in Nigeria',
    description:
      'Track current, low, high, and recent movement across trusted stores.',
  },
  {
    key: 'cheapest-price',
    href: buildPhoneCheapestPriceHref(slug, { variantId }),
    label: 'Cheapest price',
    title: 'Cheapest tracked price',
    description:
      'See which trusted store is currently cheapest and how wide the spread is.',
  },
  {
    key: 'price-in-nigeria-today',
    href: buildPhonePriceTodayHref(slug, { variantId }),
    label: 'Price today',
    title: 'Price in Nigeria today',
    description:
      'Get the latest tracked Nigeria price snapshot, freshness, and buy-now context.',
  },
  {
    key: 'price-drop',
    href: buildPhonePriceDropHref(slug, { variantId }),
    label: 'Price drop',
    title: 'Has the price dropped?',
    description:
      'Check whether either trusted store has cut the price recently and by how much.',
  },
  {
    key: 'price-in-jumia',
    href: buildPhoneStorePriceHref(slug, 'jumia', { variantId }),
    label: 'Price in Jumia',
    title: 'Jumia price',
    description:
      'Read the Jumia-specific tracked price, update freshness, and context versus the market.',
  },
  {
    key: 'price-in-slot',
    href: buildPhoneStorePriceHref(slug, 'slot', { variantId }),
    label: 'Price in Slot',
    title: 'Slot price',
    description:
      'Read the Slot-specific tracked price, update freshness, and context versus the market.',
  },
]

const getRequestedVariantPrices = (
  phone: PhoneDetail,
  requestedVariantId: number | null
) => {
  if (!requestedVariantId || !phone.variants?.length) {
    return {
      selectedVariantId: null,
      selectedVariantLabel: null,
      currentPrices: phone.prices,
    }
  }

  const selectedVariant =
    phone.variants.find((variant) => variant.id === requestedVariantId) ?? null

  if (!selectedVariant) {
    return {
      selectedVariantId: null,
      selectedVariantLabel: null,
      currentPrices: phone.prices,
    }
  }

  return {
    selectedVariantId: selectedVariant.id,
    selectedVariantLabel: selectedVariant.label,
    currentPrices:
      selectedVariant.prices.length > 0 ? selectedVariant.prices : phone.prices,
  }
}

const sortPricesAsc = (prices: PhoneDetail['prices']) =>
  [...prices].sort((left, right) => left.price_ngn - right.price_ngn)

export const getPhonePricingSeoBundle = async (
  slug: string,
  options: {
    variantId?: number | null
    store?: SupportedStore
  } = {}
): Promise<PhonePricingSeoBundle> => {
  const phone = await phonesApi.getBySlug(slug)
  const variantState = getRequestedVariantPrices(phone, options.variantId ?? null)

  const [priceHistory, buyNowWait, stillWorthIt] = await Promise.all([
    marketApi
      .getPhonePriceHistory(slug, {
        variant_id: variantState.selectedVariantId ?? undefined,
        store: options.store,
      })
      .catch(() => null),
    editorialApi.getBuyNowWait(slug).catch(() => null),
    editorialApi.getStillWorthIt(slug).catch(() => null),
  ])

  const validCurrentPrices = sortPricesAsc(
    variantState.currentPrices.filter((price) => {
      if (!isStorePriceRow(price)) return false
      if (options.store) return price.store === options.store
      return true
    })
  )

  const cheapestPrice = validCurrentPrices[0] ?? null
  const highestCurrentPrice =
    validCurrentPrices.length > 0 ? validCurrentPrices[validCurrentPrices.length - 1] : null
  const priceSpreadNgn =
    cheapestPrice && highestCurrentPrice
      ? highestCurrentPrice.price_ngn - cheapestPrice.price_ngn
      : null

  const strongestDrop =
    priceHistory?.series
      .filter((series) => (series.change_amount_ngn ?? 0) > 0)
      .sort(
        (left, right) =>
          (right.change_amount_ngn ?? 0) - (left.change_amount_ngn ?? 0)
      )[0] ?? null

  return {
    phone,
    priceHistory,
    buyNowWait,
    stillWorthIt,
    selectedVariantId: variantState.selectedVariantId,
    selectedVariantLabel: variantState.selectedVariantLabel,
    currentPrices: validCurrentPrices,
    cheapestPrice,
    highestCurrentPrice,
    priceSpreadNgn,
    strongestDrop: strongestDrop
      ? {
          ...strongestDrop,
          label: strongestDrop.store,
        }
      : null,
    intentLinks: buildPhonePricingIntentLinks(slug, variantState.selectedVariantId),
  }
}

export const getIntentLink = (
  links: PhonePricingIntentLink[],
  key: PhonePricingIntentKey
) => links.find((link) => link.key === key) ?? null

const getStoreTitleFragment = (store: SupportedStore) =>
  `${getStoreLabel(store)} Nigeria`

export const buildPhonePricingIntentMetadata = (
  intent: PhonePricingIntentKey,
  bundle: PhonePricingSeoBundle
): Metadata => {
  const phoneName = bundle.phone.name
  const slug = bundle.phone.slug

  const pageMap: Record<PhonePricingIntentKey, Metadata> = {
    'price-history': buildPageMetadata({
      title: `${phoneName} Price History in Nigeria - Decide`,
      description: `Track ${phoneName} price history in Nigeria across trusted stores. See the current price, price chart, recent movement, and tracked store coverage before you buy.`,
      path: buildPhonePriceHistoryHref(slug, { variantId: bundle.selectedVariantId }),
      keywords: [
        `${phoneName} price history in Nigeria`,
        `${phoneName} price trend`,
        `${phoneName} price chart Nigeria`,
      ],
      type: 'article',
    }),
    'cheapest-price': buildPageMetadata({
      title: `${phoneName} Cheapest Price in Nigeria - Decide`,
      description: `Find the cheapest tracked ${phoneName} price in Nigeria today, compare trusted stores, and see whether the current offer looks worth acting on.`,
      path: buildPhoneCheapestPriceHref(slug, { variantId: bundle.selectedVariantId }),
      keywords: [
        `${phoneName} cheapest price in Nigeria`,
        `${phoneName} best price Nigeria`,
        `${phoneName} lowest price Nigeria`,
      ],
      type: 'article',
    }),
    'price-in-nigeria-today': buildPageMetadata({
      title: `${phoneName} Price in Nigeria Today - Decide`,
      description: `See the latest tracked ${phoneName} price in Nigeria today, which trusted store is cheaper, and how fresh the current market snapshot is.`,
      path: buildPhonePriceTodayHref(slug, { variantId: bundle.selectedVariantId }),
      keywords: [
        `${phoneName} price in Nigeria today`,
        `${phoneName} latest price in Nigeria`,
        `${phoneName} current price Nigeria`,
      ],
      type: 'article',
    }),
    'price-drop': buildPageMetadata({
      title: `Has ${phoneName} Price Dropped in Nigeria? - Decide`,
      description: `Check whether ${phoneName} price has dropped in Nigeria, how much it moved, and which trusted store recorded the latest tracked cut.`,
      path: buildPhonePriceDropHref(slug, { variantId: bundle.selectedVariantId }),
      keywords: [
        `${phoneName} price dropped`,
        `${phoneName} price drop in Nigeria`,
        `${phoneName} should I wait price`,
      ],
      type: 'article',
    }),
    'price-in-jumia': buildPageMetadata({
      title: `${phoneName} Price in ${getStoreTitleFragment('jumia')} - Decide`,
      description: `See the tracked ${phoneName} price on Jumia Nigeria, compare it against the wider market, and check how fresh the listing is before you buy.`,
      path: buildPhoneStorePriceHref(slug, 'jumia', {
        variantId: bundle.selectedVariantId,
      }),
      keywords: [
        `${phoneName} price in Jumia`,
        `${phoneName} Jumia Nigeria price`,
        `${phoneName} Jumia price today`,
      ],
      type: 'article',
    }),
    'price-in-slot': buildPageMetadata({
      title: `${phoneName} Price in ${getStoreTitleFragment('slot')} - Decide`,
      description: `See the tracked ${phoneName} price at Slot Nigeria, compare it against the wider market, and check how fresh the listing is before you buy.`,
      path: buildPhoneStorePriceHref(slug, 'slot', {
        variantId: bundle.selectedVariantId,
      }),
      keywords: [
        `${phoneName} price in Slot`,
        `${phoneName} Slot Nigeria price`,
        `${phoneName} Slot price today`,
      ],
      type: 'article',
    }),
  }

  return pageMap[intent]
}

export const getPriceIntentBacklinks = (
  bundle: PhonePricingSeoBundle
): Array<{ href: string; label: string }> => [
  {
    href: buildPhoneDetailHref(bundle.phone.slug, {
      variantId: bundle.selectedVariantId,
      anchor: 'price-history',
    }),
    label: 'Open phone detail',
  },
  ...(bundle.buyNowWait
    ? [
        {
          href: buildBuyNowWaitHref(bundle.phone.slug, {
            variantId: bundle.selectedVariantId,
          }),
          label: 'Read buy or wait',
        },
      ]
    : []),
  ...(bundle.stillWorthIt
    ? [
        {
          href: buildWorthItHref(bundle.phone.slug, {
            variantId: bundle.selectedVariantId,
          }),
          label: 'Check still worth it',
        },
      ]
    : []),
]
