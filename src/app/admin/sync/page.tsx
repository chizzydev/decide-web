'use client'

// decide-web/src/app/admin/sync/page.tsx

import React, { useEffect, useMemo, useState } from 'react'
import { requestAdminJson } from '@/lib/adminApi'

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`

const formatMarketplaceAttemptAge = (attemptedAt: string | null) => {
  if (!attemptedAt) {
    return 'Queued first because it has not been tried yet.'
  }

  const parsed = Date.parse(attemptedAt)
  if (!Number.isFinite(parsed)) {
    return 'Last Jiji sync attempt recorded earlier.'
  }

  const diffMs = Math.max(0, Date.now() - parsed)
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) {
    return 'Last tried just now.'
  }

  if (minutes < 60) {
    return `Last tried ${minutes}m ago.`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `Last tried ${hours}h ago.`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `Last tried ${days}d ago.`
  }

  return `Last tried on ${new Date(parsed).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  })}.`
}

type TestResult = {
  phone_name?: string
  jumia?: { price_ngn?: number; url?: string | null; error?: string } | null
  slot?: { price_ngn?: number; url?: string | null; error?: string } | null
}

type SaveResult = {
  phone_id: number
  phone_name: string
  message: string
  saved: {
    store: string
    price_ngn: number
    url: string | null
    variant_id: number | null
    variant_label: string | null
  }[]
  errors: { store: string; error: string }[]
}

type PriceRow = {
  id: string
  store: string
  price_ngn: number
  url: string | null
  in_stock: boolean
  is_valid: boolean
  scraped_at: string
  variant_id: number | null
  variant_label: string | null
  variant_ram_gb: number | null
  variant_storage_gb: number | null
  is_tracked_store: boolean
}

type PhoneWithPrices = {
  phone: { id: number; name: string }
  prices: PriceRow[]
  tracked_prices: PriceRow[]
  legacy_prices: PriceRow[]
  summary: {
    total_rows: number
    tracked_rows: number
    legacy_rows: number
    tracked_stores: string[]
    legacy_stores: string[]
  }
}

type MarketplaceOffer = {
  id: number
  phone_id: number
  variant_id: number | null
  source: 'jiji'
  listing_title: string
  price_ngn: number
  url: string
  location: string | null
  condition_label: string | null
  seller_type: string | null
  confidence_score: number
  trust_label: string
  is_active: boolean
  scraped_at: string
}

type MarketplaceTestResult = {
  success: boolean
  source: 'jiji'
  phone?: {
    id: number
    name: string
    slug?: string
    brand_name?: string
  } | null
  found?: number
  offers: MarketplaceOffer[]
  message?: string
}

type MarketplaceSyncResult = {
  success: boolean
  phone_id: number
  phone_name: string
  source: 'jiji'
  saved: MarketplaceOffer[]
  message?: string
}

type MarketplaceSavedResult = {
  success: boolean
  phone_id: number
  phone_name: string | null
  source: 'jiji'
  count: number
  offers: MarketplaceOffer[]
  message?: string
}

type MarketplaceCandidate = {
  id: number
  name: string
  slug: string
  brand_name: string
  brand_slug: string
  trusted_store_count: number
  has_jumia: boolean
  has_slot: boolean
  lowest_trusted_price: number | null
  marketplace_signal_count: number
  last_marketplace_sync_at: string | null
  last_marketplace_sync_status: 'success' | 'error' | null
  last_marketplace_sync_saved_count: number | null
}

type MarketplaceCandidatesResponse = {
  success: boolean
  scope: 'missing_trusted_prices' | 'all'
  count: number
  data: MarketplaceCandidate[]
  message?: string
}

type MarketplaceBatchSyncRow = {
  phone_id: number
  phone_name: string | null
  status: 'synced' | 'not_found' | 'error'
  saved_count: number
  message: string
}

type MarketplaceBatchSyncResult = {
  success: boolean
  requested: number
  processed: number
  saved_total: number
  results: MarketplaceBatchSyncRow[]
  message?: string
}

type Brand = { id: number; name: string; slug: string }

type SlugAuditIssue =
  | 'missing_slug'
  | 'duplicate_slug'
  | 'alias_slug'
  | 'slug_used_by_other_expected_name'
  | 'exact_mismatch'

type SlugAuditRow = {
  id: number
  name: string
  slug: string | null
  canonicalExpectedSlug: string
  acceptableSlugs: string[]
  issue: SlugAuditIssue
}

type SlugAuditSummary = Record<SlugAuditIssue, number>

type SlugFixUpdatedRow =
  | {
      type: 'direct_update'
      id: number
      name: string
      from: string | null
      to: string
      issue: 'missing_slug' | 'slug_used_by_other_expected_name' | 'exact_mismatch'
    }
  | {
      type: 'swap'
      first: { id: number; name: string; from: string; to: string }
      second: { id: number; name: string; from: string; to: string }
      issue: 'slug_used_by_other_expected_name'
    }

type SlugFixSkippedRow = {
  id: number
  name: string
  slug: string | null
  canonicalExpectedSlug: string
  issue: SlugAuditIssue
  reason: string
}

type SlugAuditResponse = {
  success: boolean
  data?: SlugAuditRow[]
  summary?: SlugAuditSummary
  total?: number
  message?: string
}

type SlugFixResponse = {
  success: boolean
  updated?: SlugFixUpdatedRow[]
  skipped?: SlugFixSkippedRow[]
  summary?: {
    updated: number
    skipped: number
  }
  dry_run?: boolean
  message?: string
}

const EMPTY_SLUG_SUMMARY: SlugAuditSummary = {
  missing_slug: 0,
  duplicate_slug: 0,
  alias_slug: 0,
  slug_used_by_other_expected_name: 0,
  exact_mismatch: 0,
}

const groupPricesByStore = (rows: PriceRow[]) =>
  rows.reduce<Record<string, PriceRow[]>>((acc, price) => {
    if (!acc[price.store]) acc[price.store] = []
    acc[price.store].push(price)
    return acc
  }, {})

export default function AdminSyncPage() {
  // ── Full sync ────────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  // ── Scraper tool ─────────────────────────────────────────────────────────
  const [testName, setTestName] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [marketplaceLoading, setMarketplaceLoading] =
    useState<'test' | 'sync' | 'load' | null>(null)
  const [marketplaceResult, setMarketplaceResult] = useState<
    MarketplaceTestResult | MarketplaceSyncResult | MarketplaceSavedResult | null
  >(null)
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null)
  const [marketplaceQueueScope, setMarketplaceQueueScope] =
    useState<'missing_trusted_prices' | 'all'>('missing_trusted_prices')
  const [marketplaceQueueBrand, setMarketplaceQueueBrand] = useState('')
  const [marketplaceQueueSearch, setMarketplaceQueueSearch] = useState('')
  const [marketplaceQueueLoading, setMarketplaceQueueLoading] = useState(false)
  const [marketplaceQueueSyncing, setMarketplaceQueueSyncing] = useState(false)
  const [marketplaceCatalogSyncing, setMarketplaceCatalogSyncing] = useState(false)
  const [marketplaceRowSyncingId, setMarketplaceRowSyncingId] = useState<number | null>(null)
  const [marketplaceCandidates, setMarketplaceCandidates] = useState<MarketplaceCandidate[]>([])
  const [marketplaceQueueMessage, setMarketplaceQueueMessage] = useState<string | null>(null)
  const [marketplaceBatchResult, setMarketplaceBatchResult] =
    useState<MarketplaceBatchSyncResult | null>(null)

  // ── Scoped sync & images ─────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([])
  const [scopedOs, setScopedOs] = useState('')
  const [scopedBrand, setScopedBrand] = useState('')
  const [scopedSyncing, setScopedSyncing] = useState(false)
  const [scopedRepop, setScopedRepop] = useState(false)
  const [scopedMsg, setScopedMsg] = useState<string | null>(null)

  // ── Slug audit ───────────────────────────────────────────────────────────
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFixing, setAuditFixing] = useState(false)
  const [auditMessage, setAuditMessage] = useState<string | null>(null)
  const [auditRows, setAuditRows] = useState<SlugAuditRow[]>([])
  const [auditSummary, setAuditSummary] = useState<SlugAuditSummary>(EMPTY_SLUG_SUMMARY)
  const [auditTotal, setAuditTotal] = useState<number | null>(null)
  const [aliasExpanded, setAliasExpanded] = useState(false)
  const [lastFixResult, setLastFixResult] = useState<SlugFixResponse | null>(null)

  // ── Price management ─────────────────────────────────────────────────────
  const [priceName, setPriceName] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceData, setPriceData] = useState<PhoneWithPrices | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [resyncing, setResyncing] = useState(false)

  const loadMarketplaceCandidates = async ({
    scope = marketplaceQueueScope,
    brandSlug = marketplaceQueueBrand,
    search = marketplaceQueueSearch,
    updateMessage = true,
  }: {
    scope?: 'missing_trusted_prices' | 'all'
    brandSlug?: string
    search?: string
    updateMessage?: boolean
  } = {}) => {
    setMarketplaceQueueLoading(true)
    if (updateMessage) setMarketplaceQueueMessage(null)

    try {
      const params = new URLSearchParams({
        scope,
        limit: '40',
      })

      if (brandSlug.trim()) params.set('brand_slug', brandSlug.trim())
      if (search.trim()) params.set('search', search.trim())

      const json = await requestAdminJson<MarketplaceCandidatesResponse>(
        `/marketplace-offers/candidates?${params.toString()}`
      )

      if (json.success) {
        setMarketplaceCandidates(json.data ?? [])
        if (updateMessage) {
          setMarketplaceQueueMessage(
            json.message ??
              `Loaded ${(json.data ?? []).length} phone${
                (json.data ?? []).length === 1 ? '' : 's'
              } for the Jiji queue.`
          )
        }
      } else {
        setMarketplaceCandidates([])
        if (updateMessage) {
          setMarketplaceQueueMessage(
            json.message ?? 'Failed to load Jiji marketplace candidates.'
          )
        }
      }
    } catch {
      setMarketplaceCandidates([])
      if (updateMessage) {
        setMarketplaceQueueMessage('Failed to load Jiji marketplace candidates.')
      }
    } finally {
      setMarketplaceQueueLoading(false)
    }
  }

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: Array<Brand & { is_active: boolean }> }>('/brands')
      .then((json) => {
        if (json.success) {
          setBrands(json.data.filter((b: Brand & { is_active: boolean }) => b.is_active))
        }
      })
      .catch(() => {})

    void loadMarketplaceCandidates({
      scope: 'missing_trusted_prices',
      brandSlug: '',
      search: '',
    })
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const json = await requestAdminJson<{ success: boolean; message?: string }>(
        '/sync-prices',
        { method: 'POST' }
      )
      setSyncMsg(json.message ?? 'Sync started.')
    } catch {
      setSyncMsg('Failed to trigger sync.')
    } finally {
      setSyncing(false)
    }
  }

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testName.trim()) return

    setTesting(true)
    setTestResult(null)
    setSaveResult(null)
    setSaveError(null)

    try {
      const json = await requestAdminJson<TestResult>('/test-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_name: testName }),
      })
      setTestResult(json)
    } catch {
      setTestResult({ phone_name: testName, jumia: null, slot: null })
    } finally {
      setTesting(false)
    }
  }

  const handleTestAndSave = async () => {
    if (!testName.trim()) return

    setSaving(true)
    setSaveResult(null)
    setSaveError(null)

    try {
      const json = await requestAdminJson<SaveResult & { success: boolean; message?: string }>(
        '/test-and-save',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_name: testName }),
        }
      )

      if (json.success) setSaveResult(json)
      else setSaveError(json.message ?? 'Failed to save prices.')
    } catch {
      setSaveError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleMarketplaceTest = async (options?: { phoneName?: string }) => {
    const query = options?.phoneName?.trim() || testName.trim()
    if (!query) return

    setMarketplaceLoading('test')
    setMarketplaceResult(null)
    setMarketplaceError(null)
    setMarketplaceBatchResult(null)

    try {
      const json = await requestAdminJson<MarketplaceTestResult>('/test-marketplace-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_name: query }),
      })

      if (json.success) setMarketplaceResult(json)
      else setMarketplaceError(json.message ?? 'Jiji test did not return a usable result.')
    } catch {
      setMarketplaceError('Failed to test Jiji marketplace signals.')
    } finally {
      setMarketplaceLoading(null)
    }
  }

  const handleMarketplaceSync = async (options?: {
    phoneId?: number
    phoneName?: string
    refreshQueue?: boolean
  }) => {
    const query = options?.phoneName?.trim() || testName.trim()
    const phoneId = options?.phoneId
    if (!phoneId && !query) return

    setMarketplaceLoading('sync')
    setMarketplaceResult(null)
    setMarketplaceError(null)
    setMarketplaceBatchResult(null)
    if (phoneId) setMarketplaceRowSyncingId(phoneId)

    try {
      const json = await requestAdminJson<MarketplaceSyncResult>('/marketplace-offers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phoneId ? { phone_id: phoneId } : { phone_name: query }),
      })

      if (json.success) {
        setMarketplaceResult(json)
        if (options?.refreshQueue) {
          await loadMarketplaceCandidates({ updateMessage: false })
        }
      } else {
        setMarketplaceError(json.message ?? 'Jiji sync did not save any usable signals.')
      }
    } catch {
      setMarketplaceError('Failed to sync Jiji marketplace signals.')
    } finally {
      setMarketplaceLoading(null)
      setMarketplaceRowSyncingId(null)
    }
  }

  const handleMarketplaceLoad = async (options?: { phoneId?: number; phoneName?: string }) => {
    const query = options?.phoneName?.trim() || testName.trim()
    const phoneId = options?.phoneId
    if (!phoneId && !query) return

    setMarketplaceLoading('load')
    setMarketplaceResult(null)
    setMarketplaceError(null)
    setMarketplaceBatchResult(null)

    try {
      const endpoint = phoneId
        ? `/marketplace-offers?phone_id=${phoneId}`
        : `/marketplace-offers?phone_name=${encodeURIComponent(query)}`
      const json = await requestAdminJson<MarketplaceSavedResult>(endpoint)

      if (json.success) setMarketplaceResult(json)
      else setMarketplaceError(json.message ?? 'No saved Jiji signals found for this phone.')
    } catch {
      setMarketplaceError('Failed to load saved Jiji marketplace signals.')
    } finally {
      setMarketplaceLoading(null)
    }
  }

  const handleMarketplaceBatchSync = async () => {
    if (marketplaceCandidates.length === 0) return

    setMarketplaceQueueSyncing(true)
    setMarketplaceQueueMessage(null)
    setMarketplaceBatchResult(null)
    setMarketplaceError(null)

    try {
      const json = await requestAdminJson<MarketplaceBatchSyncResult>('/marketplace-offers/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_ids: marketplaceCandidates.map((candidate) => candidate.id) }),
      })

      if (json.success) {
        setMarketplaceBatchResult(json)
        setMarketplaceQueueMessage(
          json.message ??
            `Processed ${json.processed} phone${json.processed === 1 ? '' : 's'} in the Jiji queue.`
        )
        await loadMarketplaceCandidates({ updateMessage: false })
      } else {
        setMarketplaceQueueMessage(json.message ?? 'Batch Jiji sync failed.')
      }
    } catch {
      setMarketplaceQueueMessage('Batch Jiji sync failed.')
    } finally {
      setMarketplaceQueueSyncing(false)
    }
  }

  const handleMarketplaceCatalogSync = async () => {
    setMarketplaceCatalogSyncing(true)
    setMarketplaceQueueMessage(null)
    setMarketplaceBatchResult(null)
    setMarketplaceError(null)

    try {
      const json = await requestAdminJson<{
        success: boolean
        status?: 'started' | 'running'
        message?: string
      }>('/marketplace-offers/sync-all', {
        method: 'POST',
      })

      setMarketplaceQueueMessage(
        json.message ??
          'Full Jiji marketplace sync started. Watch the API terminal for progress.'
      )
    } catch {
      setMarketplaceQueueMessage(
        'Could not start the full Jiji marketplace sync. Confirm the API is running and try again.'
      )
    } finally {
      setMarketplaceCatalogSyncing(false)
    }
  }

  const handleScopedSync = async () => {
    if (!scopedOs && !scopedBrand) return

    setScopedSyncing(true)
    setScopedMsg(null)

    try {
      const json = await requestAdminJson<{ success: boolean; message?: string }>(
        '/sync-prices/scoped',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          os_type: scopedOs || undefined,
          brand_slug: scopedBrand || undefined,
        }),
        }
      )
      setScopedMsg(json.message ?? 'Scoped sync started.')
    } catch {
      setScopedMsg('Failed to start scoped sync.')
    } finally {
      setScopedSyncing(false)
    }
  }

  const handleScopedRepopulate = async () => {
    if (!scopedOs && !scopedBrand) return

    setScopedRepop(true)
    setScopedMsg(null)

    try {
      const json = await requestAdminJson<{ success: boolean; message?: string }>(
        '/repopulate-images/scoped',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          os_type: scopedOs || undefined,
          brand_slug: scopedBrand || undefined,
        }),
        }
      )
      setScopedMsg(json.message ?? 'Scoped image repopulation started.')
    } catch {
      setScopedMsg('Failed to start image repopulation.')
    } finally {
      setScopedRepop(false)
    }
  }

  const loadPrices = async (name?: string) => {
    const query = (name ?? priceName).trim()
    if (!query) return

    setPriceLoading(true)
    setPriceData(null)
    setPriceError(null)

    try {
      const json = await requestAdminJson<{ success: boolean; data: PhoneWithPrices; message?: string }>(
        `/prices?phone_name=${encodeURIComponent(query)}`
      )

      if (json.success) setPriceData(json.data)
      else setPriceError(json.message ?? 'Failed to load prices.')
    } catch {
      setPriceError('Failed to load prices.')
    } finally {
      setPriceLoading(false)
    }
  }

  const deletePrice = async (priceId: string) => {
    setDeleting(priceId)
    try {
      await requestAdminJson<{ success: boolean; message: string }>(`/prices/${priceId}`, {
        method: 'DELETE',
      })
      if (priceData?.phone.name) await loadPrices(priceData.phone.name)
    } catch {
    } finally {
      setDeleting(null)
    }
  }

  const deleteStoreAll = async (store: string) => {
    if (!priceData?.phone) return

    setDeleting(`store-${store}`)
    try {
      await requestAdminJson<{ success: boolean; message: string }>(
        `/prices/phone/${priceData.phone.id}/store/${store}`,
        { method: 'DELETE' }
      )
      await loadPrices(priceData.phone.name)
    } catch {
    } finally {
      setDeleting(null)
    }
  }

  const deleteLegacyPrices = async () => {
    if (!priceData?.phone) return

    setDeleting('legacy-all')
    try {
      await requestAdminJson<{ success: boolean; message: string }>(
        `/prices/phone/${priceData.phone.id}/legacy`,
        { method: 'DELETE' }
      )
      await loadPrices(priceData.phone.name)
    } catch {
    } finally {
      setDeleting(null)
    }
  }

  const resyncPhone = async () => {
    if (!priceData?.phone) return

    setResyncing(true)
    try {
      const json = await requestAdminJson<SaveResult & { success: boolean }>(
        '/test-and-save',
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_name: priceData.phone.name }),
        }
      )
      if (json.success) await loadPrices(priceData.phone.name)
    } catch {
    } finally {
      setResyncing(false)
    }
  }

  const runSlugAudit = async () => {
    setAuditLoading(true)
    setAuditMessage(null)

    try {
      const json = await requestAdminJson<SlugAuditResponse>('/slug-audit')

      if (json.success) {
        setAuditRows(json.data ?? [])
        setAuditSummary(json.summary ?? EMPTY_SLUG_SUMMARY)
        setAuditTotal(json.total ?? null)
        setLastFixResult(null)
        setAuditMessage(
          (json.data?.length ?? 0) > 0
            ? `Audit complete. Found ${json.data?.length ?? 0} issue(s).`
            : 'Audit complete. No slug issues found.'
        )
      } else {
        setAuditMessage(json.message ?? 'Failed to run slug audit.')
      }
    } catch {
      setAuditMessage('Failed to run slug audit.')
    } finally {
      setAuditLoading(false)
    }
  }

  const handleSlugFix = async (dryRun: boolean) => {
    if (!dryRun) {
      const confirmed = window.confirm(
        'Apply slug fixes now? This will update phone slugs in the database.'
      )
      if (!confirmed) return
    }

    setAuditFixing(true)
    setAuditMessage(null)

    try {
      const json = await requestAdminJson<SlugFixResponse>('/slug-audit/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun }),
      })

      if (json.success) {
        setLastFixResult(json)
        setAuditMessage(
          json.message ??
            (dryRun
              ? 'Dry run complete.'
              : 'Slug fixes applied successfully.')
        )
        await runSlugAudit()
      } else {
        setAuditMessage(json.message ?? 'Slug fix failed.')
      }
    } catch {
      setAuditMessage('Slug fix failed.')
    } finally {
      setAuditFixing(false)
    }
  }

  const trackedPricesByStore =
    priceData ? groupPricesByStore(priceData.tracked_prices) : {}
  const legacyPricesByStore =
    priceData ? groupPricesByStore(priceData.legacy_prices) : {}
  const marketplaceOffers = marketplaceResult
    ? 'saved' in marketplaceResult
      ? marketplaceResult.saved
      : marketplaceResult.offers
    : []

  const aliasRows = useMemo(
    () => auditRows.filter((row) => row.issue === 'alias_slug'),
    [auditRows]
  )

  const realIssueRows = useMemo(
    () => auditRows.filter((row) => row.issue !== 'alias_slug'),
    [auditRows]
  )

  const realIssuesCount =
    (auditSummary.missing_slug ?? 0) +
    (auditSummary.duplicate_slug ?? 0) +
    (auditSummary.slug_used_by_other_expected_name ?? 0) +
    (auditSummary.exact_mismatch ?? 0)

  const renderSlugIssueLabel = (issue: SlugAuditIssue) => {
    switch (issue) {
      case 'missing_slug':
        return 'Missing slug'
      case 'duplicate_slug':
        return 'Duplicate slug'
      case 'slug_used_by_other_expected_name':
        return 'Swap / wrong owner'
      case 'exact_mismatch':
        return 'Mismatch'
      case 'alias_slug':
        return 'Alias'
      default:
        return issue
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Price Sync</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage prices — sync all, test individual phones, or delete stale prices.
        </p>
      </div>

      {/* ── Full sync ──────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-md p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Full Price Sync</h2>
          <p className="text-sm text-text-secondary mt-1">
            Syncs all phones on Jumia and Slot.ng. Runs in the background — watch server logs.
          </p>
        </div>
        {syncMsg && (
          <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {syncMsg}
          </p>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
        >
          {syncing ? 'Starting...' : 'Trigger Full Sync'}
        </button>
      </div>

      {/* ── Scoped sync & images ────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-text-primary">
            Scoped Sync & Image Repopulation
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Target a specific OS or brand instead of running a full sync.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">Filter by OS</label>
            <select
              value={scopedOs}
              onChange={(e) => {
                setScopedOs(e.target.value)
                setScopedBrand('')
              }}
              className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">— Select OS —</option>
              <option value="android">Android</option>
              <option value="ios">iOS (iPhone)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-text-primary">
              Filter by Brand
            </label>
            <select
              value={scopedBrand}
              onChange={(e) => {
                setScopedBrand(e.target.value)
                setScopedOs('')
              }}
              className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">— Select Brand —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {scopedMsg && (
          <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {scopedMsg}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleScopedSync}
            disabled={scopedSyncing || (!scopedOs && !scopedBrand)}
            className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
          >
            {scopedSyncing ? 'Syncing...' : '↻ Sync Prices'}
          </button>
          <button
            onClick={handleScopedRepopulate}
            disabled={scopedRepop || (!scopedOs && !scopedBrand)}
            className="h-10 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
          >
            {scopedRepop ? 'Starting...' : '🖼️ Repopulate Images'}
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Select either an OS or a brand — not both. Both actions run in the background.
        </p>
      </div>

      {/* ── Slug integrity audit ───────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-text-primary">Slug Integrity Audit</h2>
          <p className="text-sm text-text-secondary mt-1">
            Audit phone slugs against canonical phone names, detect swaps and mismatches,
            and keep alias slugs separate.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runSlugAudit}
            disabled={auditLoading || auditFixing}
            className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
          >
            {auditLoading ? 'Running...' : 'Run Audit'}
          </button>

          <button
            onClick={() => handleSlugFix(true)}
            disabled={auditLoading || auditFixing}
            className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
          >
            {auditFixing ? 'Working...' : 'Dry Run Fix'}
          </button>

          <button
            onClick={() => handleSlugFix(false)}
            disabled={auditLoading || auditFixing}
            className="h-10 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
          >
            {auditFixing ? 'Working...' : 'Apply Fix'}
          </button>
        </div>

        {auditMessage && (
          <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {auditMessage}
          </p>
        )}

        {auditTotal !== null && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-border bg-surfaceHigh px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Total checked
              </p>
              <p className="text-xl font-black text-text-primary mt-1">
                {auditTotal.toLocaleString()}
              </p>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Real issues
              </p>
              <p className="text-xl font-black text-amber-800 mt-1">
                {realIssuesCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-md border border-border bg-surfaceHigh px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Alias slugs
              </p>
              <p className="text-xl font-black text-text-primary mt-1">
                {(auditSummary.alias_slug ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {lastFixResult && (
          <div className="space-y-3">
            <div
              className={`rounded border px-3 py-2 text-sm font-medium ${
                lastFixResult.dry_run
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-green-200 bg-green-50 text-green-700'
              }`}
            >
              {lastFixResult.message}
            </div>

            {(lastFixResult.updated?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  {lastFixResult.dry_run ? 'Would update' : 'Updated'}
                </p>
                <div className="space-y-2">
                  {lastFixResult.updated?.map((item, index) =>
                    item.type === 'direct_update' ? (
                      <div
                        key={`${item.type}-${item.id}-${index}`}
                        className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm"
                      >
                        <p className="font-semibold text-text-primary">
                          #{item.id} — {item.name}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {item.from ?? 'NULL'} → {item.to}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={`${item.type}-${item.first.id}-${item.second.id}-${index}`}
                        className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm"
                      >
                        <p className="font-semibold text-text-primary">
                          Swap: #{item.first.id} ↔ #{item.second.id}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {item.first.name}: {item.first.from} → {item.first.to}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.second.name}: {item.second.from} → {item.second.to}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {(lastFixResult.skipped?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  Skipped
                </p>
                <div className="space-y-2">
                  {lastFixResult.skipped?.map((item, index) => (
                    <div
                      key={`${item.id}-${item.issue}-${index}`}
                      className="rounded-md border border-border bg-surfaceHigh px-3 py-2 text-sm"
                    >
                      <p className="font-semibold text-text-primary">
                        #{item.id} — {item.name}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {auditTotal !== null && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Real Issues</h3>
              <p className="text-xs text-text-muted mt-1">
                Missing, duplicate, swapped, or mismatched slugs.
              </p>
            </div>

            {realIssueRows.length === 0 ? (
              <p className="text-sm text-text-muted py-2">
                No real slug issues found.
              </p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-surfaceHigh border-b border-border text-xs font-bold uppercase tracking-wide text-text-muted">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Issue</div>
                  <div className="col-span-3">Current slug</div>
                  <div className="col-span-3">Canonical slug</div>
                </div>

                {realIssueRows.map((row) => (
                  <div
                    key={`${row.id}-${row.issue}`}
                    className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border last:border-b-0 text-sm"
                  >
                    <div className="col-span-1 text-text-primary font-semibold">{row.id}</div>
                    <div className="col-span-3 text-text-primary font-medium break-words">
                      {row.name}
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-semibold">
                        {renderSlugIssueLabel(row.issue)}
                      </span>
                    </div>
                    <div className="col-span-3 text-text-secondary break-words">
                      {row.slug ?? 'NULL'}
                    </div>
                    <div className="col-span-3 text-text-secondary break-words">
                      {row.canonicalExpectedSlug}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setAliasExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surfaceHigh text-left"
              >
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Alias Slugs ({aliasRows.length})
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Acceptable alternate slugs, collapsed by default.
                  </p>
                </div>
                <span className="text-sm font-semibold text-text-secondary">
                  {aliasExpanded ? 'Hide' : 'Show'}
                </span>
              </button>

              {aliasExpanded && (
                <div className="border-t border-border">
                  {aliasRows.length === 0 ? (
                    <p className="text-sm text-text-muted px-4 py-3">
                      No alias slugs found.
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {aliasRows.map((row) => (
                        <div
                          key={`${row.id}-${row.issue}`}
                          className="px-4 py-3 border-b border-border last:border-b-0 text-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-text-primary">
                                #{row.id} — {row.name}
                              </p>
                              <p className="text-xs text-text-secondary">
                                Current: {row.slug ?? 'NULL'}
                              </p>
                              <p className="text-xs text-text-secondary">
                                Canonical: {row.canonicalExpectedSlug}
                              </p>
                              <p className="text-xs text-text-secondary break-words">
                                Acceptable: {row.acceptableSlugs.join(', ')}
                              </p>
                            </div>
                            <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold shrink-0">
                              Alias
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Scraper tool ───────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-text-primary">Scraper Tool</h2>
          <p className="text-sm text-text-secondary mt-1">
            <span className="font-semibold">Test only</span> — shows result without saving.{' '}
            <span className="font-semibold">Test & Save</span> — writes directly to the
            prices table.
          </p>
        </div>

        <form onSubmit={handleTest} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="test-name" className="block text-sm font-semibold text-text-primary">
              Phone name <span className="text-text-muted font-normal">(exact catalogue name)</span>
            </label>
            <input
              id="test-name"
              type="text"
              value={testName}
              onChange={(e) => {
                setTestName(e.target.value)
                setTestResult(null)
                setSaveResult(null)
                setSaveError(null)
                setMarketplaceResult(null)
                setMarketplaceError(null)
              }}
              placeholder="e.g. Samsung Galaxy S26 Plus"
              className="w-full max-w-md px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={testing || !testName.trim()}
              className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test only'}
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={saving || !testName.trim()}
              className="h-10 px-5 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Test & Save to DB'}
            </button>
          </div>
        </form>

        {testResult && !saveResult && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wide">
              Result (not saved)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['jumia', 'slot'] as const).map((store) => {
                const r = testResult[store]
                return (
                  <div
                    key={store}
                    className={`rounded-md p-3 border text-sm space-y-1 ${
                      r?.price_ngn
                        ? 'border-green-200 bg-green-50'
                        : 'border-border bg-surfaceHigh'
                    }`}
                  >
                    <p className="font-bold capitalize">{store}</p>
                    {r?.price_ngn ? (
                      <>
                        <p className="text-green-700 font-black text-base">
                          {formatNaira(r.price_ngn)}
                        </p>
                        {r.url && <p className="text-xs text-text-muted truncate">{r.url}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-text-muted">{r?.error ?? 'No result'}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {saveResult && (
          <div className="space-y-3">
            <p
              className={`text-sm font-medium px-3 py-2 rounded border ${
                saveResult.saved.length > 0
                  ? 'text-green-700 bg-green-50 border-green-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {saveResult.message}
            </p>
            {saveResult.saved.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saveResult.saved.map(({ store, price_ngn, url, variant_label }) => (
                  <div
                    key={`${store}-${variant_label ?? 'default'}`}
                    className="rounded-md p-3 border border-green-200 bg-green-50 text-sm space-y-1"
                  >
                    <p className="font-bold capitalize">{store} ✅</p>
                    <p className="text-green-700 font-black text-base">
                      {formatNaira(price_ngn)}
                    </p>
                    {variant_label ? (
                      <p className="text-xs font-semibold text-text-secondary">
                        Variant: {variant_label}
                      </p>
                    ) : null}
                    {url && <p className="text-xs text-text-muted truncate">{url}</p>}
                  </div>
                ))}
              </div>
            )}
            {saveResult.errors.map(({ store, error }) => (
              <p key={store} className="text-xs text-text-muted">
                <span className="font-semibold capitalize">{store}:</span> {error}
              </p>
            ))}
          </div>
        )}

        {saveError && (
          <p className="text-sm text-error font-medium bg-red-50 border border-red-200 rounded px-3 py-2">
            {saveError}
          </p>
        )}
      </div>

      {/* ── Price management ───────────────────────────────────────────── */}
      <div className="bg-surface border border-amber-200 rounded-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-text-primary">Jiji Marketplace Signals</h2>
          <p className="text-sm text-text-secondary mt-1">
            Used-market intelligence only. These signals never write to the prices table and are not
            used for deals, alerts, verdicts, or trusted store ranges.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              void handleMarketplaceCatalogSync()
            }}
            disabled={
              marketplaceCatalogSyncing ||
              marketplaceQueueSyncing ||
              marketplaceLoading !== null
            }
            className="h-10 px-5 rounded-sm bg-amber-700 text-white text-sm font-bold hover:bg-amber-800 transition-colors duration-fast disabled:opacity-50"
          >
            {marketplaceCatalogSyncing ? 'Starting full sync...' : 'Sync all Jiji phones'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleMarketplaceTest()
            }}
            disabled={marketplaceLoading !== null || !testName.trim()}
            className="h-10 px-5 rounded-sm border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors duration-fast disabled:opacity-50"
          >
            {marketplaceLoading === 'test' ? 'Testing...' : 'Test Jiji'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleMarketplaceSync()
            }}
            disabled={marketplaceLoading !== null || !testName.trim()}
            className="h-10 px-5 rounded-sm bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors duration-fast disabled:opacity-50"
          >
            {marketplaceLoading === 'sync' ? 'Syncing...' : 'Sync typed phone'}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleMarketplaceLoad()
            }}
            disabled={marketplaceLoading !== null || !testName.trim()}
            className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
          >
            {marketplaceLoading === 'load' ? 'Loading...' : 'Load saved'}
          </button>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50/40 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Targeted Jiji Queue</h3>
            <p className="text-xs text-text-secondary mt-1">
              Optional helper for testing or retrying a smaller set. For the normal full Jiji refresh,
              use "Sync all Jiji phones" above and follow the API terminal logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Scope
              </label>
              <select
                value={marketplaceQueueScope}
                onChange={(e) =>
                  setMarketplaceQueueScope(
                    e.target.value as 'missing_trusted_prices' | 'all'
                  )
                }
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="missing_trusted_prices">No Jumia/Slot price</option>
                <option value="all">All active phones</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Brand
              </label>
              <select
                value={marketplaceQueueBrand}
                onChange={(e) => setMarketplaceQueueBrand(e.target.value)}
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">All brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Search
              </label>
              <input
                type="text"
                value={marketplaceQueueSearch}
                onChange={(e) => setMarketplaceQueueSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void loadMarketplaceCandidates()}
                placeholder="Filter by phone or brand"
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => loadMarketplaceCandidates()}
                disabled={marketplaceQueueLoading}
                className="h-10 px-5 rounded-sm border border-amber-300 bg-white text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors duration-fast disabled:opacity-50"
              >
                {marketplaceQueueLoading ? 'Loading...' : 'Load queue'}
              </button>
              <button
                type="button"
                onClick={handleMarketplaceBatchSync}
                disabled={
                  marketplaceQueueSyncing ||
                  marketplaceQueueLoading ||
                  marketplaceCatalogSyncing ||
                  marketplaceLoading !== null ||
                  marketplaceCandidates.length === 0
                }
                className="h-10 px-5 rounded-sm bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors duration-fast disabled:opacity-50"
              >
                {marketplaceQueueSyncing ? 'Syncing...' : 'Sync shown queue'}
              </button>
            </div>
          </div>

          {marketplaceQueueMessage && (
            <p className="text-sm font-medium text-amber-800 bg-white border border-amber-200 rounded px-3 py-2">
              {marketplaceQueueMessage}
            </p>
          )}

          {marketplaceBatchResult && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary">
                Batch result: {marketplaceBatchResult.saved_total} signal
                {marketplaceBatchResult.saved_total === 1 ? '' : 's'} saved across{' '}
                {marketplaceBatchResult.processed} phone
                {marketplaceBatchResult.processed === 1 ? '' : 's'}.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {marketplaceBatchResult.results.map((row) => (
                  <div
                    key={`${row.phone_id}-${row.status}`}
                    className="rounded-sm border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <p className="font-semibold text-text-primary">
                      {row.phone_name ?? `Phone #${row.phone_id}`}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{row.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {marketplaceCandidates.length === 0 ? (
            <p className="text-sm text-text-muted">
              No phones are currently loaded in the Jiji queue.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                Showing the first {marketplaceCandidates.length} phone
                {marketplaceCandidates.length === 1 ? '' : 's'} for this queue. Never-synced phones stay ahead of recently retried no-result phones.
              </p>
              <div className="space-y-3">
                {marketplaceCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-border bg-surface px-4 py-3 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-text-primary">{candidate.name}</p>
                        <p className="text-xs text-text-muted">
                          {candidate.brand_name} - {candidate.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {candidate.trusted_store_count === 0
                            ? 'No trusted price'
                            : `${candidate.trusted_store_count} trusted store${
                                candidate.trusted_store_count === 1 ? '' : 's'
                              }`}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                          {candidate.marketplace_signal_count} saved Jiji signal
                          {candidate.marketplace_signal_count === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${
                          candidate.has_jumia
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Jumia {candidate.has_jumia ? 'yes' : 'no'}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${
                          candidate.has_slot
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Slot {candidate.has_slot ? 'yes' : 'no'}
                      </span>
                      {candidate.lowest_trusted_price != null ? (
                        <span className="rounded-full bg-accent-subtle px-2.5 py-1 font-semibold text-accent">
                          Lowest trusted {formatNaira(candidate.lowest_trusted_price)}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${
                          candidate.last_marketplace_sync_at == null
                            ? 'bg-slate-100 text-slate-700'
                            : candidate.last_marketplace_sync_status === 'error'
                              ? 'bg-red-50 text-red-700'
                              : (candidate.last_marketplace_sync_saved_count ?? 0) > 0
                                ? 'bg-green-50 text-green-700'
                                : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {candidate.last_marketplace_sync_at == null
                          ? 'Never synced'
                          : candidate.last_marketplace_sync_status === 'error'
                            ? 'Last sync errored'
                            : (candidate.last_marketplace_sync_saved_count ?? 0) > 0
                              ? `Last sync saved ${candidate.last_marketplace_sync_saved_count}`
                              : 'Last sync found nothing'}
                      </span>
                      <span className="text-text-muted">
                        {formatMarketplaceAttemptAge(candidate.last_marketplace_sync_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTestName(candidate.name)}
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast"
                      >
                        Use in tester
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleMarketplaceSync({
                            phoneId: candidate.id,
                            phoneName: candidate.name,
                            refreshQueue: true,
                          })
                        }
                        disabled={
                          marketplaceLoading !== null ||
                          marketplaceQueueSyncing ||
                          marketplaceCatalogSyncing ||
                          marketplaceRowSyncingId === candidate.id
                        }
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors duration-fast disabled:opacity-50"
                      >
                        {marketplaceRowSyncingId === candidate.id ? 'Syncing...' : 'Sync Jiji'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleMarketplaceLoad({
                            phoneId: candidate.id,
                            phoneName: candidate.name,
                          })
                        }
                        disabled={
                          marketplaceLoading !== null ||
                          marketplaceQueueSyncing ||
                          marketplaceCatalogSyncing
                        }
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors duration-fast disabled:opacity-50"
                      >
                        Load saved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {marketplaceError && (
          <p className="text-sm text-error font-medium bg-red-50 border border-red-200 rounded px-3 py-2">
            {marketplaceError}
          </p>
        )}

        {marketplaceResult && (
          <div className="space-y-3">
            <p
              className={`text-sm font-medium px-3 py-2 rounded border ${
                marketplaceOffers.length > 0
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              {'saved' in marketplaceResult
                ? `Saved ${marketplaceResult.saved.length} Jiji marketplace signal${
                    marketplaceResult.saved.length === 1 ? '' : 's'
                  } for ${marketplaceResult.phone_name}.`
                : 'count' in marketplaceResult
                  ? `Loaded ${marketplaceResult.count} saved Jiji marketplace signal${
                      marketplaceResult.count === 1 ? '' : 's'
                    } for ${marketplaceResult.phone_name ?? testName}.`
                  : `Found ${marketplaceOffers.length} Jiji marketplace signal${
                      marketplaceOffers.length === 1 ? '' : 's'
                    } for ${marketplaceResult.phone?.name ?? testName}.`}
            </p>

            {marketplaceOffers.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {marketplaceOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-md p-3 border border-amber-200 bg-amber-50/70 text-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-text-primary truncate">
                          {offer.listing_title}
                        </p>
                        <p className="text-amber-800 font-black text-base">
                          {formatNaira(offer.price_ngn)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                        {Math.max(0, Math.min(100, Math.round(offer.confidence_score)))}% match
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {[offer.location, offer.condition_label].filter(Boolean).join(' - ') ||
                        'Marketplace listing'}
                    </p>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-xs font-bold text-accent hover:underline"
                    >
                      Open Jiji listing
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No usable Jiji marketplace signals for this phone yet.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-md p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-text-primary">Price Management</h2>
          <p className="text-sm text-text-secondary mt-1">
            View, delete stale prices, or re-sync a specific phone.
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-md space-y-1.5">
            <label htmlFor="price-name" className="block text-sm font-semibold text-text-primary">
              Phone name
            </label>
            <input
              id="price-name"
              type="text"
              value={priceName}
              onChange={(e) => setPriceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadPrices()}
              placeholder="e.g. Samsung Galaxy S26"
              className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
            />
          </div>
          <button
            onClick={() => loadPrices()}
            disabled={priceLoading || !priceName.trim()}
            className="h-10 px-5 rounded-sm border border-border text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-borderHigh transition-colors duration-fast disabled:opacity-50"
          >
            {priceLoading ? 'Loading...' : 'Load prices'}
          </button>
        </div>

        {priceError && <p className="text-sm text-error">{priceError}</p>}

        {priceData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text-primary">{priceData.phone.name}</p>
                <p className="text-xs text-text-muted">
                  {priceData.summary.total_rows} price row{priceData.summary.total_rows !== 1 ? 's' : ''} in
                  DB
                </p>
                <p className="text-xs text-text-muted">
                  {priceData.summary.tracked_rows} tracked live row{priceData.summary.tracked_rows !== 1 ? 's' : ''} •{' '}
                  {priceData.summary.legacy_rows} legacy/untracked row{priceData.summary.legacy_rows !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {priceData.summary.legacy_rows > 0 ? (
                  <button
                    onClick={deleteLegacyPrices}
                    disabled={deleting === 'legacy-all'}
                    className="h-9 px-4 rounded-sm border border-amber-300 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors duration-fast disabled:opacity-50"
                  >
                    {deleting === 'legacy-all' ? 'Cleaning...' : 'Delete legacy rows'}
                  </button>
                ) : null}
                <button
                  onClick={resyncPhone}
                  disabled={resyncing}
                  className="h-9 px-4 rounded-sm bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
                >
                  {resyncing ? 'Resyncing...' : '↻ Re-sync this phone'}
                </button>
              </div>
            </div>

            {priceData.prices.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No prices in DB for this phone.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-green-200 bg-green-50/60 p-4 space-y-4">
                  <div>
                    <p className="text-sm font-bold text-green-800">Tracked live stores</p>
                    <p className="text-xs text-green-700 mt-1">
                      These are the current live price lanes Decide actively syncs and trusts:
                      Jumia and Slot.
                    </p>
                  </div>

                  {priceData.tracked_prices.length === 0 ? (
                    <p className="text-sm text-green-800/80">
                      No tracked Jumia/Slot rows are currently saved for this phone.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(trackedPricesByStore).map(([store, rows]) => (
                        <div key={store} className="border border-border rounded-md overflow-hidden bg-surface">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-surfaceHigh border-b border-border">
                            <p className="text-sm font-bold text-text-primary capitalize">{store}</p>
                            <button
                              onClick={() => deleteStoreAll(store)}
                              disabled={deleting === `store-${store}`}
                              className="text-xs font-semibold text-error hover:opacity-70 transition-opacity disabled:opacity-40"
                            >
                              {deleting === `store-${store}`
                                ? 'Deleting...'
                                : `Delete all ${store} prices`}
                            </button>
                          </div>
                          {rows.map((price) => (
                            <div
                              key={price.id}
                              className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-text-primary">
                                    {formatNaira(price.price_ngn)}
                                  </span>
                                  {price.variant_label ? (
                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-accent-subtle text-accent">
                                      {price.variant_label}
                                    </span>
                                  ) : null}
                                  <span
                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                      price.is_valid
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {price.is_valid ? 'valid' : 'invalid'}
                                  </span>
                                  <span
                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                      price.in_stock
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {price.in_stock ? 'in stock' : 'out of stock'}
                                  </span>
                                </div>
                                <p className="text-xs text-text-muted">
                                  {new Date(price.scraped_at).toLocaleString('en-NG', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </p>
                                {price.url && (
                                  <p className="text-xs text-text-muted truncate max-w-xs">{price.url}</p>
                                )}
                              </div>
                              <button
                                onClick={() => deletePrice(price.id)}
                                disabled={deleting === price.id}
                                className="text-xs font-semibold text-error hover:opacity-70 transition-opacity shrink-0 disabled:opacity-40"
                              >
                                {deleting === price.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {priceData.legacy_prices.length > 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50/60 p-4 space-y-4">
                    <div>
                      <p className="text-sm font-bold text-amber-800">Legacy / untracked rows</p>
                      <p className="text-xs text-amber-700 mt-1">
                        These rows are still in the DB, but they are not part of the current live
                        Jumia/Slot sync lanes. They are usually old seeded or retired-store leftovers.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(legacyPricesByStore).map(([store, rows]) => (
                        <div key={store} className="border border-border rounded-md overflow-hidden bg-surface">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-surfaceHigh border-b border-border">
                            <p className="text-sm font-bold text-text-primary capitalize">{store}</p>
                            <button
                              onClick={() => deleteStoreAll(store)}
                              disabled={deleting === `store-${store}`}
                              className="text-xs font-semibold text-error hover:opacity-70 transition-opacity disabled:opacity-40"
                            >
                              {deleting === `store-${store}`
                                ? 'Deleting...'
                                : `Delete all ${store} prices`}
                            </button>
                          </div>
                          {rows.map((price) => (
                            <div
                              key={price.id}
                              className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-text-primary">
                                    {formatNaira(price.price_ngn)}
                                  </span>
                                  {price.variant_label ? (
                                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                      {price.variant_label}
                                    </span>
                                  ) : null}
                                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    legacy
                                  </span>
                                  <span
                                    className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                      price.is_valid
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {price.is_valid ? 'valid' : 'invalid'}
                                  </span>
                                </div>
                                <p className="text-xs text-text-muted">
                                  {new Date(price.scraped_at).toLocaleString('en-NG', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </p>
                                {price.url && (
                                  <p className="text-xs text-text-muted truncate max-w-xs">{price.url}</p>
                                )}
                              </div>
                              <button
                                onClick={() => deletePrice(price.id)}
                                disabled={deleting === price.id}
                                className="text-xs font-semibold text-error hover:opacity-70 transition-opacity shrink-0 disabled:opacity-40"
                              >
                                {deleting === price.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
