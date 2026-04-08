// decide-web/src/store/compareStore.ts
// Manages the compare tray — the persistent bottom bar that lets
// users add up to 2 phones from anywhere in the app and compare them.

import { create } from 'zustand'
import type { ComparePhone } from '@/types'

interface CompareState {
  // Maximum two phones in the tray at any time
  phones: [ComparePhone | null, ComparePhone | null]

  // Whether the tray is visible — hidden when empty
  isVisible: boolean

  // ── Actions ───────────────────────────────────────────────
  addPhone: (phone: ComparePhone) => void
  removePhone: (slug: string) => void
  clearAll: () => void
  isInTray: (slug: string) => boolean
  isTrayFull: () => boolean
  getFilledSlots: () => ComparePhone[]
}

export const useCompareStore = create<CompareState>((set, get) => ({
  phones: [null, null],
  isVisible: false,

  addPhone: (phone) => {
    const { phones, isTrayFull, isInTray } = get()

    // Do nothing if the phone is already in the tray
    if (isInTray(phone.slug)) return

    // Do nothing if both slots are filled
    if (isTrayFull()) return

    // Fill the first empty slot
    const updated: [ComparePhone | null, ComparePhone | null] =
      phones[0] === null ? [phone, phones[1]] : [phones[0], phone]

    set({ phones: updated, isVisible: true })
  },

  removePhone: (slug) => {
    const { phones } = get()

    const updated: [ComparePhone | null, ComparePhone | null] = [
      phones[0]?.slug === slug ? null : phones[0],
      phones[1]?.slug === slug ? null : phones[1],
    ]

    // Hide the tray when both slots are empty
    const isEmpty = updated[0] === null && updated[1] === null

    set({ phones: updated, isVisible: !isEmpty })
  },

  clearAll: () => {
    set({ phones: [null, null], isVisible: false })
  },

  // Returns true if the phone with this slug is already in the tray
  isInTray: (slug) => {
    const { phones } = get()
    return phones.some((phone) => phone?.slug === slug)
  },

  // Returns true when both slots are filled
  isTrayFull: () => {
    const { phones } = get()
    return phones[0] !== null && phones[1] !== null
  },

  // Returns only the non-null phones — useful for rendering the tray
  getFilledSlots: () => {
    const { phones } = get()
    return phones.filter((phone): phone is ComparePhone => phone !== null)
  },
}))