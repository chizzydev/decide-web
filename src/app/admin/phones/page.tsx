'use client'

// decide-web/src/app/admin/phones/page.tsx

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { requestAdminJson } from '@/lib/adminApi'

interface AdminPhone {
  id:          number
  name:        string
  slug:        string
  brand_name:  string
  is_featured: boolean
  is_active:   boolean
}

interface NoImagePhone {
  id:           number
  name:         string
  slug:         string
  image_url:    string | null
  image_status: string | null
}

interface Brand {
  id:      number
  name:    string
  slug:    string
  os_type: string
}

type Tab = 'catalogue' | 'add' | 'tags' | 'images'

export default function AdminPhonesPage() {
  const [tab,     setTab]     = useState<Tab>('catalogue')
  const [phones,  setPhones]  = useState<AdminPhone[]>([])
  const [noImage, setNoImage] = useState<NoImagePhone[]>([])
  const [brands,  setBrands]  = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  // Catalogue editing
  const [editing,  setEditing]  = useState<number | null>(null)
  const [editName, setEditName] = useState('')

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
  })
  const [adding,  setAdding]  = useState(false)
  const [addMsg,  setAddMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Image repopulate
  const [repopulating,      setRepopulating]      = useState(false)
  const [repopMsg,          setRepopMsg]          = useState<string | null>(null)
  const [repopSingle,       setRepopSingle]       = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      requestAdminJson<{ success: boolean; data: AdminPhone[] }>('/phones/list'),
      requestAdminJson<{ success: boolean; data: NoImagePhone[] }>('/phones/no-image'),
      requestAdminJson<{ success: boolean; data: Brand[] }>('/brands'),
    ]).then(([list, noImg, brandsRes]) => {
      if (list.success)      setPhones(list.data)
      if (noImg.success)     setNoImage(noImg.data)
      if (brandsRes.success) setBrands(brandsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const toggleFeatured = async (id: number, is_featured: boolean) => {
    setPhones((prev) => prev.map((p) => p.id === id ? { ...p, is_featured: !is_featured } : p))
    await requestAdminJson<{ success: boolean; message: string }>(`/phones/${id}/featured`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !is_featured }),
    }).catch(() => setPhones((prev) => prev.map((p) => p.id === id ? { ...p, is_featured } : p)))
  }

  const saveEdit = async (id: number) => {
    await requestAdminJson<{ success: boolean; message: string }>(`/phones/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setPhones((prev) => prev.map((p) => p.id === id ? { ...p, name: editName } : p))
    setEditing(null)
  }

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
      for (const key of ['brand_id','released_year','display_size_inches','ram_gb','storage_gb','battery_mah','main_camera_mp','score_battery','score_camera','score_performance','score_build','score_value']) {
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
        setForm({ brand_id: '', name: '', slug: '', os_type: 'android', released_year: '', display_size_inches: '', ram_gb: '', storage_gb: '', battery_mah: '', main_camera_mp: '', chipset: '', has_5g: false, has_nfc: false, score_battery: '5', score_camera: '5', score_performance: '5', score_build: '5', score_value: '5', gray_market_risk: 'low', local_support_quality: 'fair' })
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
    try {
      const json = await requestAdminJson<{ success: boolean; message: string }>(
        `/repopulate-image/${id}`,
        { method: 'POST' }
      )
      if (json.success) {
        // Optimistically remove from no-image list after a short delay
        setTimeout(() => {
          setNoImage((prev) => prev.filter((p) => p.id !== id))
        }, 3000)
        alert(`${name}: ${json.message}`)
      }
    } catch {
      alert('Failed to start image repopulation.')
    } finally {
      setRepopSingle(null)
    }
  }

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

  const filtered = phones.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand_name.toLowerCase().includes(search.toLowerCase())
  )

  const TABS: { key: Tab; label: string }[] = [
    { key: 'catalogue', label: 'Catalogue'    },
    { key: 'add',       label: 'Add Phone'    },
    { key: 'tags',      label: 'Manage Tags'  },
    { key: 'images',    label: `Images (${noImage.length} missing)` },
  ]

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
      {tab === 'catalogue' && (
        <>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search phones..." className="w-full max-w-sm px-3 py-2 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-surface border border-border rounded-md animate-pulse" />)}</div>
          ) : (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surfaceHigh">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Brand</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Featured</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((phone, i) => (
                    <tr key={phone.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                      <td className="px-4 py-3">
                        {editing === phone.id ? (
                          <div className="flex items-center gap-2">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="px-2 py-1 text-sm border border-accent rounded-sm focus:outline-none" autoFocus />
                            <button onClick={() => saveEdit(phone.id)} className="text-xs text-accent font-bold">Save</button>
                            <button onClick={() => setEditing(null)} className="text-xs text-text-muted">Cancel</button>
                          </div>
                        ) : (
                          <p className="font-semibold text-text-primary">{phone.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-text-secondary">{phone.brand_name}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleFeatured(phone.id, phone.is_featured)} className={`text-lg transition-all ${phone.is_featured ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`} title={phone.is_featured ? 'Remove featured' : 'Mark featured'}>⭐</button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => { setEditing(phone.id); setEditName(phone.name) }} className="text-xs text-accent font-semibold hover:underline">Edit</button>
                          <button
                            onClick={() => repopulateSingleImage(phone.id, phone.name)}
                            disabled={repopSingle === phone.id}
                            className="text-xs text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
                            title="Repopulate image"
                          >
                            {repopSingle === phone.id ? '...' : '🖼️'}
                          </button>
                          <Link href={`/phones/${phone.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-secondary">View →</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <h2 className="text-base font-bold text-text-primary">Repopulate All Images</h2>
              <p className="text-sm text-text-secondary mt-1">
                Resets all phone images to placeholder and re-scrapes from Jumia and Slot.ng.
                Runs in the background — check server logs for progress.
              </p>
            </div>
            {repopMsg && (
              <p className="text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                {repopMsg}
              </p>
            )}
            <button
              onClick={handleRepopulate}
              disabled={repopulating}
              className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
            >
              {repopulating ? 'Starting...' : '🖼️ Repopulate All Images'}
            </button>
          </div>

          {/* Missing images list */}
          <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-700">
            {noImage.length === 0
              ? '✅ All phones have images.'
              : `${noImage.length} phone${noImage.length !== 1 ? 's' : ''} missing images. Click Repopulate above to fix.`}
          </div>

          {noImage.length > 0 && (
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surfaceHigh">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {noImage.map((phone, i) => (
                    <tr key={phone.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">{phone.name}</p>
                        <p className="text-xs text-text-muted">{phone.slug}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-amber-600 capitalize">{phone.image_status ?? 'none'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => repopulateSingleImage(phone.id, phone.name)}
                            disabled={repopSingle === phone.id}
                            className="text-xs font-semibold text-accent hover:underline disabled:opacity-40"
                          >
                            {repopSingle === phone.id ? 'Starting...' : 'Repopulate'}
                          </button>
                          <Link href={`/phones/${phone.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-secondary">View →</Link>
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
