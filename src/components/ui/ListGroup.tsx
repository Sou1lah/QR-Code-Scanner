import type { ReactNode } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

export function ListGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/50">{title}</h3>
      <GlassCard className="divide-y divide-white/10 overflow-hidden rounded-3xl">{children}</GlassCard>
    </section>
  )
}
