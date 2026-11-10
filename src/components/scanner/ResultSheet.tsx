import { Copy, ExternalLink, ShieldCheck, TriangleAlert, CircleAlert, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import type { ScanResult } from '@/types/api'

const iconByVerdict = {
  SAFE: ShieldCheck,
  SUSPICIOUS: CircleAlert,
  DANGEROUS: TriangleAlert,
}

const toneByVerdict = {
  SAFE: 'border-ios-safe/30 bg-ios-safe/10 text-ios-safe',
  SUSPICIOUS: 'border-ios-warning/30 bg-ios-warning/10 text-ios-warning',
  DANGEROUS: 'border-ios-danger/30 bg-ios-danger/10 text-ios-danger',
}

const iconToneByVerdict = {
  SAFE: 'bg-ios-safe/20 text-ios-safe',
  SUSPICIOUS: 'bg-ios-warning/20 text-ios-warning',
  DANGEROUS: 'bg-ios-danger/20 text-ios-danger',
}

const titleByVerdict = {
  SAFE: 'Safe & Verified Payload',
  SUSPICIOUS: 'Caution Advisory Required',
  DANGEROUS: 'Malicious Threat Detected',
}

export function ResultSheet({
  raw,
  result,
  open,
  onClose,
  onToast,
}: {
  raw: string
  result: ScanResult | null
  open: boolean
  onClose: () => void
  onToast: (message: string) => void
}) {
  if (!result) return null
  const Icon = iconByVerdict[result.verdict]
  const tone = toneByVerdict[result.verdict]
  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(raw)
      onToast('Copied payload to clipboard')
    } catch {
      onToast('Clipboard access is unavailable')
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className={`mb-4 flex items-center justify-between rounded-2xl border p-4 ${tone}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconToneByVerdict[result.verdict]}`}>
            <Icon size={21} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{titleByVerdict[result.verdict]}</div>
            <div className="mt-0.5 font-mono text-xs font-medium">Risk Score: {result.score}/100</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close result"
          className="rounded-full bg-white/10 p-1.5 text-white/70"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-white/80">{result.summary}</p>
        <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-white/50">Decoded Payload</span>
            <button
              type="button"
              onClick={copyPayload}
              className="flex items-center gap-1 text-[11px] font-medium text-ios-accent"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <div className="break-all font-mono text-xs text-white/90">{raw}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="pl-1 text-[11px] font-semibold uppercase tracking-wider text-white/50">Security Diagnostics</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['SSL State', result.ssl],
            ['Domain Age', result.domainAge],
            ['Redirects', result.redirects],
            ['Reputation', result.reputation],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5"
            >
              <span className="text-white/60">{label}</span>
              <span className="text-right font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <span className="block text-[10px] text-white/40">RESOLVED DESTINATION</span>
          <span className="break-all font-mono text-xs text-ios-accent">{result.resolvedUrl || 'Not available'}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          type="button"
          variant={result.verdict === 'DANGEROUS' ? 'secondary' : 'primary'}
          className={`w-full py-3 text-xs ${result.verdict === 'DANGEROUS' ? 'border-ios-danger/30 bg-ios-danger text-white' : ''}`}
          onClick={() => {
            if (result.verdict === 'DANGEROUS') {
              onToast('Unsafe payload blocked. Nothing was opened.')
              return
            }
            if (/^https?:\/\//i.test(result.resolvedUrl))
              window.open(result.resolvedUrl, '_blank', 'noopener,noreferrer')
            else onToast('Text payload is ready for review')
          }}
        >
          {result.verdict === 'DANGEROUS' ? <ShieldCheck size={15} /> : <ExternalLink size={15} />}
          {result.verdict === 'DANGEROUS'
            ? 'Block & Protect Device'
            : result.verdict === 'SAFE'
              ? 'Open Official Site'
              : 'Review Payload'}
        </Button>
        <Button type="button" onClick={onClose} className="w-full py-2.5 text-xs">
          Dismiss Preview
        </Button>
      </div>
    </BottomSheet>
  )
}
