import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanResult } from '@/types/api'

export interface HistoryItem {
  id: string
  timestamp: number
  raw: string
  result: ScanResult
}

interface HistoryState {
  items: HistoryItem[]
  addItem: (raw: string, result: ScanResult) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (raw, result) =>
        set((state) => ({
          items: [{ id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), raw, result }, ...state.items].slice(
            0,
            100,
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'amane-history' },
  ),
)
