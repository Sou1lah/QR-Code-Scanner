import type { Verdict } from '@/types/api'

export function Badge({ verdict, history = false }: { verdict: Verdict; history?: boolean }) {
  const label = history
    ? verdict === 'DANGEROUS'
      ? 'BLOCKED'
      : verdict === 'SUSPICIOUS'
        ? 'CAUTION'
        : 'SAFE'
    : verdict
  const color =
    verdict === 'SAFE'
      ? 'text-ios-safe border-ios-safe/30 bg-ios-safe/10'
      : verdict === 'DANGEROUS'
        ? 'text-ios-danger border-ios-danger/30 bg-ios-danger/10'
        : 'text-ios-warning border-ios-warning/30 bg-ios-warning/10'
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>
}
