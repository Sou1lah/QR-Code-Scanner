import { getDemoResult } from '@/services/mock/scenarios'
import type { HealthResult, ScanRequest, ScanResult } from '@/types/api'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
  return response.json() as Promise<T>
}

export function scanPayload(input: ScanRequest): Promise<ScanResult> {
  if (useMock) return Promise.resolve(getDemoResult(input.raw))
  return request<ScanResult>('/api/scan', { method: 'POST', body: JSON.stringify(input) })
}

export function checkApiHealth(): Promise<HealthResult> {
  return request<HealthResult>('/api/health')
}

export const isMockMode = useMock
