import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { HistoryItem, ScanResult, ScanSettings } from '@/types/api'

interface AppContextValue {
  ready: boolean
  settings: ScanSettings & { demoMode: boolean }
  history: HistoryItem[]
  setSetting: (key: keyof ScanSettings, value: boolean) => void
  setDemoMode: (value: boolean) => void
  addHistoryItem: (raw: string, result: ScanResult) => void
  clearHistory: () => void
}

const defaultSettings = {
  urlShortenerUnfurl: true,
  blockInsecureHttp: true,
  safeBrowsingApi: true,
  demoMode: true,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(defaultSettings)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [storedSettings, storedHistory] = await Promise.all([
          AsyncStorage.getItem('amane-settings'),
          AsyncStorage.getItem('amane-history'),
        ])
        if (!active) return
        if (storedSettings) setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) })
        if (storedHistory) {
          const parsed: unknown = JSON.parse(storedHistory)
          if (Array.isArray(parsed)) setHistory(parsed as HistoryItem[])
        }
      } catch (error) {
        console.error('Unable to restore saved app data.', error)
      } finally {
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void Promise.all([
      AsyncStorage.setItem('amane-settings', JSON.stringify(settings)),
      AsyncStorage.setItem('amane-history', JSON.stringify(history)),
    ]).catch((error: unknown) => console.error('Unable to save app data.', error))
  }, [history, ready, settings])

  const setSetting = useCallback((key: keyof ScanSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }, [])
  const setDemoMode = useCallback((value: boolean) => {
    setSettings((current) => ({ ...current, demoMode: value }))
  }, [])
  const addHistoryItem = useCallback((raw: string, result: ScanResult) => {
    setHistory((current) =>
      [{ id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), raw, result }, ...current].slice(0, 100),
    )
  }, [])
  const clearHistory = useCallback(() => setHistory([]), [])

  const value = useMemo(
    () => ({ ready, settings, history, setSetting, setDemoMode, addHistoryItem, clearHistory }),
    [ready, settings, history, setSetting, setDemoMode, addHistoryItem, clearHistory],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useAppState must be used inside AppProvider.')
  return value
}
