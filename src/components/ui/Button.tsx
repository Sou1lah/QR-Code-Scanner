import type { ButtonHTMLAttributes } from 'react'
import { clsx } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet'
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:opacity-50',
        variant === 'primary' && 'bg-ios-accent text-white shadow-lg shadow-blue-950/40',
        variant === 'secondary' && 'border border-white/10 bg-white/10 text-white hover:bg-white/15',
        variant === 'quiet' && 'text-ios-accent hover:bg-ios-accent/10',
        className,
      )}
      {...props}
    />
  )
}
