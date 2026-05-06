'use client'

// decide-web/src/app/admin/phones/page.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { requestAdminJson } from '@/lib/adminApi'

interface PhoneSearchAlias {
  alias: string
  usage: 'all' | 'price' | 'image'
}

interface AdminPhone {
  id:          number
  name:        string
  slug:        string
  brand_name:  string
  is_featured: boolean
  showcase_priority: number
  exclude_from_price_attention: boolean
  price_attention_note: string | null
  manual_image_url: string | null
  manual_image_note: string | null
  search_aliases: PhoneSearchAlias[]
  is_active:   boolean
}

interface PhoneMergeResult {
  source_phone: {
    id: number
    name: string
    slug: string
  }
  target_phone: {
    id: number
    name: string
    slug: string
  }
  copied_fields: string[]
  moved: {
    variants_created: number
    aliases_added: number
    tags_added: number
    saved_phones_moved: number
    saved_phones_duplicates: number
    reviews_moved: number
    reviews_removed: number
    prices_moved: number
    prices_merged: number
    alerts_moved: number
    alerts_deactivated: number
  }
}

interface NoImagePhone {
  id:           number
  name:         string
  slug:         string
  image_url:    string | null
  image_status: string | null
}

type ImageHealthStatus =
  | 'resolved_local'
  | 'resolved_external'
  | 'missing_local_file'
  | 'fallback'
  | 'missing'

interface ImageAuditPhone {
  id: number
  name: string
  slug: string
  image_url: string | null
  manual_image_url: string | null
  manual_image_note: string | null
  image_status: 'resolved' | 'fallback' | null
  image_source: 'jumia' | 'slot' | 'manual' | 'fallback' | null
  image_source_url: string | null
  health_status: ImageHealthStatus
  local_file_exists: boolean | null
  manual_override: boolean
  current_price_source_stores: Array<'jumia' | 'slot'>
  repopulate_strategy: 'trusted_store_urls' | 'search_discovery_only'
}

interface ImageAuditSummary {
  total_active: number
  resolved_local: number
  resolved_external: number
  missing_local_file: number
  fallback: number
  missing: number
  manual_overrides: number
}

interface CatalogHealthSummary {
  active_phones: number
  featured_phones: number
  unranked_featured_phones: number
  price_tracking_scope_phones: number
  price_attention_excluded_phones: number
  phones_with_current_prices: number
  phones_missing_current_prices: number
  stale_current_price_phones: number
  phones_with_variant_rows: number
  phones_missing_variant_rows: number
  phones_with_unbound_current_prices: number
  phones_with_legacy_prices: number
  canonical_slug_mismatch_phones: number
  phones_outside_canonical_seed: number
  duplicate_active_phone_rows: number
  canonical_seed_missing_live_phones: number
  seed_authority_drift_phones: number
  localized_images: number
  remote_only_images: number
  image_attention: number
  stale_threshold_hours: number
}

interface CatalogHealthIssuePhone {
  id: number
  name: string
  slug: string
  brand_name: string
  detail: string
  suggested_target_id?: number | null
  suggested_target_slug?: string | null
}

interface CatalogSeedMissingLivePhone {
  seed_slug: string
  brand_slug: string
  brand_name: string
  name: string
  detail: string
  restore_strategy: 'reactivate_existing' | 'insert_new'
  existing_phone_id: number | null
  existing_phone_slug: string | null
}

type CatalogHealthOperatorLane = 'pricing' | 'images' | 'showcase' | 'catalog'
type OperatorLaneFilter = 'all' | CatalogHealthOperatorLane
type CatalogHealthOperatorRecommendation =
  | 'exclude_price_attention'
  | 'review_price_attention'
  | 'delete_legacy_prices'
  | 'merge_duplicate_phone'
  | 'repair_canonical_slug'
  | 'resync_seed_authority'
  | 'backfill_variant_rows'
  | 'repair_unbound_current_prices'
  | 'deactivate_noncanonical_phone'
  | 'upload_manual_image'
  | 'repair_missing_local_image'
  | 'localize_image'
  | 'fix_showcase_priority'

interface CatalogHealthOperatorDecision {
  id: number
  name: string
  slug: string
  brand_name: string
  lane: CatalogHealthOperatorLane
  recommendation: CatalogHealthOperatorRecommendation
  detail: string
  priority: number
  additional_issue_count?: number
  additional_lanes?: CatalogHealthOperatorLane[]
  suggested_target_id?: number | null
  suggested_target_slug?: string | null
}

interface CatalogHealthData {
  summary: CatalogHealthSummary
  spotlight: {
    unranked_featured: CatalogHealthIssuePhone[]
    missing_prices: CatalogHealthIssuePhone[]
    stale_prices: CatalogHealthIssuePhone[]
    legacy_prices: CatalogHealthIssuePhone[]
    duplicate_active_phones: CatalogHealthIssuePhone[]
    canonical_seed_missing_live: CatalogSeedMissingLivePhone[]
    canonical_slug_mismatch: CatalogHealthIssuePhone[]
    seed_authority_drift: CatalogHealthIssuePhone[]
    noncanonical_active: CatalogHealthIssuePhone[]
    missing_variants: CatalogHealthIssuePhone[]
    unbound_current_prices: CatalogHealthIssuePhone[]
    image_attention: CatalogHealthIssuePhone[]
  }
  operator_queue: CatalogHealthOperatorDecision[]
}

interface CatalogRemediationItem {
  id: number
  name: string
  slug: string
  status: 'updated' | 'skipped' | 'failed'
  detail: string
}

interface CatalogRemediationResult {
  action:
    | 'normalize_showcase'
    | 'restore_missing_canonical_seed_phones'
    | 'repair_canonical_slugs'
    | 'backfill_variants'
    | 'repair_unbound_current_prices'
    | 'resync_seed_authority'
    | 'repair_missing_local_images'
    | 'localize_remote_images'
    | 'refresh_price_attention'
    | 'delete_legacy_prices'
    | 'repopulate_fallback_images'
  processed: number
  updated: number
  skipped: number
  failed: number
  items: CatalogRemediationItem[]
  message: string
}

type QualityMessageType = 'success' | 'warning' | 'error'
type OperatorMessageType = 'success' | 'error'
type CatalogueEditorFocus = 'default' | 'manual-image-upload'
type QualityMovementKey =
  | 'priceAttention'
  | 'legacyPrices'
  | 'duplicateModels'
  | 'canonicalSeedMissingLive'
  | 'canonicalSlugMismatches'
  | 'seedAuthorityDrift'
  | 'outsideCanonicalSeed'
  | 'missingVariants'
  | 'unboundCurrentOffers'
  | 'imageAttention'
  | 'unrankedFeatured'
  | 'operatorQueue'

interface QualitySnapshot {
  priceAttention: number
  legacyPrices: number
  duplicateModels: number
  canonicalSeedMissingLive: number
  canonicalSlugMismatches: number
  seedAuthorityDrift: number
  outsideCanonicalSeed: number
  missingVariants: number
  unboundCurrentOffers: number
  imageAttention: number
  unrankedFeatured: number
  operatorQueue: number
}

interface Brand {
  id:      number
  name:    string
  slug:    string
  os_type: string
}

type Tab = 'quality' | 'catalogue' | 'add' | 'tags' | 'images'
type CatalogueFilter = 'all' | 'price-exceptions' | 'manual-overrides' | 'featured'

const sortAdminPhones = (phones: AdminPhone[]) =>
  [...phones].sort((left, right) => {
    if (left.is_active !== right.is_active) {
      return Number(right.is_active) - Number(left.is_active)
    }

    if (left.is_featured !== right.is_featured) {
      return Number(right.is_featured) - Number(left.is_featured)
    }

    if (left.showcase_priority !== right.showcase_priority) {
      return right.showcase_priority - left.showcase_priority
    }

    return left.name.localeCompare(right.name)
  })

const normalizeDuplicatePhoneKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\[merged\]/g, ' ')
    .replace(/-merged-\d+\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const summarizePhoneMerge = (result: PhoneMergeResult) => {
  const summaryParts: string[] = []

  if (result.moved.prices_moved > 0) summaryParts.push(`${result.moved.prices_moved} price row${result.moved.prices_moved === 1 ? '' : 's'}`)
  if (result.moved.prices_merged > 0) summaryParts.push(`${result.moved.prices_merged} overlapping price merge${result.moved.prices_merged === 1 ? '' : 's'}`)
  if (result.moved.aliases_added > 0) summaryParts.push(`${result.moved.aliases_added} scraper alias${result.moved.aliases_added === 1 ? '' : 'es'}`)
  if (result.moved.saved_phones_moved > 0) summaryParts.push(`${result.moved.saved_phones_moved} saved phone${result.moved.saved_phones_moved === 1 ? '' : 's'}`)
  if (result.moved.alerts_moved > 0) summaryParts.push(`${result.moved.alerts_moved} alert${result.moved.alerts_moved === 1 ? '' : 's'}`)
  if (result.moved.reviews_moved > 0) summaryParts.push(`${result.moved.reviews_moved} review${result.moved.reviews_moved === 1 ? '' : 's'}`)
  if (result.moved.variants_created > 0) summaryParts.push(`${result.moved.variants_created} variant${result.moved.variants_created === 1 ? '' : 's'}`)

  const carryText = result.copied_fields.length > 0
    ? ` Carried over ${result.copied_fields.join(', ')}.`
    : ''

  if (summaryParts.length === 0) {
    return `Merged ${result.source_phone.name} into ${result.target_phone.name}.${carryText}`
  }

  return `Merged ${result.source_phone.name} into ${result.target_phone.name} and moved ${summaryParts.join(', ')}.${carryText}`
}

const normalizeAdminPhone = (phone: AdminPhone): AdminPhone => ({
  ...phone,
  id: Number(phone.id),
  showcase_priority: Number(phone.showcase_priority ?? 0),
  search_aliases: Array.isArray(phone.search_aliases)
    ? phone.search_aliases
        .map<PhoneSearchAlias>((entry) => {
          const usage: PhoneSearchAlias['usage'] =
            entry?.usage === 'price' || entry?.usage === 'image'
              ? entry.usage
              : 'all'

          return {
            alias: String(entry?.alias ?? '').trim(),
            usage,
          }
        })
        .filter((entry) => entry.alias.length > 0)
    : [],
})

const isMergedAdminPhone = (phone: Pick<AdminPhone, 'name' | 'slug' | 'is_active'>) =>
  !phone.is_active && (/\[merged\]/i.test(phone.name) || /-merged-\d+\b/i.test(phone.slug))

const QUALITY_LIMITS = {
  canonicalSeedRestore: 24,
  canonicalSlugRepair: 24,
  seedAuthority: 24,
  variantBackfill: 24,
  unboundCurrentPriceRepair: 24,
  priceAttention: 12,
  legacyPriceCleanup: 24,
  imageAttention: 12,
} as const

const SAFE_OPERATOR_RECOMMENDATIONS = new Set<CatalogHealthOperatorRecommendation>([
  'delete_legacy_prices',
  'repair_canonical_slug',
  'resync_seed_authority',
  'backfill_variant_rows',
  'repair_unbound_current_prices',
  'repair_missing_local_image',
  'localize_image',
])

const OPERATOR_LANE_LABELS: Record<OperatorLaneFilter, string> = {
  all: 'All lanes',
  catalog: 'Catalog',
  pricing: 'Pricing',
  images: 'Images',
  showcase: 'Showcase',
}

const isSafeOperatorDecision = (decision: CatalogHealthOperatorDecision) =>
  SAFE_OPERATOR_RECOMMENDATIONS.has(decision.recommendation)

const MAX_MANUAL_UPLOAD_BYTES = 6 * 1024 * 1024
const SUPPORTED_MANUAL_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

const formatOperatorDate = () =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms))

const buildPriceAttentionExceptionNote = (issue: CatalogHealthIssuePhone) =>
  `Excluded from automated current-price attention on ${formatOperatorDate()} after Decide cleanup could not confirm a reliable Jumia or Slot offer. ${issue.detail}`.trim()

const buildManualImageOverrideNote = () =>
  `Manual image override pinned on ${formatOperatorDate()} from the current image audit because automated scraping kept surfacing unreliable results.`

const joinSearchAliasesByUsage = (
  aliases: PhoneSearchAlias[],
  usage: PhoneSearchAlias['usage']
) =>
  aliases
    .filter((entry) => entry.usage === usage)
    .map((entry) => entry.alias)
    .join('\n')

const buildSearchAliasesPayload = (
  sharedAliasesText: string,
  priceAliasesText: string,
  imageAliasesText: string
): PhoneSearchAlias[] => {
  const entries: PhoneSearchAlias[] = []
  const seen = new Set<string>()

  const appendAliases = (value: string, usage: PhoneSearchAlias['usage']) => {
    value
      .split(/\r?\n/)
      .map((entry) => entry.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .forEach((alias) => {
        const key = `${usage}|${alias.toLowerCase()}`
        if (seen.has(key)) return
        seen.add(key)
        entries.push({ alias, usage })
      })
  }

  appendAliases(sharedAliasesText, 'all')
  appendAliases(priceAliasesText, 'price')
  appendAliases(imageAliasesText, 'image')

  return entries
}

const IMAGE_STORE_LABELS: Record<'jumia' | 'slot', string> = {
  jumia: 'Jumia',
  slot: 'Slot',
}

const formatTrustedRecoveryStores = (stores: Array<'jumia' | 'slot'>) =>
  stores.map((store) => IMAGE_STORE_LABELS[store]).join(' + ')

const getImageRecoveryModeLabel = (phone: ImageAuditPhone) =>
  phone.repopulate_strategy === 'trusted_store_urls'
    ? `Trusted retry: ${formatTrustedRecoveryStores(phone.current_price_source_stores)}`
    : 'Search-only retry'

const getImageRecoveryModeDetail = (phone: ImageAuditPhone) =>
  phone.repopulate_strategy === 'trusted_store_urls'
    ? 'Repopulate can retry from current tracked store product pages before falling back to noisy search.'
    : 'Decide has no current Jumia or Slot product page for this phone right now, so repopulate will rely on lower-confidence search discovery.'

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const [, base64 = ''] = result.split(',', 2)

      if (!base64) {
        reject(new Error('Failed to read the selected image.'))
        return
      }

      resolve(base64)
    }

    reader.onerror = () => reject(new Error('Failed to read the selected image.'))
    reader.readAsDataURL(file)
  })

export default function AdminPhonesPage() {
  const [tab,     setTab]     = useState<Tab>('quality')
  const [phones,  setPhones]  = useState<AdminPhone[]>([])
  const [imageAudit, setImageAudit] = useState<ImageAuditPhone[]>([])
  const [imageSummary, setImageSummary] = useState<ImageAuditSummary>({
    total_active: 0,
    resolved_local: 0,
    resolved_external: 0,
    missing_local_file: 0,
    fallback: 0,
    missing: 0,
    manual_overrides: 0,
  })
  const [catalogHealth, setCatalogHealth] = useState<CatalogHealthData>({
    summary: {
      active_phones: 0,
      featured_phones: 0,
      unranked_featured_phones: 0,
      price_tracking_scope_phones: 0,
      price_attention_excluded_phones: 0,
      phones_with_current_prices: 0,
      phones_missing_current_prices: 0,
      stale_current_price_phones: 0,
      phones_with_variant_rows: 0,
      phones_missing_variant_rows: 0,
      phones_with_unbound_current_prices: 0,
      phones_with_legacy_prices: 0,
      canonical_slug_mismatch_phones: 0,
      phones_outside_canonical_seed: 0,
      duplicate_active_phone_rows: 0,
      canonical_seed_missing_live_phones: 0,
      seed_authority_drift_phones: 0,
      localized_images: 0,
      remote_only_images: 0,
      image_attention: 0,
      stale_threshold_hours: 72,
    },
    spotlight: {
      unranked_featured: [],
      missing_prices: [],
      stale_prices: [],
      legacy_prices: [],
      duplicate_active_phones: [],
      canonical_seed_missing_live: [],
      canonical_slug_mismatch: [],
      seed_authority_drift: [],
      noncanonical_active: [],
      missing_variants: [],
      unbound_current_prices: [],
      image_attention: [],
    },
    operator_queue: [],
  })
  const [brands,  setBrands]  = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [catalogueFilter, setCatalogueFilter] = useState<CatalogueFilter>('all')
  const [operatorLaneFilter, setOperatorLaneFilter] = useState<OperatorLaneFilter>('all')
  const [qualityAction, setQualityAction] = useState<string | null>(null)
  const [qualityMessage, setQualityMessage] = useState<{
    type: QualityMessageType
    text: string
    details?: string[]
  } | null>(null)
  const [operatorMessage, setOperatorMessage] = useState<{
    type: OperatorMessageType
    text: string
  } | null>(null)

  // Catalogue editing
  const [editing,                    setEditing]                    = useState<number | null>(null)
  const [editName,                   setEditName]                   = useState('')
  const [editPriority,               setEditPriority]               = useState('0')
  const [editExcludeFromPriceLane,   setEditExcludeFromPriceLane]   = useState(false)
  const [editPriceAttentionNote,     setEditPriceAttentionNote]     = useState('')
  const [editManualImageUrl,         setEditManualImageUrl]         = useState('')
  const [editManualImageNote,        setEditManualImageNote]        = useState('')
  const [editSharedSearchAliases,    setEditSharedSearchAliases]    = useState('')
  const [editPriceSearchAliases,     setEditPriceSearchAliases]     = useState('')
  const [editImageSearchAliases,     setEditImageSearchAliases]     = useState('')
  const [manualImageUploadFile,      setManualImageUploadFile]      = useState<File | null>(null)
  const [uploadingManualImage,       setUploadingManualImage]       = useState(false)
  const [catalogueEditorFocus, setCatalogueEditorFocus] = useState<CatalogueEditorFocus>('default')
  const [highlightedManualImagePhoneId, setHighlightedManualImagePhoneId] = useState<number | null>(null)
  const manualImageInputRef = useRef<HTMLInputElement | null>(null)
  const manualImageUploadSectionRef = useRef<HTMLDivElement | null>(null)

  // Tags
  const [tagPhone,   setTagPhone]   = useState('')
  const [tagPhoneData, setTagPhoneData] = useState<{ id: number; name: string } | null>(null)
  const [tags,       setTags]       = useState<string[]>([])
  const [newTag,     setNewTag]     = useState('')
  const [tagLoading, setTagLoading] = useState(false)
  const [tagMsg,     setTagMsg]     = useState<string | null>(null)

  // Add phone form
  const [form,     setForm]     = useState({
    brand_id: '', name: '', slug: '', os_type: 'android',
    released_year: '', display_size_inches: '', ram_gb: '',
    storage_gb: '', battery_mah: '', main_camera_mp: '',
    chipset: '', has_5g: false, has_nfc: false,
    score_battery: '5', score_camera: '5',
    score_performance: '5', score_build: '5', score_value: '5',
    gray_market_risk: 'low', local_support_quality: 'fair',
    is_featured: false, showcase_priority: '0',
  })
  const [adding,  setAdding]  = useState(false)
  const [addMsg,  setAddMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Image repopulate
  const [repopulating,      setRepopulating]      = useState(false)
  const [repopMsg,          setRepopMsg]          = useState<string | null>(null)
  const [repopSingle,       setRepopSingle]       = useState<number | null>(null)
  const [localizing,        setLocalizing]        = useState<number | null>(null)
  const [repairingMissingLocal, setRepairingMissingLocal] = useState<number | null>(null)
  const [deletingLegacyPrices, setDeletingLegacyPrices] = useState<number | null>(null)
  const [deactivatingNonCanonicalPhone, setDeactivatingNonCanonicalPhone] = useState<number | null>(null)
  const [repairingCanonicalSlug, setRepairingCanonicalSlug] = useState<number | null>(null)
  const [excludingPriceLane, setExcludingPriceLane] = useState<number | null>(null)
  const [resyncingSeedAuthority, setResyncingSeedAuthority] = useState<number | null>(null)
  const [backfillingVariants, setBackfillingVariants] = useState<number | null>(null)
  const [repairingUnboundCurrentPrices, setRepairingUnboundCurrentPrices] = useState<number | null>(null)
  const [restoringCanonicalSeedSlug, setRestoringCanonicalSeedSlug] = useState<string | null>(null)
  const [rejoiningPriceLane, setRejoiningPriceLane] = useState<number | null>(null)
  const [pinningManualImage, setPinningManualImage] = useState<number | null>(null)
  const [clearingManualImage, setClearingManualImage] = useState<number | null>(null)
  const [mergeSourceId, setMergeSourceId] = useState<number | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergingPhoneId, setMergingPhoneId] = useState<number | null>(null)

  const resetManualImageUploadState = useCallback(() => {
    setManualImageUploadFile(null)
    if (manualImageInputRef.current) {
      manualImageInputRef.current.value = ''
    }
  }, [])

  const loadPhones = useCallback(async () => {
    const json = await requestAdminJson<{ success: boolean; data: AdminPhone[] }>(
      '/phones/list'
    )

    if (json.success) {
      setPhones(sortAdminPhones(json.data.map(normalizeAdminPhone)))
    }
  }, [])

  const loadImageAudit = useCallback(async () => {
    const json = await requestAdminJson<{
      success: boolean
      data: ImageAuditPhone[]
      summary?: ImageAuditSummary
    }>('/phones/image-audit')

    if (json.success) {
      setImageAudit(json.data)
      if (json.summary) setImageSummary(json.summary)
    }
  }, [])

  const loadCatalogHealth = useCallback(async () => {
    const json = await requestAdminJson<{
      success: boolean
      data: CatalogHealthData
    }>('/phones/catalog-health')

    if (json.success) {
      setCatalogHealth(json.data)
      return json.data
    }

    return null
  }, [])

  useEffect(() => {
    Promise.all([
      loadPhones(),
      loadImageAudit(),
      loadCatalogHealth(),
      requestAdminJson<{ success: boolean; data: Brand[] }>('/brands'),
    ]).then(([_phones, _imageAudit, _catalogHealth, brandsRes]) => {
      if (brandsRes.success) setBrands(brandsRes.data)
    }).finally(() => setLoading(false))
  }, [loadCatalogHealth, loadImageAudit, loadPhones])

  const refreshQualityViews = useCallback(async () => {
    const [, , refreshedCatalogHealth] = await Promise.all([
      loadPhones(),
      loadImageAudit(),
      loadCatalogHealth(),
    ])

    return refreshedCatalogHealth
  }, [loadCatalogHealth, loadImageAudit, loadPhones])

  const startEditingPhone = useCallback((phone: AdminPhone, options?: { focus?: CatalogueEditorFocus }) => {
    const focus = options?.focus ?? 'default'
    setMergeSourceId(null)
    setMergeTargetId('')
    setEditing(phone.id)
    setEditName(phone.name)
    setEditPriority(String(phone.showcase_priority ?? 0))
    setEditExcludeFromPriceLane(phone.exclude_from_price_attention)
    setEditPriceAttentionNote(phone.price_attention_note ?? '')
    setEditManualImageUrl(phone.manual_image_url ?? '')
    setEditManualImageNote(phone.manual_image_note ?? '')
    setEditSharedSearchAliases(joinSearchAliasesByUsage(phone.search_aliases, 'all'))
    setEditPriceSearchAliases(joinSearchAliasesByUsage(phone.search_aliases, 'price'))
    setEditImageSearchAliases(joinSearchAliasesByUsage(phone.search_aliases, 'image'))
    setCatalogueEditorFocus(focus)
    setHighlightedManualImagePhoneId(focus === 'manual-image-upload' ? phone.id : null)
    resetManualImageUploadState()
  }, [resetManualImageUploadState])

  const cancelEditingPhone = useCallback(() => {
    setEditing(null)
    setEditName('')
    setEditPriority('0')
    setEditExcludeFromPriceLane(false)
    setEditPriceAttentionNote('')
    setEditManualImageUrl('')
    setEditManualImageNote('')
    setEditSharedSearchAliases('')
    setEditPriceSearchAliases('')
    setEditImageSearchAliases('')
    setCatalogueEditorFocus('default')
    setHighlightedManualImagePhoneId(null)
    resetManualImageUploadState()
  }, [resetManualImageUploadState])

  const openCatalogueEditor = useCallback((phoneId: number, focus: CatalogueEditorFocus = 'default') => {
    const phone = phones.find((item) => item.id === phoneId)
    if (!phone) return

    setSearch(phone.name)
    setCatalogueFilter('all')
    setTab('catalogue')
    startEditingPhone(phone, { focus })
  }, [phones, startEditingPhone])

  const guideToCatalogueEditor = useCallback(
    (phoneId: number, text: string, focus: CatalogueEditorFocus = 'default') => {
      openCatalogueEditor(phoneId, focus)
      setOperatorMessage({
        type: 'success',
        text,
      })
    },
    [openCatalogueEditor]
  )

  useEffect(() => {
    if (
      editing === null ||
      catalogueEditorFocus !== 'manual-image-upload' ||
      highlightedManualImagePhoneId !== editing
    ) {
      return
    }

    manualImageUploadSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    manualImageInputRef.current?.focus()

    const timeout = window.setTimeout(() => {
      setHighlightedManualImagePhoneId((current) => (current === editing ? null : current))
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [catalogueEditorFocus, editing, highlightedManualImagePhoneId])

  const classifyRemediationResult = useCallback(
    (result?: CatalogRemediationResult): QualityMessageType => {
      if (!result) return 'success'

      const partiallyResolvedAttentionLane =
        ['refresh_price_attention', 'delete_legacy_prices', 'repair_canonical_slugs', 'repair_unbound_current_prices', 'repair_missing_local_images', 'localize_remote_images', 'repopulate_fallback_images'].includes(result.action) &&
        result.processed > 0 &&
        result.updated < result.processed

      if (result.failed > 0 || partiallyResolvedAttentionLane) {
        return 'warning'
      }

      return 'success'
    },
    []
  )

  const buildQualityDetails = useCallback((result?: CatalogRemediationResult) => {
    return result?.items
      ?.filter((item) => item.status !== 'skipped')
      .slice(0, 3)
      .map((item) => `${item.name}: ${item.detail}`)
  }, [])

  const buildQualitySnapshot = useCallback((health: CatalogHealthData): QualitySnapshot => ({
    priceAttention:
      health.summary.phones_missing_current_prices +
      health.summary.stale_current_price_phones,
    legacyPrices: health.summary.phones_with_legacy_prices,
    duplicateModels: health.summary.duplicate_active_phone_rows,
    canonicalSeedMissingLive: health.summary.canonical_seed_missing_live_phones,
    canonicalSlugMismatches: health.summary.canonical_slug_mismatch_phones,
    seedAuthorityDrift: health.summary.seed_authority_drift_phones,
    outsideCanonicalSeed: health.summary.phones_outside_canonical_seed,
    missingVariants: health.summary.phones_missing_variant_rows,
    unboundCurrentOffers: health.summary.phones_with_unbound_current_prices,
    imageAttention: health.summary.image_attention,
    unrankedFeatured: health.summary.unranked_featured_phones,
    operatorQueue: health.operator_queue.length,
  }), [])

  const formatQualityMovementLine = useCallback((
    label: string,
    before: number,
    after: number
  ) => {
    if (before === after) {
      return `${label}: still ${after} after refresh.`
    }

    const delta = Math.abs(after - before)
    const direction = after < before ? 'down' : 'up'
    return `${label}: ${before} -> ${after} (${direction} ${delta}).`
  }, [])

  const buildQualityMovementDetails = useCallback((
    actionKey: string,
    beforeHealth: CatalogHealthData,
    afterHealth: CatalogHealthData
  ) => {
    const before = buildQualitySnapshot(beforeHealth)
    const after = buildQualitySnapshot(afterHealth)

    const laneLabels: Record<QualityMovementKey, string> = {
      priceAttention: 'Price attention',
      legacyPrices: 'Legacy price leftovers',
      duplicateModels: 'Duplicate live models',
      canonicalSeedMissingLive: 'Missing canonical seed phones',
      canonicalSlugMismatches: 'Canonical slug mismatches',
      seedAuthorityDrift: 'Seed authority drift',
      outsideCanonicalSeed: 'Outside canonical seed',
      missingVariants: 'Missing variants',
      unboundCurrentOffers: 'Unbound current offers',
      imageAttention: 'Image attention',
      unrankedFeatured: 'Unranked featured phones',
      operatorQueue: 'Operator queue',
    }

    const actionLaneMap: Record<string, QualityMovementKey[]> = {
      'normalize-showcase': ['unrankedFeatured', 'operatorQueue'],
      'restore-missing-canonical-seed-phones': ['canonicalSeedMissingLive', 'operatorQueue'],
      'repair-canonical-slugs': ['canonicalSlugMismatches', 'operatorQueue'],
      'backfill-variants': ['missingVariants', 'operatorQueue'],
      'repair-unbound-current-prices': ['unboundCurrentOffers', 'operatorQueue'],
      'resync-seed-authority': ['seedAuthorityDrift', 'operatorQueue'],
      'repair-missing-local-images': ['imageAttention', 'operatorQueue'],
      'localize-remote-images': ['imageAttention', 'operatorQueue'],
      'refresh-price-attention': ['priceAttention', 'operatorQueue'],
      'delete-legacy-prices': ['legacyPrices', 'operatorQueue'],
      'repopulate-fallback-images': ['imageAttention', 'operatorQueue'],
      'recommended-cleanup': [
        'priceAttention',
        'legacyPrices',
        'missingVariants',
        'unboundCurrentOffers',
        'canonicalSlugMismatches',
        'seedAuthorityDrift',
        'imageAttention',
        'unrankedFeatured',
        'operatorQueue',
      ],
      'exclude-price-attention': ['priceAttention', 'operatorQueue'],
      'deactivate-noncanonical-phone': ['outsideCanonicalSeed', 'operatorQueue'],
      'rejoin-price-attention': ['priceAttention', 'operatorQueue'],
    }

    const selectedKeys = actionLaneMap[actionKey] ?? ['operatorQueue']
    const lines = selectedKeys
      .map((key) => ({
        key,
        before: before[key],
        after: after[key],
      }))
      .filter((entry, index, entries) =>
        entries.findIndex((candidate) => candidate.key === entry.key) === index
      )
      .filter((entry) =>
        actionKey === 'recommended-cleanup'
          ? entry.before !== entry.after
          : true
      )
      .map((entry) =>
        formatQualityMovementLine(
          laneLabels[entry.key],
          entry.before,
          entry.after
        )
      )

    if (lines.length > 0) {
      return lines.slice(0, 4)
    }

    return [
      'No visible backlog count moved yet after refresh. That usually means the action exposed the next issue behind the same lane instead of shrinking the lane outright.',
    ]
  }, [buildQualitySnapshot, formatQualityMovementLine])

  const buildPrimaryMovementSummary = useCallback((
    actionKey: string,
    beforeHealth: CatalogHealthData,
    afterHealth: CatalogHealthData
  ) => buildQualityMovementDetails(actionKey, beforeHealth, afterHealth)[0] ?? '', [buildQualityMovementDetails])

  const runQualityAction = useCallback(
    async (
      actionKey: string,
      endpoint: string,
      options: RequestInit = {},
      afterSuccess?: 'refresh' | 'delayed-refresh'
    ) => {
      setQualityAction(actionKey)
      setQualityMessage(null)
      const beforeHealth = catalogHealth

      try {
        const json = await requestAdminJson<{
          success: boolean
          message?: string
          data?: CatalogRemediationResult
        }>(endpoint, options)

        if (!json.success) {
          setQualityMessage({
            type: 'error',
            text: json.message ?? 'Quality action failed.',
          })
          return
        }

        const messageType = classifyRemediationResult(json.data)
        let refreshedHealth: CatalogHealthData | null = null

        if (afterSuccess === 'refresh') {
          refreshedHealth = await refreshQualityViews()
        }

        if (afterSuccess === 'delayed-refresh') {
          await wait(4000)
          refreshedHealth = await refreshQualityViews()
        }

        const movementDetails =
          refreshedHealth && beforeHealth
            ? buildQualityMovementDetails(actionKey, beforeHealth, refreshedHealth)
            : []

        setQualityMessage({
          type: messageType,
          text:
            messageType === 'warning'
              ? 'Quality action completed with mixed results.'
              : json.message ?? 'Quality action completed.',
          details: [...movementDetails, ...(buildQualityDetails(json.data) ?? [])].slice(0, 6),
        })
      } catch {
        setQualityMessage({
          type: 'error',
          text: 'Quality action failed.',
        })
      } finally {
        setQualityAction(null)
      }
    },
    [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews]
  )

  const runRecommendedCleanup = useCallback(async () => {
    setQualityAction('recommended-cleanup')
    setQualityMessage(null)
    const beforeHealth = catalogHealth

    const steps: Array<{
      label: string
      endpoint: string
      options?: RequestInit
    }> = [
      {
        label: 'Restore missing canonical seed phones',
        endpoint: '/phones/catalog-health/actions/restore-missing-canonical-seed-phones',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.canonicalSeedRestore }),
        },
      },
      {
        label: 'Repair canonical slug mismatches',
        endpoint: '/phones/catalog-health/actions/repair-canonical-slugs',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.canonicalSlugRepair }),
        },
      },
      {
        label: 'Resync canonical seed drift',
        endpoint: '/phones/catalog-health/actions/resync-seed-authority',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.seedAuthority }),
        },
      },
      {
        label: 'Normalize showcase order',
        endpoint: '/phones/catalog-health/actions/normalize-showcase',
        options: { method: 'POST' },
      },
      {
        label: 'Backfill default variants',
        endpoint: '/phones/catalog-health/actions/backfill-variants',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.variantBackfill }),
        },
      },
      {
        label: 'Repair unbound current offers',
        endpoint: '/phones/catalog-health/actions/repair-unbound-current-prices',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.unboundCurrentPriceRepair }),
        },
      },
      {
        label: 'Refresh price attention set',
        endpoint: '/phones/catalog-health/actions/refresh-price-attention',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.priceAttention }),
        },
      },
      {
        label: 'Delete legacy price leftovers',
        endpoint: '/phones/catalog-health/actions/delete-legacy-prices',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.legacyPriceCleanup }),
        },
      },
      {
        label: 'Localize remote-only images',
        endpoint: '/phones/catalog-health/actions/localize-remote-images',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
        },
      },
      {
        label: 'Repair missing local images',
        endpoint: '/phones/catalog-health/actions/repair-missing-local-images',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
        },
      },
      {
        label: 'Repopulate fallback images',
        endpoint: '/phones/catalog-health/actions/repopulate-fallback-images',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
        },
      },
    ]

    const details: string[] = []
    const failures: string[] = []
    let mixedResults = false

    try {
      for (const step of steps) {
        const json = await requestAdminJson<{
          success: boolean
          message?: string
          data?: CatalogRemediationResult
        }>(step.endpoint, step.options)

        if (!json.success) {
          failures.push(`${step.label}: ${json.message ?? 'Failed.'}`)
          continue
        }

        details.push(`${step.label}: ${json.message ?? 'Completed.'}`)
        const itemDetails = buildQualityDetails(json.data)
        if (itemDetails?.length) {
          details.push(...itemDetails)
        }

        if (classifyRemediationResult(json.data) === 'warning') {
          mixedResults = true
        }
      }

      const refreshedHealth = await refreshQualityViews()
      const movementDetails =
        refreshedHealth && beforeHealth
          ? buildQualityMovementDetails('recommended-cleanup', beforeHealth, refreshedHealth)
          : []

      setQualityMessage({
        type: failures.length > 0 ? 'error' : mixedResults ? 'warning' : 'success',
        text:
          failures.length > 0
            ? 'Recommended cleanup hit some hard failures and still needs attention.'
            : mixedResults
            ? 'Recommended cleanup ran, but some phones still need manual operator decisions.'
            : 'Recommended cleanup finished successfully.',
        details: [...movementDetails, ...details, ...failures].slice(0, 8),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: 'Recommended cleanup failed before the sequence could finish.',
      })
    } finally {
      setQualityAction(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const toggleFeatured = async (id: number, is_featured: boolean) => {
    setPhones((prev) => sortAdminPhones(prev.map((p) => p.id === id ? { ...p, is_featured: !is_featured } : p)))
    await requestAdminJson<{ success: boolean; message: string }>(`/phones/${id}/featured`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !is_featured }),
    })
      .then(() => loadCatalogHealth())
      .catch(() => setPhones((prev) => sortAdminPhones(prev.map((p) => p.id === id ? { ...p, is_featured } : p))))
  }

  const updatePhoneAdminFields = useCallback(async (id: number, payload: Record<string, unknown>) => {
    return requestAdminJson<{ success: boolean; message: string }>(`/phones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }, [])

  const getLikelyMergeTargets = useCallback((source: AdminPhone) => {
    if (isMergedAdminPhone(source)) {
      return []
    }

    const sourceNameKey = normalizeDuplicatePhoneKey(source.name)
    const sourceSlugKey = normalizeDuplicatePhoneKey(source.slug)

    return phones
      .filter((candidate) => {
        if (candidate.id === source.id) return false
        if (candidate.brand_name !== source.brand_name) return false
        if (!candidate.is_active) return false
        if (isMergedAdminPhone(candidate)) return false

        const candidateNameKey = normalizeDuplicatePhoneKey(candidate.name)
        const candidateSlugKey = normalizeDuplicatePhoneKey(candidate.slug)

        return candidateNameKey === sourceNameKey || candidateSlugKey === sourceSlugKey
      })
      .sort((left, right) => {
        if (left.is_active !== right.is_active) {
          return Number(right.is_active) - Number(left.is_active)
        }

        if (left.is_featured !== right.is_featured) {
          return Number(right.is_featured) - Number(left.is_featured)
        }

        if (left.showcase_priority !== right.showcase_priority) {
          return right.showcase_priority - left.showcase_priority
        }

        return left.slug.localeCompare(right.slug)
      })
  }, [phones])

  const beginMergePhone = useCallback((source: AdminPhone, preferredTargetId?: number | null) => {
    const candidates = getLikelyMergeTargets(source)

    if (candidates.length === 0) {
      setOperatorMessage({
        type: 'error',
        text: `No likely merge target was found for ${source.name}.`,
      })
      return
    }

    cancelEditingPhone()
    setMergeSourceId(source.id)
    const preferredCandidate =
      preferredTargetId != null
        ? candidates.find((candidate) => Number(candidate.id) === Number(preferredTargetId))
        : undefined
    setMergeTargetId(String(preferredCandidate?.id ?? candidates[0].id))
    setOperatorMessage(null)
  }, [cancelEditingPhone, getLikelyMergeTargets])

  const cancelMergePhone = useCallback(() => {
    setMergeSourceId(null)
    setMergeTargetId('')
  }, [])

  const mergePhone = useCallback(async (source: AdminPhone) => {
    const candidates = getLikelyMergeTargets(source)
    const requestedTargetId = parseInt(mergeTargetId, 10)
    const fallbackTarget = candidates[0]
    const target =
      phones.find((phone) => Number(phone.id) === requestedTargetId) ??
      fallbackTarget
    const targetId = target ? Number(target.id) : NaN

    if (!Number.isFinite(targetId) || !target) {
      setOperatorMessage({
        type: 'error',
        text: 'Choose a valid merge target before continuing.',
      })
      return
    }

    const confirmed = window.confirm(
      `Merge "${source.name}" (${source.slug}) into "${target.name}" (${target.slug})?\n\nThis moves linked prices, variants, alerts, saved phones, and reviews onto the target, then marks the source row as merged and inactive.`
    )

    if (!confirmed) return

    setMergingPhoneId(source.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: PhoneMergeResult
      }>(`/phones/${source.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_phone_id: target.id }),
      })

      if (!json.success || !json.data) {
        setOperatorMessage({
          type: 'error',
          text: json.message ?? `Failed to merge ${source.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      cancelMergePhone()
      setOperatorMessage({
        type: 'success',
        text: `${summarizePhoneMerge(json.data)}${
          refreshedHealth
            ? ` ${buildPrimaryMovementSummary('deactivate-noncanonical-phone', beforeHealth, refreshedHealth)}`
            : ''
        }`.trim(),
      })
    } catch {
      setOperatorMessage({
        type: 'error',
        text: `Failed to merge ${source.name}.`,
      })
    } finally {
      setMergingPhoneId(null)
    }
  }, [buildPrimaryMovementSummary, cancelMergePhone, catalogHealth, mergeTargetId, phones, refreshQualityViews])

  const openMergeReview = useCallback(
    (issue: Pick<CatalogHealthIssuePhone, 'id' | 'name' | 'suggested_target_id' | 'suggested_target_slug'>, text?: string) => {
      const source = phones.find((phone) => phone.id === issue.id)

      if (!source) {
        setOperatorMessage({
          type: 'error',
          text: `Could not find ${issue.name} in the current catalogue list.`,
        })
        return
      }

      setSearch(source.name)
      setCatalogueFilter('all')
      setTab('catalogue')
      beginMergePhone(source, issue.suggested_target_id ?? null)

      setOperatorMessage({
        type: 'success',
        text:
          text ??
          `${issue.name} has an active duplicate. Merge review is open below${
            issue.suggested_target_slug
              ? ` with ${issue.suggested_target_slug} preselected`
              : ''
          }.`,
      })
    },
    [beginMergePhone, phones]
  )

  const saveEdit = async (id: number) => {
    const normalizedPriority = Math.max(0, Math.round(Number(editPriority) || 0))
    const json = await updatePhoneAdminFields(id, {
      name: editName,
      showcase_priority: normalizedPriority,
      exclude_from_price_attention: editExcludeFromPriceLane,
      price_attention_note: editPriceAttentionNote.trim() || null,
      manual_image_url: editManualImageUrl.trim() || null,
      manual_image_note: editManualImageNote.trim() || null,
      search_aliases: buildSearchAliasesPayload(
        editSharedSearchAliases,
        editPriceSearchAliases,
        editImageSearchAliases
      ),
    })

    if (!json.success) {
      setQualityMessage({
        type: 'error',
        text: json.message ?? 'Phone update failed.',
      })
      return
    }

    await refreshQualityViews()
    cancelEditingPhone()
  }

  const excludePhoneFromPriceAttention = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setExcludingPriceLane(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await updatePhoneAdminFields(issue.id, {
        exclude_from_price_attention: true,
        price_attention_note: buildPriceAttentionExceptionNote(issue),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to exclude ${issue.name} from price attention.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      setQualityMessage({
        type: 'success',
        text: `${issue.name} is now excluded from the automated price-attention lane.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('exclude-price-attention', beforeHealth, refreshedHealth)
            : []),
          'You can still add a note or reverse this from the Catalogue tab.',
        ].slice(0, 5),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to exclude ${issue.name} from price attention.`,
      })
    } finally {
      setExcludingPriceLane(null)
    }
  }, [buildQualityMovementDetails, catalogHealth, refreshQualityViews, updatePhoneAdminFields])

  const deleteLegacyPricesForPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setDeletingLegacyPrices(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{ success: boolean; message?: string }>(
        `/prices/phone/${issue.id}/legacy`,
        { method: 'DELETE' }
      )

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to delete legacy prices for ${issue.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      setQualityMessage({
        type: 'success',
        text: json.message ?? `${issue.name} no longer has legacy price rows in the admin lane.`,
        details: refreshedHealth
          ? buildQualityMovementDetails('delete-legacy-prices', beforeHealth, refreshedHealth)
          : undefined,
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to delete legacy prices for ${issue.name}.`,
      })
    } finally {
      setDeletingLegacyPrices(null)
    }
  }, [buildQualityMovementDetails, catalogHealth, refreshQualityViews])

  const deactivateNonCanonicalPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setDeactivatingNonCanonicalPhone(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await updatePhoneAdminFields(issue.id, {
        is_active: false,
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to deactivate ${issue.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      setQualityMessage({
        type: 'success',
        text: `${issue.name} is now inactive and no longer part of the public catalog.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('deactivate-noncanonical-phone', beforeHealth, refreshedHealth)
            : []),
          'If this was intentional as a manual exception, you can reactivate it later from the Catalogue tab.',
        ].slice(0, 5),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to deactivate ${issue.name}.`,
      })
    } finally {
      setDeactivatingNonCanonicalPhone(null)
    }
  }, [buildQualityMovementDetails, catalogHealth, refreshQualityViews, updatePhoneAdminFields])

  const repairCanonicalSlugForPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setRepairingCanonicalSlug(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: CatalogRemediationResult
      }>('/phones/catalog-health/actions/repair-canonical-slugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_ids: [issue.id] }),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to repair the canonical slug for ${issue.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()

      const messageType = classifyRemediationResult(json.data)
      setQualityMessage({
        type: messageType,
        text:
          messageType === 'warning'
            ? 'Canonical slug repair completed with mixed results.'
            : json.message ?? `${issue.name} now uses its canonical seed slug.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('repair-canonical-slugs', beforeHealth, refreshedHealth)
            : []),
          ...(buildQualityDetails(json.data) ?? []),
        ].slice(0, 6),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to repair the canonical slug for ${issue.name}.`,
      })
    } finally {
      setRepairingCanonicalSlug(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const resyncSeedAuthorityForPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setResyncingSeedAuthority(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: CatalogRemediationResult
      }>('/phones/catalog-health/actions/resync-seed-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_ids: [issue.id] }),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to resync ${issue.name} from canonical seed.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()

      const messageType = classifyRemediationResult(json.data)
      setQualityMessage({
        type: messageType,
        text:
          messageType === 'warning'
            ? 'Seed authority resync completed with mixed results.'
            : json.message ?? `${issue.name} is back in sync with canonical seed truth.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('resync-seed-authority', beforeHealth, refreshedHealth)
            : []),
          ...(buildQualityDetails(json.data) ?? []),
        ].slice(0, 6),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to resync ${issue.name} from canonical seed.`,
      })
    } finally {
      setResyncingSeedAuthority(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const backfillVariantsForPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setBackfillingVariants(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: CatalogRemediationResult
      }>('/phones/catalog-health/actions/backfill-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_ids: [issue.id] }),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to backfill variants for ${issue.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()

      const messageType = classifyRemediationResult(json.data)
      setQualityMessage({
        type: messageType,
        text:
          messageType === 'warning'
            ? 'Variant backfill completed with mixed results.'
            : json.message ?? `${issue.name} now has its default variant rows restored.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('backfill-variants', beforeHealth, refreshedHealth)
            : []),
          ...(buildQualityDetails(json.data) ?? []),
        ].slice(0, 6),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to backfill variants for ${issue.name}.`,
      })
    } finally {
      setBackfillingVariants(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const repairUnboundCurrentPricesForPhone = useCallback(async (issue: CatalogHealthIssuePhone) => {
    setRepairingUnboundCurrentPrices(issue.id)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: CatalogRemediationResult
      }>('/phones/catalog-health/actions/repair-unbound-current-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_ids: [issue.id] }),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to repair current-price binding for ${issue.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()

      const messageType = classifyRemediationResult(json.data)
      setQualityMessage({
        type: messageType,
        text:
          messageType === 'warning'
            ? 'Current-price binding repair completed with mixed results.'
            : json.message ?? `${issue.name} now has a repaired tracked-store binding.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('repair-unbound-current-prices', beforeHealth, refreshedHealth)
            : []),
          ...(buildQualityDetails(json.data) ?? []),
        ].slice(0, 6),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to repair current-price binding for ${issue.name}.`,
      })
    } finally {
      setRepairingUnboundCurrentPrices(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const restoreCanonicalSeedPhone = useCallback(async (issue: CatalogSeedMissingLivePhone) => {
    setRestoringCanonicalSeedSlug(issue.seed_slug)
    const beforeHealth = catalogHealth

    try {
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: CatalogRemediationResult
      }>('/phones/catalog-health/actions/restore-missing-canonical-seed-phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed_slugs: [issue.seed_slug] }),
      })

      if (!json.success) {
        setQualityMessage({
          type: 'error',
          text: json.message ?? `Failed to restore ${issue.name} from canonical seed.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()

      const messageType = classifyRemediationResult(json.data)
      setQualityMessage({
        type: messageType,
        text:
          messageType === 'warning'
            ? 'Canonical seed restore completed with mixed results.'
            : json.message ?? `${issue.name} is back in the live catalog from canonical seed.`,
        details: [
          ...(refreshedHealth
            ? buildQualityMovementDetails('restore-missing-canonical-seed-phones', beforeHealth, refreshedHealth)
            : []),
          ...(buildQualityDetails(json.data) ?? []),
        ].slice(0, 6),
      })
    } catch {
      setQualityMessage({
        type: 'error',
        text: `Failed to restore ${issue.name} from canonical seed.`,
      })
    } finally {
      setRestoringCanonicalSeedSlug(null)
    }
  }, [buildQualityDetails, buildQualityMovementDetails, catalogHealth, classifyRemediationResult, refreshQualityViews])

  const rejoinPhoneToPriceAttention = useCallback(async (phone: AdminPhone) => {
    setRejoiningPriceLane(phone.id)
    const beforeHealth = catalogHealth

    try {
      const json = await updatePhoneAdminFields(phone.id, {
        exclude_from_price_attention: false,
        price_attention_note: null,
      })

      if (!json.success) {
        setOperatorMessage({
          type: 'error',
          text: json.message ?? `Failed to move ${phone.name} back into the pricing lane.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      setOperatorMessage({
        type: 'success',
        text: refreshedHealth
          ? `${phone.name} is back in automated price attention. ${buildQualityMovementDetails('rejoin-price-attention', beforeHealth, refreshedHealth)[0] ?? ''}`.trim()
          : `${phone.name} is back in automated price attention.`,
      })
    } catch {
      setOperatorMessage({
        type: 'error',
        text: `Failed to move ${phone.name} back into the pricing lane.`,
      })
    } finally {
      setRejoiningPriceLane(null)
    }
  }, [buildQualityMovementDetails, catalogHealth, refreshQualityViews, updatePhoneAdminFields])

  const pinCurrentImageAsManualOverride = useCallback(async (phone: ImageAuditPhone) => {
    if (!phone.image_url || phone.manual_override || phone.health_status !== 'resolved_external') {
      return
    }

    setPinningManualImage(phone.id)
    const beforeHealth = catalogHealth

    try {
      const json = await updatePhoneAdminFields(phone.id, {
        manual_image_url: phone.image_url,
        manual_image_note: buildManualImageOverrideNote(),
      })

      if (!json.success) {
        setOperatorMessage({
          type: 'error',
          text: json.message ?? `Failed to pin ${phone.name}'s current image as a manual override.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      setOperatorMessage({
        type: 'success',
        text: `${phone.name}'s current image is now pinned as the manual override.${
          refreshedHealth
            ? ` ${buildPrimaryMovementSummary('localize-remote-images', beforeHealth, refreshedHealth)}`
            : ''
        }`.trim(),
      })
    } catch {
      setOperatorMessage({
        type: 'error',
        text: `Failed to pin ${phone.name}'s current image as a manual override.`,
      })
    } finally {
      setPinningManualImage(null)
    }
  }, [buildPrimaryMovementSummary, catalogHealth, refreshQualityViews, updatePhoneAdminFields])

  const clearManualImageOverride = useCallback(async (phone: AdminPhone) => {
    setClearingManualImage(phone.id)
    const beforeHealth = catalogHealth

    try {
      const json = await updatePhoneAdminFields(phone.id, {
        manual_image_url: null,
        manual_image_note: null,
      })

      if (!json.success) {
        setOperatorMessage({
          type: 'error',
          text: json.message ?? `Failed to clear the manual image override for ${phone.name}.`,
        })
        return
      }

      const refreshedHealth = await refreshQualityViews()
      if (editing === phone.id) {
        setEditManualImageUrl('')
        setEditManualImageNote('')
        resetManualImageUploadState()
      }
      setOperatorMessage({
        type: 'success',
        text: `${phone.name}'s manual image override has been cleared.${
          refreshedHealth
            ? ` ${buildPrimaryMovementSummary('repopulate-fallback-images', beforeHealth, refreshedHealth)}`
            : ''
        }`.trim(),
      })
    } catch {
      setOperatorMessage({
        type: 'error',
        text: `Failed to clear the manual image override for ${phone.name}.`,
      })
    } finally {
      setClearingManualImage(null)
    }
  }, [buildPrimaryMovementSummary, catalogHealth, editing, refreshQualityViews, resetManualImageUploadState, updatePhoneAdminFields])

  const handleManualImageFileSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null

      if (!file) {
        setManualImageUploadFile(null)
        return
      }

      if (
        !SUPPORTED_MANUAL_UPLOAD_MIME_TYPES.includes(
          file.type as (typeof SUPPORTED_MANUAL_UPLOAD_MIME_TYPES)[number]
        )
      ) {
        event.target.value = ''
        setManualImageUploadFile(null)
        setOperatorMessage({
          type: 'error',
          text: 'Choose a JPG, PNG, or WEBP image for the manual override.',
        })
        return
      }

      if (file.size > MAX_MANUAL_UPLOAD_BYTES) {
        event.target.value = ''
        setManualImageUploadFile(null)
        setOperatorMessage({
          type: 'error',
          text: 'Keep manual image uploads under 6MB.',
        })
        return
      }

      setOperatorMessage(null)
      setManualImageUploadFile(file)
    },
    []
  )

  const uploadManualImageForPhone = useCallback(async (phoneId: number) => {
    if (!manualImageUploadFile) {
      setOperatorMessage({
        type: 'error',
        text: 'Choose an image file first before uploading.',
      })
      return
    }

    setUploadingManualImage(true)
    const beforeHealth = catalogHealth

    try {
      const contentBase64 = await readFileAsBase64(manualImageUploadFile)
      const json = await requestAdminJson<{
        success: boolean
        message?: string
        data?: {
          public_path: string
          note: string | null
        }
      }>(`/phones/${phoneId}/manual-image-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_base64: contentBase64,
          mime_type: manualImageUploadFile.type,
          original_name: manualImageUploadFile.name,
          note: editManualImageNote.trim() || null,
        }),
      })

      if (!json.success || !json.data?.public_path) {
        setOperatorMessage({
          type: 'error',
          text: json.message ?? 'Manual image upload failed.',
        })
        return
      }

      setEditManualImageUrl(json.data.public_path)
      setEditManualImageNote(json.data.note ?? '')
      resetManualImageUploadState()
      const refreshedHealth = await refreshQualityViews()
      setOperatorMessage({
        type: 'success',
        text: `${manualImageUploadFile.name} is now stored locally and linked as the manual image override.${
          refreshedHealth
            ? ` ${buildPrimaryMovementSummary('repopulate-fallback-images', beforeHealth, refreshedHealth)}`
            : ''
        }`.trim(),
      })
    } catch (error) {
      setOperatorMessage({
        type: 'error',
        text:
          error instanceof Error ? error.message : 'Manual image upload failed.',
      })
    } finally {
      setUploadingManualImage(false)
    }
  }, [buildPrimaryMovementSummary, catalogHealth, editManualImageNote, manualImageUploadFile, refreshQualityViews, resetManualImageUploadState])

  // Auto-generate slug
  const handleFormNameChange = (val: string) => {
    const brand = brands.find((b) => b.id === parseInt(form.brand_id))
    const brandSlug = brand?.slug ?? ''
    const nameSlug  = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm((f) => ({ ...f, name: val, slug: brandSlug ? `${brandSlug}-${nameSlug}` : nameSlug }))
  }

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setAddMsg(null)
    try {
      const payload: Record<string, unknown> = { ...form }
      // Convert numeric strings to numbers
      for (const key of ['brand_id','released_year','display_size_inches','ram_gb','storage_gb','battery_mah','main_camera_mp','score_battery','score_camera','score_performance','score_build','score_value','showcase_priority']) {
        if (payload[key]) payload[key] = parseFloat(payload[key] as string)
      }
      const json = await requestAdminJson<{ success: boolean; message?: string }>(
        '/phones',
        {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        }
      )
      if (json.success) {
        setAddMsg({ type: 'success', text: `"${form.name}" added. Remember to run image population.` })
        await loadCatalogHealth()
        setForm({
          brand_id: '', name: '', slug: '', os_type: 'android',
          released_year: '', display_size_inches: '', ram_gb: '',
          storage_gb: '', battery_mah: '', main_camera_mp: '',
          chipset: '', has_5g: false, has_nfc: false,
          score_battery: '5', score_camera: '5',
          score_performance: '5', score_build: '5', score_value: '5',
          gray_market_risk: 'low', local_support_quality: 'fair',
          is_featured: false, showcase_priority: '0',
        })
      } else {
        setAddMsg({ type: 'error', text: json.message ?? 'Failed to add phone.' })
      }
    } catch {
      setAddMsg({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setAdding(false)
    }
  }

  const loadTags = useCallback(async (name: string) => {
    setTagLoading(true)
    setTagMsg(null)
    try {
      const phoneJson = await requestAdminJson<{ success: boolean; data: AdminPhone[] }>(
        '/phones/list'
      )
      const found = phoneJson.data?.find((p: AdminPhone) =>
        p.name.toLowerCase() === name.toLowerCase()
      )
      if (!found) { setTagMsg('Phone not found. Check the exact name.'); setTagLoading(false); return }
      setTagPhoneData({ id: found.id, name: found.name })

      const tagsJson = await requestAdminJson<{ success: boolean; data: string[] }>(
        `/phones/${found.id}/tags`
      )
      if (tagsJson.success) setTags(tagsJson.data)
    } catch {
      setTagMsg('Failed to load tags.')
    } finally {
      setTagLoading(false)
    }
  }, [])

  const addTag = async () => {
    if (!tagPhoneData || !newTag.trim()) return
    await requestAdminJson<{ success: boolean; message: string }>(`/phones/${tagPhoneData.id}/tags`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: newTag.trim() }),
    })
    setTags((prev) => [...prev, newTag.trim().toLowerCase()].sort())
    setNewTag('')
  }

  const removeTag = async (tag: string) => {
    if (!tagPhoneData) return
    await requestAdminJson<{ success: boolean; message: string }>(
      `/phones/${tagPhoneData.id}/tags/${encodeURIComponent(tag)}`,
      { method: 'DELETE' }
    )
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const repopulateSingleImage = async (id: number, name: string) => {
    setRepopSingle(id)
    const beforeHealth = catalogHealth
    try {
      const json = await requestAdminJson<{ success: boolean; message: string }>(
        `/repopulate-image/${id}`,
        { method: 'POST' }
      )
      if (json.success) {
        setRepopMsg(`${name}: ${json.message}`)
        setImageAudit((prev) =>
          prev.map((phone) =>
            phone.id === id
              ? {
                  ...phone,
                  image_url: '/images/phones/placeholder.png',
                  image_status: 'fallback',
                  image_source: 'fallback',
                  image_source_url: null,
                  health_status: 'fallback',
                  local_file_exists: null,
                }
              : phone
          )
        )
        await wait(3000)
        const refreshedHealth = await refreshQualityViews()
        setRepopMsg(
          `${name}: ${json.message}${
            refreshedHealth
              ? ` ${buildPrimaryMovementSummary('repopulate-fallback-images', beforeHealth, refreshedHealth)}`
              : ''
          }`.trim()
        )
      }
    } catch {
      setRepopMsg('Failed to start image repopulation.')
    } finally {
      setRepopSingle(null)
    }
  }

  const localizeSingleImage = async (id: number, name: string) => {
    setLocalizing(id)
    const beforeHealth = catalogHealth
    try {
      const json = await requestAdminJson<{ success: boolean; message: string }>(
        `/localize-image/${id}`,
        { method: 'POST' }
      )

      if (json.success) {
        setRepopMsg(`${name}: ${json.message}`)
        await loadImageAudit()
        await loadCatalogHealth()
      } else {
        setRepopMsg(json.message ?? 'Failed to localize image.')
      }
    } catch {
      setRepopMsg('Failed to localize image.')
    } finally {
      setLocalizing(null)
    }
  }

  const repairSingleMissingLocalImage = async (id: number, name: string) => {
    setRepairingMissingLocal(id)
    const beforeHealth = catalogHealth
    try {
      const json = await requestAdminJson<{ success: boolean; message: string }>(
        `/repair-missing-local-image/${id}`,
        { method: 'POST' }
      )

      if (json.success) {
        const refreshedHealth = await refreshQualityViews()
        setRepopMsg(
          `${name}: ${json.message}${
            refreshedHealth
              ? ` ${buildPrimaryMovementSummary('repair-missing-local-images', beforeHealth, refreshedHealth)}`
              : ''
          }`.trim()
        )
      } else {
        setRepopMsg(json.message ?? 'Failed to repair missing local image.')
      }
    } catch {
      setRepopMsg('Failed to repair missing local image.')
    } finally {
      setRepairingMissingLocal(null)
    }
  }

  const runOperatorDecision = useCallback((decision: CatalogHealthOperatorDecision) => {
    if (decision.recommendation === 'exclude_price_attention') {
      excludePhoneFromPriceAttention({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'delete_legacy_prices') {
      deleteLegacyPricesForPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'deactivate_noncanonical_phone') {
      deactivateNonCanonicalPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'merge_duplicate_phone') {
      openMergeReview(
        {
          id: decision.id,
          name: decision.name,
          suggested_target_id: decision.suggested_target_id ?? null,
          suggested_target_slug: decision.suggested_target_slug ?? null,
        },
        `${decision.name} has another active live row. Merge review is open below${
          decision.suggested_target_slug
            ? ` with ${decision.suggested_target_slug} preselected`
            : ''
        }.`
      )
      return
    }

    if (decision.recommendation === 'repair_canonical_slug') {
      repairCanonicalSlugForPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'resync_seed_authority') {
      resyncSeedAuthorityForPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'backfill_variant_rows') {
      backfillVariantsForPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'repair_unbound_current_prices') {
      repairUnboundCurrentPricesForPhone({
        id: decision.id,
        name: decision.name,
        slug: decision.slug,
        brand_name: decision.brand_name,
        detail: decision.detail,
      })
      return
    }

    if (decision.recommendation === 'localize_image') {
      const imageRow = imageAudit.find((row) => row.id === decision.id)

      if (imageRow?.health_status === 'resolved_external') {
        localizeSingleImage(decision.id, decision.name)
        return
      }

      guideToCatalogueEditor(
        decision.id,
        `${decision.name} needs a stable local image. I opened the manual upload block in Catalogue in case automatic localization is no longer the right fix.`,
        'manual-image-upload'
      )
      return
    }

    if (decision.recommendation === 'repair_missing_local_image') {
      const imageRow = imageAudit.find((row) => row.id === decision.id)

      if (imageRow?.health_status === 'missing_local_file') {
        repairSingleMissingLocalImage(decision.id, decision.name)
        return
      }

      guideToCatalogueEditor(
        decision.id,
        `${decision.name} needs an image repair. I opened the manual upload block in Catalogue so we can fall back quickly if the missing-local-file state has already changed.`,
        'manual-image-upload'
      )
      return
    }

    if (decision.recommendation === 'upload_manual_image') {
      guideToCatalogueEditor(
        decision.id,
        `${decision.name} is ready for a manual local image upload. The uploader is open below so you can pin a stable asset straight away.`,
        'manual-image-upload'
      )
      return
    }

    if (decision.recommendation === 'fix_showcase_priority') {
      guideToCatalogueEditor(
        decision.id,
        `${decision.name} needs an intentional showcase priority. Update the rank and save the controls from Catalogue.`
      )
      return
    }

    guideToCatalogueEditor(
      decision.id,
      `${decision.name} needs a pricing-lane review. Opened the catalogue editor so we can decide whether to keep tracking stores or exclude it intentionally.`
    )
  }, [
    backfillVariantsForPhone,
    deactivateNonCanonicalPhone,
    deleteLegacyPricesForPhone,
    excludePhoneFromPriceAttention,
    guideToCatalogueEditor,
    imageAudit,
    localizeSingleImage,
    openMergeReview,
    repairCanonicalSlugForPhone,
    repairUnboundCurrentPricesForPhone,
    resyncSeedAuthorityForPhone,
    repairSingleMissingLocalImage,
  ])

  const handleRepopulate = async () => {
    if (!confirm('This will reset ALL phone images and re-scrape them. This runs in the background and may take a while. Continue?')) return
    setRepopulating(true)
    setRepopMsg(null)
    try {
      const json = await requestAdminJson<{ success: boolean; message: string }>(
        '/repopulate-images',
        { method: 'POST' }
      )
      setRepopMsg(json.message ?? 'Image repopulation started.')
    } catch {
      setRepopMsg('Failed to start repopulation.')
    } finally {
      setRepopulating(false)
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const matchesCatalogueFilter = (phone: AdminPhone) => {
    switch (catalogueFilter) {
      case 'price-exceptions':
        return phone.is_active && phone.exclude_from_price_attention
      case 'manual-overrides':
        return phone.is_active && Boolean(phone.manual_image_url)
      case 'featured':
        return phone.is_active && phone.is_featured
      default:
        return true
    }
  }

  const filteredByCatalogueFilter = phones.filter(matchesCatalogueFilter)

  const filtered = filteredByCatalogueFilter.filter((phone) => {
    if (normalizedSearch.length === 0) {
      return true
    }

    return (
      phone.name.toLowerCase().includes(normalizedSearch) ||
      phone.slug.toLowerCase().includes(normalizedSearch) ||
      phone.brand_name.toLowerCase().includes(normalizedSearch)
    )
  })

  const imageIssueRows = imageAudit.filter(
    (phone) => phone.health_status !== 'resolved_local'
  )

  const catalogueFilterOptions: Array<{
    key: CatalogueFilter
    label: string
    count: number
  }> = [
    { key: 'all', label: 'All phones', count: phones.length },
    {
      key: 'price-exceptions',
      label: 'Price exceptions',
      count: phones.filter((phone) => phone.is_active && phone.exclude_from_price_attention).length,
    },
    {
      key: 'manual-overrides',
      label: 'Manual overrides',
      count: phones.filter((phone) => phone.is_active && Boolean(phone.manual_image_url)).length,
    },
    {
      key: 'featured',
      label: 'Featured',
      count: phones.filter((phone) => phone.is_active && phone.is_featured).length,
    },
  ]

  const applyCatalogueFilter = (nextFilter: CatalogueFilter) => {
    setCatalogueFilter(nextFilter)
    setSearch('')
  }

  const activeCatalogueFilterLabel =
    catalogueFilterOptions.find((option) => option.key === catalogueFilter)?.label ??
    'All phones'

  const jumpToCatalogue = (phoneName: string) => {
    setSearch(phoneName)
    setTab('catalogue')
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'quality',   label: 'Quality'      },
    { key: 'catalogue', label: 'Catalogue'    },
    { key: 'add',       label: 'Add Phone'    },
    { key: 'tags',      label: 'Manage Tags'  },
    { key: 'images',    label: `Images (${imageIssueRows.length} attention)` },
  ]

  const qualitySummaryCards = [
    {
      label: 'Current price coverage',
      value: `${catalogHealth.summary.phones_with_current_prices}/${catalogHealth.summary.price_tracking_scope_phones || 0}`,
      tone: 'text-text-primary',
      detail: `${catalogHealth.summary.phones_missing_current_prices} phones still need current normalized store offers. ${catalogHealth.summary.price_attention_excluded_phones} phones are intentionally excluded from this lane.`,
    },
    {
      label: 'Variant coverage',
      value: `${catalogHealth.summary.phones_with_variant_rows}/${catalogHealth.summary.active_phones}`,
      tone: 'text-text-primary',
      detail: `${catalogHealth.summary.phones_missing_variant_rows} phones still lack active variants`,
    },
    {
      label: 'Localized images',
      value: `${catalogHealth.summary.localized_images}/${catalogHealth.summary.active_phones}`,
      tone: 'text-green-700',
      detail: `${catalogHealth.summary.remote_only_images} remote-only, ${catalogHealth.summary.image_attention} total image attention cases, and ${imageSummary.manual_overrides} manual overrides in play`,
    },
    {
      label: 'Featured ranked',
      value: `${catalogHealth.summary.featured_phones - catalogHealth.summary.unranked_featured_phones}/${catalogHealth.summary.featured_phones || 0}`,
      tone: 'text-text-primary',
      detail: `${catalogHealth.summary.unranked_featured_phones} featured phones still sit at showcase priority 0`,
    },
    {
      label: 'Stale price checks',
      value: String(catalogHealth.summary.stale_current_price_phones),
      tone: catalogHealth.summary.stale_current_price_phones > 0 ? 'text-amber-700' : 'text-text-primary',
      detail: `Freshest current check older than ${catalogHealth.summary.stale_threshold_hours}h`,
    },
    {
      label: 'Legacy price leftovers',
      value: String(catalogHealth.summary.phones_with_legacy_prices),
      tone: catalogHealth.summary.phones_with_legacy_prices > 0 ? 'text-amber-700' : 'text-text-primary',
      detail: 'Phones that still have valid non-tracked store rows such as old Konga seed prices',
    },
    {
      label: 'Duplicate live models',
      value: String(catalogHealth.summary.duplicate_active_phone_rows),
      tone:
        catalogHealth.summary.duplicate_active_phone_rows > 0
          ? 'text-red-700'
          : 'text-text-primary',
      detail:
        'Active phone rows that should be merged into the canonical model before pricing, variants, images, and SEO split apart',
    },
    {
      label: 'Missing canonical seed phones',
      value: String(catalogHealth.summary.canonical_seed_missing_live_phones),
      tone:
        catalogHealth.summary.canonical_seed_missing_live_phones > 0
          ? 'text-red-700'
          : 'text-text-primary',
      detail:
        'Canonical phones that still exist in the approved seed source but are missing from the active live catalog and should be restored before lower-priority cleanup',
    },
    {
      label: 'Seed authority drift',
      value: String(catalogHealth.summary.seed_authority_drift_phones),
      tone:
        catalogHealth.summary.seed_authority_drift_phones > 0
          ? 'text-amber-700'
          : 'text-text-primary',
      detail:
        'Canonical live phones whose core catalog fields have drifted away from the seed-backed source of truth',
    },
    {
      label: 'Canonical slug mismatches',
      value: String(catalogHealth.summary.canonical_slug_mismatch_phones),
      tone:
        catalogHealth.summary.canonical_slug_mismatch_phones > 0
          ? 'text-amber-700'
          : 'text-text-primary',
      detail:
        'Canonical phones whose live row still uses the wrong slug even though the brand and model already match the approved seed truth',
    },
    {
      label: 'Outside canonical seed',
      value: String(catalogHealth.summary.phones_outside_canonical_seed),
      tone:
        catalogHealth.summary.phones_outside_canonical_seed > 0
          ? 'text-amber-700'
          : 'text-text-primary',
      detail:
        'Active phones still in the live DB even though they are missing from the current canonical seed source',
    },
    {
      label: 'Price exceptions',
      value: String(catalogHealth.summary.price_attention_excluded_phones),
      tone: catalogHealth.summary.price_attention_excluded_phones > 0 ? 'text-sky-700' : 'text-text-primary',
      detail: 'Phones explicitly excluded from automated current-price attention because the live stores are not reliable for them',
    },
    {
      label: 'Unbound current offers',
      value: String(catalogHealth.summary.phones_with_unbound_current_prices),
      tone: catalogHealth.summary.phones_with_unbound_current_prices > 0 ? 'text-red-700' : 'text-text-primary',
      detail: 'Phones whose current offers still lack variant binding',
    },
  ]

  const qualitySections: Array<{
    key: string
    title: string
    description: string
    issues: CatalogHealthIssuePhone[]
    emptyState: string
    onAction?: (issue: CatalogHealthIssuePhone) => void
    actionLabel?: string
    issueAction?: {
      label: string
      busyId?: number | null
      busyLabel?: string
      onClick: (issue: CatalogHealthIssuePhone) => void
      tone?: 'accent' | 'warning'
    }
    secondaryAction?: {
      label: string
      onClick: () => void
    }
  }> = [
    {
      key: 'showcase',
      title: 'Showcase attention',
      description: 'Featured phones should be intentionally ranked, not left to chance.',
      issues: catalogHealth.spotlight.unranked_featured,
      emptyState: 'All featured phones have a real showcase priority right now.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
    },
    {
      key: 'pricing',
      title: 'Price coverage attention',
      description: 'These phones are missing a normalized current offer or have gone stale.',
      issues: [
        ...catalogHealth.spotlight.missing_prices,
        ...catalogHealth.spotlight.stale_prices,
      ],
      emptyState: 'Current store pricing is present and reasonably fresh across the active catalogue.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
      issueAction: {
        label: 'Exclude from pricing lane',
        busyId: excludingPriceLane,
        busyLabel: 'Excluding...',
        onClick: excludePhoneFromPriceAttention,
        tone: 'warning',
      },
    },
    {
      key: 'legacy-prices',
      title: 'Legacy price cleanup',
      description: 'These phones still carry valid price rows from non-tracked stores like old seed-era Konga entries.',
      issues: catalogHealth.spotlight.legacy_prices,
      emptyState: 'No legacy non-tracked price rows are cluttering the active admin price truth right now.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
      issueAction: {
        label: 'Delete legacy prices',
        busyId: deletingLegacyPrices,
        busyLabel: 'Deleting...',
        onClick: deleteLegacyPricesForPhone,
        tone: 'warning',
      },
    },
    {
      key: 'duplicate-models',
      title: 'Duplicate live model review',
      description:
        'These active rows share the same brand and phone name as another live phone. Merge them into the canonical row before they split prices, variants, images, or SEO.',
      issues: catalogHealth.spotlight.duplicate_active_phones,
      emptyState: 'No active duplicate live phones are splitting catalogue truth right now.',
      issueAction: {
        label: 'Open merge review',
        onClick: (issue) => openMergeReview(issue),
        tone: 'warning',
      },
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
    },
    {
      key: 'canonical-slug-mismatch',
      title: 'Canonical slug mismatches',
      description:
        'These phones already belong to the canonical seed source by brand and name, but their live slug still differs and should be repaired before they create false drift or leftover signals.',
      issues: catalogHealth.spotlight.canonical_slug_mismatch,
      emptyState: 'Canonical live phones already use the right seed-backed slugs right now.',
      issueAction: {
        label: 'Repair slug',
        busyId: repairingCanonicalSlug,
        busyLabel: 'Repairing...',
        onClick: repairCanonicalSlugForPhone,
        tone: 'warning',
      },
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
    },
    {
      key: 'seed-authority',
      title: 'Seed authority drift',
      description:
        'These phones still belong to the canonical seed source, but their live core catalog fields no longer match the approved seed-backed truth.',
      issues: catalogHealth.spotlight.seed_authority_drift,
      emptyState: 'Canonical live phones are aligned to the seed-backed core spec truth right now.',
      issueAction: {
        label: 'Resync from seed',
        busyId: resyncingSeedAuthority,
        busyLabel: 'Resyncing...',
        onClick: resyncSeedAuthorityForPhone,
      },
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
    },
    {
      key: 'catalog-drift',
      title: 'Catalog drift review',
      description:
        'These phones are still active in the live DB but no longer map to any canonical seed phone by brand and name. This is now the true leftover/manual-exception lane after canonical slug mismatches are separated out.',
      issues: catalogHealth.spotlight.noncanonical_active,
      emptyState: 'All active phones are accounted for in the current canonical seed source right now.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
      issueAction: {
        label: 'Deactivate if leftover',
        busyId: deactivatingNonCanonicalPhone,
        busyLabel: 'Deactivating...',
        onClick: deactivateNonCanonicalPhone,
        tone: 'warning',
      },
    },
    {
      key: 'missing-variants',
      title: 'Missing variants',
      description: 'These phones are still missing active variant rows, so later price truth has nothing trustworthy to bind onto.',
      issues: catalogHealth.spotlight.missing_variants,
      emptyState: 'Active variant rows are present for the phones that should have them.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
      issueAction: {
        label: 'Backfill default variant',
        busyId: backfillingVariants,
        busyLabel: 'Backfilling...',
        onClick: backfillVariantsForPhone,
      },
    },
    {
      key: 'unbound-current-offers',
      title: 'Unbound current offers',
      description: 'These tracked-store offers are still not attached to a variant, so the current-price lane can drift or pick the wrong truth.',
      issues: catalogHealth.spotlight.unbound_current_prices,
      emptyState: 'Tracked-store current offers are properly variant-bound right now.',
      onAction: (issue) => jumpToCatalogue(issue.name),
      actionLabel: 'Find in catalogue',
      issueAction: {
        label: 'Repair binding',
        busyId: repairingUnboundCurrentPrices,
        busyLabel: 'Repairing...',
        onClick: repairUnboundCurrentPricesForPhone,
        tone: 'warning',
      },
    },
    {
      key: 'images',
      title: 'Image stability attention',
      description: 'Remote-only and fallback images should be localized or repopulated before they become public liabilities.',
      issues: catalogHealth.spotlight.image_attention,
      emptyState: 'Image health is stable; no attention items are blocking the active catalogue.',
      onAction: undefined,
      secondaryAction: {
        label: 'Open images tab',
        onClick: () => setTab('images'),
      },
    },
  ]

  const getOperatorDecisionActionMeta = (
    decision: CatalogHealthOperatorDecision
  ): {
    label: string
    busyLabel?: string
    busy: boolean
    toneClass: string
  } => {
    switch (decision.recommendation) {
      case 'exclude_price_attention':
        return {
          label: 'Exclude from pricing lane',
          busyLabel: 'Excluding...',
          busy: excludingPriceLane === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'delete_legacy_prices':
        return {
          label: 'Delete legacy prices',
          busyLabel: 'Deleting...',
          busy: deletingLegacyPrices === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'merge_duplicate_phone':
        return {
          label: 'Open merge review',
          busy: false,
          toneClass: 'text-orange-700 hover:text-orange-800',
        }
      case 'resync_seed_authority':
        return {
          label: 'Resync from seed',
          busyLabel: 'Resyncing...',
          busy: resyncingSeedAuthority === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'repair_canonical_slug':
        return {
          label: 'Repair slug',
          busyLabel: 'Repairing...',
          busy: repairingCanonicalSlug === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'backfill_variant_rows':
        return {
          label: 'Backfill default variant',
          busyLabel: 'Backfilling...',
          busy: backfillingVariants === decision.id,
          toneClass: 'text-accent hover:text-accent-hover',
        }
      case 'repair_unbound_current_prices':
        return {
          label: 'Repair binding',
          busyLabel: 'Repairing...',
          busy: repairingUnboundCurrentPrices === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'deactivate_noncanonical_phone':
        return {
          label: 'Deactivate if leftover',
          busyLabel: 'Deactivating...',
          busy: deactivatingNonCanonicalPhone === decision.id,
          toneClass: 'text-amber-700 hover:text-amber-800',
        }
      case 'localize_image':
        return {
          label: 'Localize now',
          busyLabel: 'Localizing...',
          busy: localizing === decision.id,
          toneClass: 'text-sky-700 hover:text-sky-800',
        }
      case 'repair_missing_local_image':
        return {
          label: 'Repair image',
          busyLabel: 'Repairing...',
          busy: repairingMissingLocal === decision.id,
          toneClass: 'text-red-700 hover:text-red-800',
        }
      case 'upload_manual_image':
        return {
          label: 'Open uploader',
          busy: false,
          toneClass: 'text-accent hover:text-accent-hover',
        }
      case 'fix_showcase_priority':
        return {
          label: 'Rank showcase',
          busy: false,
          toneClass: 'text-accent hover:text-accent-hover',
        }
      case 'review_price_attention':
      default:
        return {
          label: 'Review pricing lane',
          busy: false,
          toneClass: 'text-accent hover:text-accent-hover',
      }
    }
  }

  const operatorQueueCounts = catalogHealth.operator_queue.reduce<Record<OperatorLaneFilter, number>>(
    (counts, decision) => {
      counts.all += 1
      counts[decision.lane] += 1
      return counts
    },
    { all: 0, catalog: 0, pricing: 0, images: 0, showcase: 0 }
  )

  const operatorLaneOptions = (['all', 'catalog', 'pricing', 'images', 'showcase'] as OperatorLaneFilter[])
    .map((key) => ({
      key,
      label: OPERATOR_LANE_LABELS[key],
      count: operatorQueueCounts[key],
    }))

  const visibleOperatorQueue = catalogHealth.operator_queue.filter((decision) =>
    operatorLaneFilter === 'all' || decision.lane === operatorLaneFilter
  )

  const safeOperatorDecisionCount = visibleOperatorQueue.filter(isSafeOperatorDecision).length
  const manualOperatorDecisionCount = visibleOperatorQueue.length - safeOperatorDecisionCount
  const nextSafeOperatorDecision = visibleOperatorQueue.find(isSafeOperatorDecision) ?? null
  const nextSafeActionMeta = nextSafeOperatorDecision
    ? getOperatorDecisionActionMeta(nextSafeOperatorDecision)
    : null

  const runNextSafeOperatorDecision = useCallback(() => {
    if (!nextSafeOperatorDecision) {
      setQualityMessage({
        type: 'warning',
        text: 'No safe quick fix is available in the current operator lane. The remaining items need a human decision first.',
      })
      return
    }

    runOperatorDecision(nextSafeOperatorDecision)
  }, [nextSafeOperatorDecision, runOperatorDecision])

  const renderQualityBatchAction = (sectionKey: string) => {
    if (sectionKey === 'showcase') {
      const busy = qualityAction === 'normalize-showcase'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'normalize-showcase',
              '/phones/catalog-health/actions/normalize-showcase',
              { method: 'POST' },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Normalizing...' : 'Normalize order'}
        </button>
      )
    }

    if (sectionKey === 'legacy-prices') {
      const busy = qualityAction === 'delete-legacy-prices'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'delete-legacy-prices',
              '/phones/catalog-health/actions/delete-legacy-prices',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.legacyPriceCleanup }),
              },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Deleting...' : 'Delete all shown'}
        </button>
      )
    }

    if (sectionKey === 'pricing') {
      const busy = qualityAction === 'refresh-price-attention'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'refresh-price-attention',
              '/phones/catalog-health/actions/refresh-price-attention',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.priceAttention }),
              },
              'delayed-refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Refreshing...' : 'Refresh attention set'}
        </button>
      )
    }

    if (sectionKey === 'missing-variants') {
      const busy = qualityAction === 'backfill-variants'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'backfill-variants',
              '/phones/catalog-health/actions/backfill-variants',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.variantBackfill }),
              },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Backfilling...' : 'Backfill defaults'}
        </button>
      )
    }

    if (sectionKey === 'unbound-current-offers') {
      const busy = qualityAction === 'repair-unbound-current-prices'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'repair-unbound-current-prices',
              '/phones/catalog-health/actions/repair-unbound-current-prices',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.unboundCurrentPriceRepair }),
              },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Repairing...' : 'Repair all shown'}
        </button>
      )
    }

    if (sectionKey === 'canonical-slug-mismatch') {
      const busy = qualityAction === 'repair-canonical-slugs'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'repair-canonical-slugs',
              '/phones/catalog-health/actions/repair-canonical-slugs',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.canonicalSlugRepair }),
              },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Repairing...' : 'Repair all shown'}
        </button>
      )
    }

    if (sectionKey === 'seed-authority') {
      const busy = qualityAction === 'resync-seed-authority'
      return (
        <button
          onClick={() =>
            runQualityAction(
              'resync-seed-authority',
              '/phones/catalog-health/actions/resync-seed-authority',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: QUALITY_LIMITS.seedAuthority }),
              },
              'refresh'
            )
          }
          disabled={busy}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
        >
          {busy ? 'Resyncing...' : 'Resync all shown'}
        </button>
      )
    }

    if (sectionKey === 'images') {
      const repairingBusy = qualityAction === 'repair-missing-local-images'
      const localizingBusy = qualityAction === 'localize-remote-images'
      const repopulatingBusy = qualityAction === 'repopulate-fallback-images'
      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              runQualityAction(
                'repair-missing-local-images',
                '/phones/catalog-health/actions/repair-missing-local-images',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
                },
                'refresh'
              )
            }
            disabled={repairingBusy}
            className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
          >
            {repairingBusy ? 'Repairing...' : 'Repair missing locals'}
          </button>
          <button
            onClick={() =>
              runQualityAction(
                'repopulate-fallback-images',
                '/phones/catalog-health/actions/repopulate-fallback-images',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
                },
                'refresh'
              )
            }
            disabled={repopulatingBusy}
            className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
          >
            {repopulatingBusy ? 'Repopulating...' : 'Repopulate fallbacks'}
          </button>
          <button
            onClick={() =>
              runQualityAction(
                'localize-remote-images',
                '/phones/catalog-health/actions/localize-remote-images',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ limit: QUALITY_LIMITS.imageAttention }),
                },
                'refresh'
              )
            }
            disabled={localizingBusy}
            className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
          >
            {localizingBusy ? 'Localizing...' : 'Localize remote-only'}
          </button>
        </div>
      )
    }

    return null
  }

  const inputCls = "w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
  const labelCls = "block text-sm font-semibold text-text-primary"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Phones</h1>
        <p className="text-sm text-text-secondary mt-1">
          {loading ? '...' : `${phones.length} phones · ${phones.filter(p => p.is_featured).length} featured`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors duration-fast relative ${tab === key ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {label}
            {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
          </button>
        ))}
      </div>

      {/* ── Catalogue ───────────────────────────────────────────────── */}
      {tab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-md p-6 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-text-primary">Wave 2 catalog quality</h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  This is the operational view for the Wave 2 work we have shipped. It keeps showcase curation,
                  variant truth, image stability, and public pricing trust in one place so we can fix the real
                  blockers quickly instead of chasing scattered symptoms.
                </p>
              </div>
              <button
                onClick={runRecommendedCleanup}
                disabled={qualityAction === 'recommended-cleanup'}
                className="inline-flex h-10 items-center justify-center rounded-sm bg-accent px-4 text-sm font-bold text-white transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {qualityAction === 'recommended-cleanup'
                  ? 'Running cleanup...'
                  : 'Run recommended cleanup'}
              </button>
            </div>

            {qualityMessage ? (
              <div
                className={`rounded-md border px-4 py-3 ${
                  qualityMessage.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : qualityMessage.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <p className="text-sm font-semibold">{qualityMessage.text}</p>
                {qualityMessage.details?.length ? (
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                    {qualityMessage.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {qualitySummaryCards.map((card) => (
                <div key={card.label} className="rounded-md border border-border bg-surfaceHigh px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{card.label}</p>
                  <p className={`mt-2 text-2xl font-black ${card.tone}`}>{card.value}</p>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-md p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">Canonical seed phones missing from live catalog</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  This is the top catalog-authority repair lane. These phones still exist in the approved seed source, but they are missing from the active live catalog and should be restored before we spend time on lower-priority cleanup.
                </p>
              </div>
              <button
                onClick={() =>
                  runQualityAction(
                    'restore-missing-canonical-seed-phones',
                    '/phones/catalog-health/actions/restore-missing-canonical-seed-phones',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ limit: QUALITY_LIMITS.canonicalSeedRestore }),
                    },
                    'refresh'
                  )
                }
                disabled={qualityAction === 'restore-missing-canonical-seed-phones'}
                className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-bold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
              >
                {qualityAction === 'restore-missing-canonical-seed-phones'
                  ? 'Restoring...'
                  : 'Restore all shown'}
              </button>
            </div>

            {catalogHealth.spotlight.canonical_seed_missing_live.length === 0 ? (
              <p className="text-sm text-text-muted">
                Every canonical seed phone already has an active live catalog row right now.
              </p>
            ) : (
              <div className="space-y-2">
                {catalogHealth.spotlight.canonical_seed_missing_live.map((issue) => (
                  <div
                    key={`missing-canonical-seed-${issue.seed_slug}`}
                    className="rounded-md border border-border bg-surfaceHigh/50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary">
                          {issue.name}
                          <span className="ml-2 text-xs font-medium text-text-muted">
                            {issue.brand_name}
                          </span>
                        </p>
                        <p className="text-[11px] font-medium text-text-muted">{issue.seed_slug}</p>
                        <p className="text-xs leading-relaxed text-text-secondary">{issue.detail}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          onClick={() => restoreCanonicalSeedPhone(issue)}
                          disabled={restoringCanonicalSeedSlug === issue.seed_slug}
                          className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-40"
                        >
                          {restoringCanonicalSeedSlug === issue.seed_slug
                            ? 'Restoring...'
                            : issue.restore_strategy === 'reactivate_existing'
                              ? 'Restore inactive row'
                              : 'Restore from seed'}
                        </button>
                        {issue.existing_phone_id ? (
                          <button
                            onClick={() =>
                              guideToCatalogueEditor(
                                issue.existing_phone_id as number,
                                `${issue.name} already has an inactive live row. Catalogue is open so we can inspect it before or after restoring canonical seed truth.`
                              )
                            }
                            className="text-xs font-semibold text-accent hover:underline"
                          >
                            Find existing row
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-md p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-text-primary">Operator decision queue</h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                These are the best next human decisions after cleanup. Each phone now shows only its highest-priority next move, so the queue works like a real list instead of repeating the same phone across several lanes at once.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-border bg-surfaceHigh/40 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {operatorLaneOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setOperatorLaneFilter(option.key)}
                    aria-pressed={operatorLaneFilter === option.key}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-fast ${
                      operatorLaneFilter === option.key
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-text-secondary hover:border-borderHigh hover:text-text-primary'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1 sm:items-end">
                <button
                  type="button"
                  onClick={runNextSafeOperatorDecision}
                  disabled={!nextSafeOperatorDecision || Boolean(qualityAction) || Boolean(nextSafeActionMeta?.busy)}
                  className="inline-flex h-9 items-center justify-center rounded-sm bg-text-primary px-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {nextSafeActionMeta?.busy
                    ? nextSafeActionMeta.busyLabel ?? 'Running...'
                    : nextSafeOperatorDecision
                      ? 'Run next safe quick fix'
                      : 'No safe quick fix'}
                </button>
                <p className="text-[11px] leading-relaxed text-text-muted">
                  {nextSafeOperatorDecision
                    ? `Next safe: ${nextSafeOperatorDecision.name} - ${nextSafeActionMeta?.label ?? 'Quick fix'}`
                    : manualOperatorDecisionCount > 0
                      ? `${manualOperatorDecisionCount} manual-only decision${manualOperatorDecisionCount === 1 ? '' : 's'} in this lane.`
                      : 'No decisions are waiting in this lane.'}
                </p>
              </div>
            </div>

            {catalogHealth.operator_queue.length === 0 ? (
              <p className="text-sm text-text-muted">
                No operator queue items are waiting right now. The remaining Wave 2 lanes are healthy enough that no guided manual decisions are being prioritized.
              </p>
            ) : visibleOperatorQueue.length === 0 ? (
              <p className="text-sm text-text-muted">
                No {OPERATOR_LANE_LABELS[operatorLaneFilter].toLowerCase()} queue items are waiting right now. Switch back to all lanes to keep cleaning.
              </p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {visibleOperatorQueue.map((decision) => {
                  const actionMeta = getOperatorDecisionActionMeta(decision)

                  return (
                    <div
                      key={`${decision.lane}-${decision.id}-${decision.recommendation}`}
                      className="rounded-md border border-border bg-surfaceHigh/50 px-4 py-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">{decision.name}</span>
                            <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                              {decision.lane}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-text-muted">{decision.brand_name}</p>
                          <p className="text-[11px] font-medium text-text-muted">{decision.slug}</p>
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                          Priority {decision.priority}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed text-text-secondary">{decision.detail}</p>
                      {decision.additional_issue_count ? (
                        <p className="text-[11px] leading-relaxed text-text-muted">
                          This phone is also showing up in {decision.additional_issue_count} other cleanup lane{decision.additional_issue_count === 1 ? '' : 's'} right now
                          {decision.additional_lanes?.length
                            ? ` (${decision.additional_lanes.join(', ')})`
                            : ''}.
                          Finish this higher-priority step first, then refresh will promote the next remaining issue if one still matters.
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => runOperatorDecision(decision)}
                          disabled={actionMeta.busy}
                          className={`text-xs font-semibold transition-colors duration-fast disabled:opacity-40 ${actionMeta.toneClass}`}
                        >
                          {actionMeta.busy && actionMeta.busyLabel
                            ? actionMeta.busyLabel
                            : actionMeta.label}
                        </button>
                        {decision.recommendation !== 'upload_manual_image' &&
                        decision.recommendation !== 'fix_showcase_priority' &&
                        decision.recommendation !== 'review_price_attention' ? (
                          <button
                            onClick={() =>
                              guideToCatalogueEditor(
                                decision.id,
                                `${decision.name} is open in Catalogue so we can make a more deliberate operator decision if the quick action is not enough.`
                              )
                            }
                            className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                          >
                            Open in catalogue
                          </button>
                        ) : null}
                        <Link
                          href={`/phones/${decision.slug}`}
                          target="_blank"
                          className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                        >
                          View phone →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {qualitySections.map((section) => (
              <div key={section.key} className="bg-surface border border-border rounded-md p-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-text-primary">{section.title}</h3>
                    <p className="text-sm leading-relaxed text-text-secondary">{section.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {renderQualityBatchAction(section.key)}
                    {section.secondaryAction ? (
                      <button
                        onClick={section.secondaryAction.onClick}
                        className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-xs font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                      >
                        {section.secondaryAction.label}
                      </button>
                    ) : null}
                  </div>
                </div>

                {section.issues.length === 0 ? (
                  <p className="text-sm text-text-muted">{section.emptyState}</p>
                ) : (
                  <div className="space-y-2">
                    {section.issues.map((issue) => (
                      <div
                        key={`${section.key}-${issue.id}-${issue.slug}`}
                        className="rounded-md border border-border bg-surfaceHigh/50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-text-primary">
                              {issue.name}
                              <span className="ml-2 text-xs font-medium text-text-muted">
                                {issue.brand_name}
                              </span>
                            </p>
                            <p className="text-[11px] font-medium text-text-muted">{issue.slug}</p>
                            <p className="text-xs leading-relaxed text-text-secondary">{issue.detail}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {section.issueAction ? (
                              <button
                                onClick={() => section.issueAction?.onClick(issue)}
                                disabled={section.issueAction.busyId === issue.id}
                                className={`text-xs font-semibold hover:underline disabled:opacity-40 ${
                                  section.issueAction.tone === 'warning'
                                    ? 'text-amber-700'
                                    : 'text-accent'
                                }`}
                              >
                                {section.issueAction.busyId === issue.id
                                  ? section.issueAction.busyLabel ?? 'Working...'
                                  : section.issueAction.label}
                              </button>
                            ) : null}
                            {section.onAction ? (
                              <button
                                onClick={() => section.onAction?.(issue)}
                                className="text-xs font-semibold text-accent hover:underline"
                              >
                                {section.actionLabel ?? 'Open'}
                              </button>
                            ) : null}
                            {section.secondaryAction ? (
                              null
                            ) : null}
                            <Link
                              href={`/phones/${issue.slug}`}
                              target="_blank"
                              className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'catalogue' && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phones..."
                className="w-full max-w-sm px-3 py-2 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              {search.trim().length > 0 ? (
                <button
                  onClick={() => setSearch('')}
                  className="inline-flex h-9 items-center justify-center rounded-sm border border-border px-3 text-xs font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                >
                  Clear search
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {catalogueFilterOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => applyCatalogueFilter(option.key)}
                  className={`inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition-colors duration-fast ${
                    catalogueFilter === option.key
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-secondary hover:border-borderHigh hover:text-text-primary'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-muted">
                Showing {filtered.length} of {filteredByCatalogueFilter.length} phones in the current {activeCatalogueFilterLabel.toLowerCase()} view.
              </p>
              {search.trim().length > 0 ? (
                <p className="text-xs text-text-muted">
                  Search "{search.trim()}" is still narrowing this lane. Clear it to see all {filteredByCatalogueFilter.length} phone{filteredByCatalogueFilter.length === 1 ? '' : 's'} in {activeCatalogueFilterLabel.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-surface border border-border rounded-md animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {operatorMessage ? (
                <div className={`rounded-md border px-4 py-3 text-sm font-medium ${
                  operatorMessage.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}>
                  {operatorMessage.text}
                </div>
              ) : null}
              <div className="bg-surfaceHigh/60 border border-border rounded-md px-4 py-3 text-sm text-text-secondary">
                Higher <span className="font-semibold text-text-primary">showcase priority</span> wins on homepage and other starter surfaces, but only while the phone is still marked featured.
              </div>
              {editing !== null ? (
                <div className="rounded-md border border-border bg-surface p-4 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold text-text-primary">Operator controls</h3>
                      <p className="text-sm text-text-secondary">
                        Use this lane to mark a phone as unsupported on the current live stores or to set a manual image when automation keeps finding accessories instead of the actual device.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => saveEdit(editing)}
                        className="inline-flex h-10 items-center justify-center rounded-sm bg-accent px-4 text-sm font-bold text-white transition-opacity duration-fast hover:opacity-90"
                      >
                        Save controls
                      </button>
                      <button
                        onClick={cancelEditingPhone}
                        className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-4 text-sm font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className={labelCls}>Price Tracking Exception</label>
                        <label className="flex items-start gap-3 rounded-md border border-border bg-surfaceHigh/50 px-3 py-3 text-sm text-text-secondary">
                          <input
                            type="checkbox"
                            checked={editExcludeFromPriceLane}
                            onChange={(e) => setEditExcludeFromPriceLane(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>
                            Exclude this phone from automated missing/stale current-price attention when Jumia and Slot do not reliably carry it.
                          </span>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Price Exception Note</label>
                        <textarea
                          value={editPriceAttentionNote}
                          onChange={(e) => setEditPriceAttentionNote(e.target.value)}
                          placeholder="Why this phone should be excluded from automated current-price attention..."
                          rows={3}
                          className={inputCls}
                        />
                      </div>
                      <div className="rounded-md border border-border bg-surfaceHigh/50 px-3 py-3 space-y-3">
                        <div className="space-y-1">
                          <label className={labelCls}>Scraper Search Aliases</label>
                          <p className="text-xs leading-relaxed text-text-muted">
                            Keep the canonical phone name seed-clean. Add retailer wording differences
                            here instead, one alias per line, so price and image scraping can retry
                            terms like <code>S26 Ultra</code> without renaming the actual phone row.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>Shared Aliases</label>
                          <textarea
                            value={editSharedSearchAliases}
                            onChange={(e) => setEditSharedSearchAliases(e.target.value)}
                            placeholder={'itel s26 ultra\ns26 ultra'}
                            rows={3}
                            className={inputCls}
                          />
                          <p className="text-xs text-text-muted">
                            Used by both price scraping and image repopulation.
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className={labelCls}>Price-only Aliases</label>
                            <textarea
                              value={editPriceSearchAliases}
                              onChange={(e) => setEditPriceSearchAliases(e.target.value)}
                              placeholder={'galaxy a15 6gb\niphone 15 128gb'}
                              rows={3}
                              className={inputCls}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className={labelCls}>Image-only Aliases</label>
                            <textarea
                              value={editImageSearchAliases}
                              onChange={(e) => setEditImageSearchAliases(e.target.value)}
                              placeholder={'spark 20 pro plus\nnote 50 pro 5g'}
                              rows={3}
                              className={inputCls}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className={labelCls}>Manual Image Override URL</label>
                        <input
                          value={editManualImageUrl}
                          onChange={(e) => setEditManualImageUrl(e.target.value)}
                          placeholder="/images/phones/example.png or https://..."
                          className={inputCls}
                        />
                        <p className="text-xs text-text-muted">
                          Use a root-relative public asset like <code>/images/phones/...</code> for stable local images, or a full <code>https://</code> URL as an interim manual override.
                        </p>
                      </div>
                      <div
                        ref={manualImageUploadSectionRef}
                        className={`rounded-md border px-3 py-3 space-y-3 transition-colors duration-300 ${
                          highlightedManualImagePhoneId === editing
                            ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                            : 'border-border bg-surfaceHigh/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <label className={labelCls}>Upload Local Image</label>
                          {highlightedManualImagePhoneId === editing ? (
                            <p className="text-xs font-semibold text-accent">
                              Operator shortcut: this is the upload block for the current image cleanup.
                            </p>
                          ) : null}
                          <input
                            ref={manualImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleManualImageFileSelection}
                            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                          />
                          <p className="text-xs text-text-muted">
                            Long-term fix: upload a JPG, PNG, or WEBP image here and Decide will store it in <code>public/images/phones</code> and fill the manual override automatically.
                          </p>
                          {manualImageUploadFile ? (
                            <p className="text-xs font-medium text-text-secondary">
                              Ready to upload: {manualImageUploadFile.name}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => uploadManualImageForPhone(editing)}
                            disabled={!manualImageUploadFile || uploadingManualImage}
                            className="inline-flex h-9 items-center justify-center rounded-sm bg-accent px-3 text-xs font-bold text-white transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {uploadingManualImage ? 'Uploading...' : 'Upload image'}
                          </button>
                          {manualImageUploadFile ? (
                            <button
                              type="button"
                              onClick={resetManualImageUploadState}
                              disabled={uploadingManualImage}
                              className="inline-flex h-9 items-center justify-center rounded-sm border border-border px-3 text-xs font-semibold text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary disabled:opacity-50"
                            >
                              Clear selection
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Manual Image Note</label>
                        <textarea
                          value={editManualImageNote}
                          onChange={(e) => setEditManualImageNote(e.target.value)}
                          placeholder="Context for the manual image choice..."
                          rows={3}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surfaceHigh">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Brand</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Featured</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Showcase</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((phone, i) => {
                    const isMergedRow = isMergedAdminPhone(phone)
                    const isEditing = editing === phone.id
                    const mergeCandidates = isMergedRow ? [] : getLikelyMergeTargets(phone)
                    const isMergeExpanded = mergeSourceId === phone.id

                    return (
                      <React.Fragment key={phone.id}>
                    <tr className={`border-b border-border ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'} ${isEditing ? 'border-b-0' : 'last:border-0'}`}>
                      <td className="px-4 py-3">
                        {editing === phone.id ? (
                          <div className="flex items-center gap-2">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 text-sm border border-accent rounded-sm focus:outline-none" autoFocus />
                            <button onClick={() => saveEdit(phone.id)} className="text-xs text-accent font-bold">Save</button>
                            <button onClick={cancelEditingPhone} className="text-xs text-text-muted">Cancel</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-semibold text-text-primary">{phone.name}</p>
                            <p className="text-xs text-text-muted">{phone.slug}</p>
                            <div className="flex flex-wrap items-center gap-2">
                              {!phone.is_active ? (
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                  Inactive
                                </span>
                              ) : null}
                              {isMergedRow ? (
                                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                                  Merged history
                                </span>
                              ) : null}
                              {phone.exclude_from_price_attention ? (
                                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                  Price attention excluded
                                </span>
                              ) : null}
                              {phone.manual_image_url ? (
                                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  Manual image override
                                </span>
                              ) : null}
                              {phone.search_aliases.length > 0 ? (
                                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                  {phone.search_aliases.length} scraper alias{phone.search_aliases.length === 1 ? '' : 'es'}
                                </span>
                              ) : null}
                            </div>
                            {phone.price_attention_note ? (
                              <p className="text-xs text-text-muted">Pricing note: {phone.price_attention_note}</p>
                            ) : null}
                            {phone.manual_image_note ? (
                              <p className="text-xs text-text-muted">Image note: {phone.manual_image_note}</p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-text-secondary">{phone.brand_name}</span></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(phone.id, phone.is_featured)}
                          className={`text-xs font-semibold transition-all ${phone.is_featured ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                          title={phone.is_featured ? 'Remove featured' : 'Mark featured'}
                        >
                          {phone.is_featured ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {editing === phone.id ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-accent rounded-sm focus:outline-none"
                          />
                        ) : (
                          <span className="inline-flex min-w-12 justify-center rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary">
                            {phone.showcase_priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => startEditingPhone(phone)}
                            className="text-xs text-accent font-semibold hover:underline"
                          >
                            Edit
                          </button>
                          {mergeCandidates.length > 0 ? (
                            <button
                              onClick={() => beginMergePhone(phone)}
                              disabled={mergingPhoneId === phone.id}
                              className="text-xs font-semibold text-orange-700 hover:underline disabled:opacity-40"
                            >
                              {mergingPhoneId === phone.id ? 'Merging...' : 'Merge'}
                            </button>
                          ) : null}
                          {phone.exclude_from_price_attention && phone.is_active ? (
                            <button
                              onClick={() => rejoinPhoneToPriceAttention(phone)}
                              disabled={rejoiningPriceLane === phone.id}
                              className="text-xs font-semibold text-sky-700 hover:underline disabled:opacity-40"
                            >
                              {rejoiningPriceLane === phone.id ? 'Rejoining...' : 'Rejoin pricing lane'}
                            </button>
                          ) : null}
                          {phone.manual_image_url ? (
                            <button
                              onClick={() => clearManualImageOverride(phone)}
                              disabled={clearingManualImage === phone.id}
                              className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-40"
                            >
                              {clearingManualImage === phone.id ? 'Clearing...' : 'Clear override'}
                            </button>
                          ) : null}
                          <button
                            onClick={() => repopulateSingleImage(phone.id, phone.name)}
                            disabled={repopSingle === phone.id}
                            className="text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
                            title="Repopulate image"
                          >
                            {repopSingle === phone.id ? '...' : 'Image'}
                          </button>
                          <Link href={`/phones/${phone.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-secondary">View -&gt;</Link>
                        </div>
                        {isMergeExpanded ? (
                          <div className="mt-3 space-y-2 rounded-md border border-orange-200 bg-orange-50/70 p-3">
                            <p className="text-xs font-semibold text-orange-900">
                              Merge this row into the canonical phone you want to keep.
                            </p>
                            <select
                              value={mergeTargetId}
                              onChange={(e) => setMergeTargetId(e.target.value)}
                              className="w-full rounded-sm border border-orange-200 bg-white px-2 py-2 text-xs text-text-primary"
                            >
                              {mergeCandidates.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.name} · {candidate.slug} · {candidate.is_active ? 'active' : 'inactive'}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => mergePhone(phone)}
                                disabled={!mergeTargetId || mergingPhoneId === phone.id}
                                className="rounded-sm bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                              >
                                {mergingPhoneId === phone.id ? 'Merging...' : 'Confirm merge'}
                              </button>
                              <button
                                onClick={cancelMergePhone}
                                disabled={mergingPhoneId === phone.id}
                                className="text-xs font-semibold text-text-muted hover:text-text-primary disabled:opacity-40"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Phone ───────────────────────────────────────────────── */}
      {tab === 'add' && (
        <div className="bg-surface border border-border rounded-md p-6 space-y-5">
          <h2 className="text-base font-bold text-text-primary">Add New Phone</h2>
          <form onSubmit={handleAddPhone} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Brand *</label>
                <select value={form.brand_id} onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))} required className={inputCls}>
                  <option value="">Select brand</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Phone name *</label>
                <input value={form.name} onChange={(e) => handleFormNameChange(e.target.value)} required placeholder="e.g. Samsung Galaxy S27" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Slug *</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required placeholder="e.g. samsung-galaxy-s27" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>OS Type *</label>
                <select value={form.os_type} onChange={(e) => setForm((f) => ({ ...f, os_type: e.target.value }))} className={inputCls}>
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Released year</label>
                <input type="number" value={form.released_year} onChange={(e) => setForm((f) => ({ ...f, released_year: e.target.value }))} placeholder="2025" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Display size (inches)</label>
                <input type="number" step="0.1" value={form.display_size_inches} onChange={(e) => setForm((f) => ({ ...f, display_size_inches: e.target.value }))} placeholder="6.7" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>RAM (GB)</label>
                <input type="number" value={form.ram_gb} onChange={(e) => setForm((f) => ({ ...f, ram_gb: e.target.value }))} placeholder="8" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Storage (GB)</label>
                <input type="number" value={form.storage_gb} onChange={(e) => setForm((f) => ({ ...f, storage_gb: e.target.value }))} placeholder="256" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Battery (mAh)</label>
                <input type="number" value={form.battery_mah} onChange={(e) => setForm((f) => ({ ...f, battery_mah: e.target.value }))} placeholder="5000" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Main camera (MP)</label>
                <input type="number" value={form.main_camera_mp} onChange={(e) => setForm((f) => ({ ...f, main_camera_mp: e.target.value }))} placeholder="200" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Chipset</label>
                <input value={form.chipset} onChange={(e) => setForm((f) => ({ ...f, chipset: e.target.value }))} placeholder="Snapdragon 8 Elite" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Gray market risk</label>
                <select value={form.gray_market_risk} onChange={(e) => setForm((f) => ({ ...f, gray_market_risk: e.target.value }))} className={inputCls}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Showcase priority</label>
                <input
                  type="number"
                  min="0"
                  value={form.showcase_priority}
                  onChange={(e) => setForm((f) => ({ ...f, showcase_priority: e.target.value }))}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Scores */}
            <div>
              <p className={`${labelCls} mb-3`}>Decide Scores (1–10)</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['battery','camera','performance','build','value'] as const).map((s) => (
                  <div key={s} className="space-y-1">
                    <label className="block text-xs font-semibold text-text-muted capitalize">{s}</label>
                    <input
                      type="number" min="1" max="10"
                      value={form[`score_${s}` as keyof typeof form] as string}
                      onChange={(e) => setForm((f) => ({ ...f, [`score_${s}`]: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
                <input type="checkbox" checked={form.has_5g} onChange={(e) => setForm((f) => ({ ...f, has_5g: e.target.checked }))} className="w-4 h-4 accent-accent" />
                Has 5G
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
                <input type="checkbox" checked={form.has_nfc} onChange={(e) => setForm((f) => ({ ...f, has_nfc: e.target.checked }))} className="w-4 h-4 accent-accent" />
                Has NFC
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 accent-accent"
                />
                Feature on showcase
              </label>
            </div>

            {addMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded border ${addMsg.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-error bg-red-50 border-red-200'}`}>
                {addMsg.text}
              </p>
            )}
            <button type="submit" disabled={adding} className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50">
              {adding ? 'Adding...' : 'Add Phone'}
            </button>
          </form>
        </div>
      )}

      {/* ── Tags ────────────────────────────────────────────────────── */}
      {tab === 'tags' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-md p-6 space-y-4">
            <h2 className="text-base font-bold text-text-primary">Manage Phone Tags</h2>
            <p className="text-sm text-text-secondary">Tags drive search and recommendations. Enter the exact phone name to manage its tags.</p>
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-md space-y-1.5">
                <label className={labelCls}>Phone name</label>
                <input
                  value={tagPhone}
                  onChange={(e) => setTagPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadTags(tagPhone)}
                  placeholder="e.g. Samsung Galaxy S26"
                  className={inputCls}
                />
              </div>
              <button
                onClick={() => loadTags(tagPhone)}
                disabled={tagLoading || !tagPhone.trim()}
                className="h-10 px-4 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary disabled:opacity-50"
              >
                {tagLoading ? 'Loading...' : 'Load tags'}
              </button>
            </div>
            {tagMsg && <p className="text-sm text-error">{tagMsg}</p>}
          </div>

          {tagPhoneData && (
            <div className="bg-surface border border-border rounded-md p-6 space-y-4">
              <p className="text-sm font-bold text-text-primary">{tagPhoneData.name}</p>

              {/* Current tags */}
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-text-muted">No tags yet.</p>
                ) : (
                  tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surfaceHigh border border-border rounded-sm text-xs font-medium text-text-secondary">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-text-muted hover:text-error transition-colors">✕</button>
                    </span>
                  ))
                )}
              </div>

              {/* Add tag */}
              <div className="flex items-center gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tag (e.g. flagship, 5g, camera-beast)"
                  className="flex-1 max-w-xs px-3 py-2 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="h-9 px-4 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Images ──────────────────────────────────────────────────── */}
      {tab === 'images' && (
        <div className="space-y-6">
          {/* Repopulate button */}
          <div className="bg-surface border border-border rounded-md p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">Image Health</h2>
              <p className="text-sm text-text-secondary mt-1">
                Track which phones are safely localized, which ones still depend on remote sources,
                and which ones need a real retry. Local images are the stable target.
              </p>
            </div>
            {repopMsg && (
              <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                {repopMsg}
              </p>
            )}
            {operatorMessage ? (
              <p className={`text-sm font-medium rounded px-3 py-2 border ${
                operatorMessage.type === 'success'
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-red-700 bg-red-50 border-red-200'
              }`}>
                {operatorMessage.text}
              </p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              <div className="rounded-md border border-border bg-surfaceHigh px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Active phones</p>
                <p className="mt-2 text-2xl font-black text-text-primary">{imageSummary.total_active}</p>
              </div>
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">Localized</p>
                <p className="mt-2 text-2xl font-black text-green-700">{imageSummary.resolved_local}</p>
              </div>
              <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Remote only</p>
                <p className="mt-2 text-2xl font-black text-sky-700">{imageSummary.resolved_external}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Fallback / missing</p>
                <p className="mt-2 text-2xl font-black text-amber-700">
                  {imageSummary.fallback + imageSummary.missing}
                </p>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-red-700">Missing local file</p>
                <p className="mt-2 text-2xl font-black text-red-700">{imageSummary.missing_local_file}</p>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Manual overrides</p>
                <p className="mt-2 text-2xl font-black text-amber-700">{imageSummary.manual_overrides}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleRepopulate}
                disabled={repopulating}
                className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
              >
                {repopulating ? 'Starting...' : 'Repopulate All Images'}
              </button>
              <button
                onClick={() => loadImageAudit()}
                className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast"
              >
                Refresh audit
              </button>
            </div>
          </div>

          {/* Issues list */}
          <div className="bg-surfaceHigh/60 border border-border rounded-md px-4 py-3 text-sm text-text-secondary">
            {imageIssueRows.length === 0
              ? 'All active phones are on stable localized images right now.'
              : `${imageIssueRows.length} phone${imageIssueRows.length !== 1 ? 's' : ''} still need attention. Repair broken local paths first, localize remote images when possible, repopulate anything that is fallback or missing, and use a manual override when automation keeps returning accessories instead of the phone. The source column now shows whether repopulate has trusted live store pages to retry from, or only lower-confidence search discovery.`}
          </div>

          {imageIssueRows.length > 0 && (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surfaceHigh">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Health</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {imageIssueRows.map((phone, i) => (
                    <tr key={phone.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md border border-border overflow-hidden bg-surfaceHigh shrink-0">
                            {phone.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={phone.image_url}
                                alt={phone.name}
                                className="w-full h-full object-contain"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{phone.name}</p>
                            <p className="text-xs text-text-muted">{phone.slug}</p>
                            {phone.manual_override ? (
                              <p className="mt-1 text-[11px] font-semibold text-amber-700">Manual override active</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full ${
                              phone.health_status === 'resolved_external'
                                ? 'bg-sky-50 text-sky-700'
                                : phone.health_status === 'missing_local_file'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {phone.health_status === 'resolved_external'
                              ? 'Remote only'
                              : phone.health_status === 'missing_local_file'
                                ? 'Local file missing'
                                : phone.health_status === 'fallback'
                                  ? 'Fallback'
                                  : 'Missing'}
                          </span>
                          <p className="text-xs text-text-muted">
                            DB status: {phone.image_status ?? 'none'}
                          </p>
                          {phone.manual_image_note ? (
                            <p className="text-xs text-text-muted">Note: {phone.manual_image_note}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text-primary capitalize">
                            {phone.manual_override ? 'manual override' : phone.image_source ?? 'none'}
                          </p>
                          <p
                            className={`text-[11px] font-semibold ${
                              phone.repopulate_strategy === 'trusted_store_urls'
                                ? 'text-sky-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {getImageRecoveryModeLabel(phone)}
                          </p>
                          {phone.image_source_url ? (
                            <div className="space-y-1">
                              <p className="text-xs text-text-muted truncate max-w-xs">
                                {phone.image_source_url}
                              </p>
                              <a
                                href={phone.image_source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-semibold text-accent hover:underline"
                              >
                                Open source page -&gt;
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted">
                              {phone.image_url ?? 'No image URL yet'}
                            </p>
                          )}
                          <p className="text-[11px] leading-relaxed text-text-muted">
                            {getImageRecoveryModeDetail(phone)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {phone.health_status === 'missing_local_file' ? (
                            <button
                              onClick={() => repairSingleMissingLocalImage(phone.id, phone.name)}
                              disabled={repairingMissingLocal === phone.id}
                              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
                            >
                              {repairingMissingLocal === phone.id ? 'Repairing...' : 'Repair'}
                            </button>
                          ) : null}
                          {phone.health_status === 'resolved_external' ? (
                            <button
                              onClick={() => localizeSingleImage(phone.id, phone.name)}
                              disabled={localizing === phone.id}
                              className="text-xs font-semibold text-sky-700 hover:underline disabled:opacity-40"
                            >
                              {localizing === phone.id ? 'Localizing...' : 'Localize'}
                            </button>
                          ) : null}
                          {phone.health_status === 'resolved_external' && phone.image_url && !phone.manual_override ? (
                            <button
                              onClick={() => pinCurrentImageAsManualOverride(phone)}
                              disabled={pinningManualImage === phone.id}
                              className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-40"
                            >
                              {pinningManualImage === phone.id ? 'Pinning...' : 'Pin current image'}
                            </button>
                          ) : null}
                          <button
                            onClick={() => repopulateSingleImage(phone.id, phone.name)}
                            disabled={repopSingle === phone.id}
                            className="text-xs font-semibold text-accent hover:underline disabled:opacity-40"
                          >
                            {repopSingle === phone.id ? 'Starting...' : 'Repopulate'}
                          </button>
                          <button
                            onClick={() => openCatalogueEditor(phone.id)}
                            className="text-xs font-semibold text-amber-700 hover:underline"
                          >
                            {phone.manual_override ? 'Edit override' : 'Override manually'}
                          </button>
                          <Link href={`/phones/${phone.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-secondary">View -&gt;</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
