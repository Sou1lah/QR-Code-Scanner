import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { HistoryItem, ScanResult, ScanSettings } from '@/types/api'

interface AppContextValue {
  ready: boolean
  isDark: boolean
  toggleTheme: () => void
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
  demoMode: false,
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(defaultSettings)
  const [isDark, setIsDark] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [ready, setReady] = useState(true)
  const hasLoaded = useRef(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [storedSettings, storedHistory, storedTheme] = await Promise.all([
          AsyncStorage.getItem('amane-settings'),
          AsyncStorage.getItem('amane-history'),
          AsyncStorage.getItem('amane-theme'),
        ])
        if (!active) return
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings) as ScanSettings & { demoMode?: boolean; demoModeExplicit?: boolean }
          setSettings({
            ...defaultSettings,
            ...parsed,
            demoMode: parsed.demoModeExplicit === true ? Boolean(parsed.demoMode) : false,
          })
        }
        if (storedTheme !== null) setIsDark(storedTheme === 'dark')
        if (storedHistory) {
          const parsed: unknown = JSON.parse(storedHistory)
          if (Array.isArray(parsed)) setHistory(parsed as HistoryItem[])
        }
      } catch (error) {
        console.error('Unable to restore saved app data.', error)
      } finally {
        hasLoaded.current = true
        if (active) setReady(true)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!hasLoaded.current) return
    void Promise.all([
      AsyncStorage.setItem('amane-settings', JSON.stringify(settings)),
      AsyncStorage.setItem('amane-history', JSON.stringify(history)),
      AsyncStorage.setItem('amane-theme', isDark ? 'dark' : 'light'),
    ]).catch((error: unknown) => console.error('Unable to save app data.', error))
  }, [history, isDark, settings])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  const setSetting = useCallback((key: keyof ScanSettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }, [])
  const setDemoMode = useCallback((value: boolean) => {
    setSettings((current) => ({ ...current, demoMode: value, demoModeExplicit: true } as typeof current))
  }, [])
  const addHistoryItem = useCallback((raw: string, result: ScanResult) => {
    setHistory((current) =>
      [{ id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), raw, result }, ...current].slice(0, 100),
    )
  }, [])
  const clearHistory = useCallback(() => setHistory([]), [])

  const value = useMemo(
    () => ({ ready, isDark, toggleTheme, settings, history, setSetting, setDemoMode, addHistoryItem, clearHistory }),
    [ready, isDark, toggleTheme, settings, history, setSetting, setDemoMode, addHistoryItem, clearHistory],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppState must be used within AppProvider')
  return context
}
