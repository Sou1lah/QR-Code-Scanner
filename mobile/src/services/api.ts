import { getDemoResult } from '@/services/mock'
import type { ScanResult, ScanSettings } from '@/types/api'
import { parsePayload } from '@/lib/parsePayload'

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '')
export const isMockMode = process.env.EXPO_PUBLIC_USE_MOCK !== 'false'

export async function scanPayload(raw: string, settings: ScanSettings): Promise<ScanResult> {
  if (isMockMode) return getDemoResult(raw)
  const parsed = parsePayload(raw)
  if (!apiBaseUrl) throw new Error('Set EXPO_PUBLIC_API_URL to use the scan API.')

  const response = await fetch(`${apiBaseUrl}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...parsed, settings }),
  })
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
  return (await response.json()) as ScanResult
}

export async function checkApiHealth(): Promise<void> {
  if (!apiBaseUrl) throw new Error('Set EXPO_PUBLIC_API_URL to use the scan API.')
  const response = await fetch(`${apiBaseUrl}/api/health`)
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
}
