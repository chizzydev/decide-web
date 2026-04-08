'use client'

// decide-web/src/app/admin/sync/page.tsx

import React, { useEffect, useMemo, useState } from 'react'
import { requestAdminJson } from '@/lib/adminApi'

const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`

type TestResult = {
  phone_name?: string
  jumia?: { price_ngn?: number; url?: string | null; error?: string } | null
  slot?: { price_ngn?: number; url?: string | null; error?: string } | null
}

type SaveResult = {
  phone_id: number
  phone_name: string
  message: string
  saved: { store: string; price_ngn: number; url: string | null }[]
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
}

type PhoneWithPrices = {
  phone: { id: number; name: string }
  prices: PriceRow[]
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

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: Array<Brand & { is_active: boolean }> }>('/brands')
      .then((json) => {
        if (json.success) {
          setBrands(json.data.filter((b: Brand & { is_active: boolean }) => b.is_active))
        }
      })
      .catch(() => {})
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
      setPriceData((prev) =>
        prev ? { ...prev, prices: prev.prices.filter((p) => p.id !== priceId) } : null
      )
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
      setPriceData((prev) =>
        prev ? { ...prev, prices: prev.prices.filter((p) => p.store !== store) } : null
      )
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

  const pricesByStore =
    priceData?.prices.reduce<Record<string, PriceRow[]>>((acc, p) => {
      if (!acc[p.store]) acc[p.store] = []
      acc[p.store].push(p)
      return acc
    }, {}) ?? {}

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
                {saveResult.saved.map(({ store, price_ngn, url }) => (
                  <div
                    key={store}
                    className="rounded-md p-3 border border-green-200 bg-green-50 text-sm space-y-1"
                  >
                    <p className="font-bold capitalize">{store} ✅</p>
                    <p className="text-green-700 font-black text-base">
                      {formatNaira(price_ngn)}
                    </p>
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
                  {priceData.prices.length} price row{priceData.prices.length !== 1 ? 's' : ''} in
                  DB
                </p>
              </div>
              <button
                onClick={resyncPhone}
                disabled={resyncing}
                className="h-9 px-4 rounded-sm bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
              >
                {resyncing ? 'Resyncing...' : '↻ Re-sync this phone'}
              </button>
            </div>

            {priceData.prices.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No prices in DB for this phone.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(pricesByStore).map(([store, rows]) => (
                  <div key={store} className="border border-border rounded-md overflow-hidden">
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
        )}
      </div>
    </div>
  )
}
