import type { ReactNode } from 'react'

export function PhonePreview({ children }: { children: ReactNode }) {
  return <div className={`phone-preview-stage${import.meta.env.DEV ? ' is-dev' : ''}`}>{children}</div>
}
