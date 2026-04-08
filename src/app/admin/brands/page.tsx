'use client'

// decide-web/src/app/admin/brands/page.tsx

import React, { useEffect, useState } from 'react'
import { requestAdminJson } from '@/lib/adminApi'

interface Brand {
  id:        number
  name:      string
  slug:      string
  os_type:   string
  logo_url:  string | null
  is_active: boolean
}

export default function AdminBrandsPage() {
  const [brands,   setBrands]   = useState<Brand[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)

  // Add brand form
  const [name,    setName]    = useState('')
  const [slug,    setSlug]    = useState('')
  const [osType,  setOsType]  = useState<'android' | 'ios'>('android')
  const [logoUrl, setLogoUrl] = useState('')
  const [adding,  setAdding]  = useState(false)
  const [addMsg,  setAddMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: Brand[] }>('/brands')
      .then((json) => { if (json.success) setBrands(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const toggleActive = async (id: number, is_active: boolean) => {
    setToggling(id)
    setBrands((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !is_active } : b))
    try {
      await requestAdminJson<{ success: boolean; message: string }>(`/brands/${id}/toggle`, {
        method: 'PATCH',
      })
    } catch {
      setBrands((prev) => prev.map((b) => b.id === id ? { ...b, is_active } : b))
    } finally {
      setToggling(null)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setAddMsg(null)
    try {
      const json = await requestAdminJson<{ success: boolean; data: { id: number }; message?: string }>(
        '/brands',
        {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, slug, os_type: osType, logo_url: logoUrl || null }),
        }
      )
      if (json.success) {
        setAddMsg({ type: 'success', text: `Brand "${name}" added successfully.` })
        setBrands((prev) => [...prev, { id: json.data.id, name, slug, os_type: osType, logo_url: logoUrl || null, is_active: true }].sort((a, b) => a.name.localeCompare(b.name)))
        setName(''); setSlug(''); setLogoUrl('')
      } else {
        setAddMsg({ type: 'error', text: json.message ?? 'Failed to add brand.' })
      }
    } catch {
      setAddMsg({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Brands</h1>
        <p className="text-sm text-text-secondary mt-1">
          {loading ? '...' : `${brands.length} brands · ${brands.filter(b => b.is_active).length} active`}
        </p>
      </div>

      {/* Add brand form */}
      <div className="bg-surface border border-border rounded-md p-6 space-y-4">
        <h2 className="text-base font-bold text-text-primary">Add New Brand</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">Brand name *</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="e.g. Nothing"
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent transition-colors duration-fast"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">Slug *</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="e.g. nothing"
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent transition-colors duration-fast"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">OS Type *</label>
              <select
                value={osType}
                onChange={(e) => setOsType(e.target.value as 'android' | 'ios')}
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent transition-colors duration-fast"
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-primary">Logo URL <span className="text-text-muted font-normal">(optional)</span></label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-sm text-sm bg-surface border border-border text-text-primary focus:outline-none focus:border-accent transition-colors duration-fast"
              />
            </div>
          </div>
          {addMsg && (
            <p className={`text-sm font-medium px-3 py-2 rounded border ${addMsg.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-error bg-red-50 border-red-200'}`}>
              {addMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={adding}
            className="h-10 px-6 rounded-sm bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors duration-fast disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Brand'}
          </button>
        </form>
      </div>

      {/* Brand list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-surface border border-border rounded-md animate-pulse" />)}</div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surfaceHigh">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Brand</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">OS</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand, i) => (
                <tr key={brand.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                  <td className="px-4 py-3">
                    <p className={`font-semibold ${brand.is_active ? 'text-text-primary' : 'text-text-muted'}`}>{brand.name}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-mono text-text-muted">{brand.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-text-secondary capitalize">{brand.os_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(brand.id, brand.is_active)}
                      disabled={toggling === brand.id}
                      className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors duration-fast ${
                        brand.is_active
                          ? 'text-green-700 border-green-200 hover:bg-green-50'
                          : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {toggling === brand.id ? '...' : brand.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
