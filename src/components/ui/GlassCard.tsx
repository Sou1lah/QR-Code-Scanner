import type { HTMLAttributes } from 'react'
import { clsx } from '@/lib/utils'

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('glass-card', className)} {...props} />
}
