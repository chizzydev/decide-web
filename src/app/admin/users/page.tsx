'use client'

// decide-web/src/app/admin/users/page.tsx

import React, { useEffect, useState } from 'react'
import { requestAdminJson } from '@/lib/adminApi'

interface AdminUser {
  id:           string
  email:        string
  display_name: string | null
  provider:     string
  role:         string
  is_banned:    boolean
  created_at:   string
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    requestAdminJson<{ success: boolean; data: AdminUser[] }>('/users')
      .then((json) => { if (json.success) setUsers(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const toggleBan = async (id: string, is_banned: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_banned: !is_banned } : u))
    await requestAdminJson<{ success: boolean; message: string }>(`/users/${id}/ban`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ banned: !is_banned }),
    }).catch(() => {
      // Revert on failure
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_banned } : u))
    })
  }

  const filtered = users.filter((u) =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Users</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? '...' : `${users.length} registered user${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full max-w-sm px-3 py-2 rounded-sm text-sm bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-fast"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface border border-border rounded-md animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No users found.</p>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surfaceHigh">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Provider</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-surfaceHigh/40'}`}>
                  <td className="px-4 py-3">
                    <p className={`font-semibold ${user.is_banned ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {user.display_name ?? '—'}
                    </p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-text-secondary capitalize">{user.provider}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${user.role === 'admin' ? 'bg-tealTint text-accent' : 'bg-surfaceHigh text-text-muted'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-text-muted">
                      {new Date(user.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors duration-fast ${
                          user.is_banned
                            ? 'text-green-700 border-green-200 hover:bg-green-50'
                            : 'text-red-700 border-red-200 hover:bg-red-50'
                        }`}
                      >
                        {user.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-xs text-text-muted">—</span>
                    )}
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
