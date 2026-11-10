import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { relativeTime } from '@/lib/utils'
import { useHistoryStore } from '@/store/history'

export function History({ onToast }: { onToast: (message: string) => void }) {
  const items = useHistoryStore((state) => state.items)
  const clear = useHistoryStore((state) => state.clear)

  return (
    <div className="ios-scroll h-full overflow-y-auto p-5 pt-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">History</h1>
          <p className="text-xs text-white/60">Scanned QR payload audit records</p>
        </div>
        <Button
          type="button"
          variant="quiet"
          onClick={() => {
            clear()
            onToast('Audit logs cleared')
          }}
          className="rounded-full border border-ios-accent/20 bg-ios-accent/10 px-3 py-1.5 text-xs"
        >
          <Trash2 size={13} /> Clear All
        </Button>
      </header>
      <div className="space-y-2.5">
        {items.map((item) => (
          <GlassCard key={item.id} className="flex items-center justify-between gap-3 rounded-2xl p-3.5">
            <div className="min-w-0 pr-2">
              <div className="mb-0.5 text-[10px] text-white/50">{relativeTime(item.timestamp)}</div>
              <div className="truncate font-mono text-xs text-white">{item.raw}</div>
            </div>
            <Badge verdict={item.result.verdict} history />
          </GlassCard>
        ))}
        {items.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-white/45">Your scanned payloads will appear here.</p>
        )}
      </div>
    </div>
  )
}
