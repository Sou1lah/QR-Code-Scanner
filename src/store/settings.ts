import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScanSettings } from '@/types/api'

interface SettingsState extends ScanSettings {
  demoMode: boolean
  setSetting: (key: keyof ScanSettings, value: boolean) => void
  setDemoMode: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      urlShortenerUnfurl: true,
      blockInsecureHttp: true,
      safeBrowsingApi: true,
      demoMode: true,
      setSetting: (key, value) => set({ [key]: value }),
      setDemoMode: (value) => set({ demoMode: value }),
    }),
    { name: 'amane-settings' },
  ),
)
