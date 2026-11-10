import { useCallback, useState } from 'react'
import { ShieldCheck, TriangleAlert, Wifi } from 'lucide-react'
import { Viewfinder } from '@/components/scanner/Viewfinder'
import { ResultSheet } from '@/components/scanner/ResultSheet'
import { Button } from '@/components/ui/Button'
import { demoPayloads } from '@/services/mock/scenarios'
import { scanPayload } from '@/services/api/client'
import { parsePayload } from '@/lib/parsePayload'
import { useHistoryStore } from '@/store/history'
import { useSettingsStore } from '@/store/settings'
import type { ScanResult } from '@/types/api'

export function Scanner({ onToast }: { onToast: (message: string) => void }) {
  const [raw, setRaw] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const addItem = useHistoryStore((state) => state.addItem)
  const settings = useSettingsStore()
  const demoMode = settings.demoMode

  const inspect = useCallback(
    async (payload: string) => {
      const parsed = parsePayload(payload)
      if (!parsed.raw) {
        onToast('No QR payload to inspect')
        return
      }
      setRaw(parsed.raw)
      setScanning(true)
      setScanError(null)
      setSheetOpen(false)
      try {
        const response = await scanPayload({
          raw: parsed.raw,
          type: parsed.type,
          settings: {
            urlShortenerUnfurl: settings.urlShortenerUnfurl,
            blockInsecureHttp: settings.blockInsecureHttp,
            safeBrowsingApi: settings.safeBrowsingApi,
          },
        })
        setResult(response)
        setSheetOpen(true)
        addItem(parsed.raw, response)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to analyze this QR payload.'
        setScanError(message)
        onToast(message)
      } finally {
        setScanning(false)
      }
    },
    [addItem, onToast, settings],
  )
  const handleScan = useCallback(
    (payload: string) => {
      void inspect(payload)
    },
    [inspect],
  )

  return (
    <>
      {demoMode && (
        <div className="relative z-10 space-y-2 px-4 pt-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">Test QR Payloads</span>
            <span className="rounded-full border border-ios-accent/30 bg-ios-accent/15 px-2 py-0.5 text-[10px] font-medium text-ios-accent">
              Auto-Inspect
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              onClick={() => void inspect(demoPayloads.safe)}
              className="flex-col gap-1 px-2 py-2.5 text-xs"
            >
              <ShieldCheck size={15} className="text-ios-safe" /> Apple.com
            </Button>
            <Button
              type="button"
              onClick={() => void inspect(demoPayloads.phishing)}
              className="flex-col gap-1 px-2 py-2.5 text-xs"
            >
              <TriangleAlert size={15} className="text-ios-danger" /> Phishing
            </Button>
            <Button
              type="button"
              onClick={() => void inspect(demoPayloads.wifi)}
              className="flex-col gap-1 px-2 py-2.5 text-xs"
            >
              <Wifi size={15} className="text-ios-warning" /> Rogue Wi-Fi
            </Button>
          </div>
        </div>
      )}
      <Viewfinder verdict={result?.verdict ?? null} scanning={scanning} onScan={handleScan} onToast={onToast} />
      {scanError && (
        <p className="sr-only" role="alert">
          {scanError}
        </p>
      )}
      <ResultSheet raw={raw} result={result} open={sheetOpen} onClose={() => setSheetOpen(false)} onToast={onToast} />
    </>
  )
}
