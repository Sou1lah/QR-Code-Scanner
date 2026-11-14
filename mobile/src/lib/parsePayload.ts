import type { PayloadType } from '@/types/api'

export interface ParsedPayload {
  raw: string
  type: PayloadType
  wifi?: {
    ssid: string
    authentication: string
    password: string
  }
}

export function parsePayload(raw: string): ParsedPayload {
  const normalized = raw.trim()
  if (/^WIFI:/i.test(normalized)) {
    const fields = normalized.slice(5).replace(/;;$/, '').split(';')
    const values = new Map<string, string>()
    for (const field of fields) {
      const separator = field.indexOf(':')
      if (separator > 0) values.set(field.slice(0, separator), field.slice(separator + 1))
    }
    return {
      raw: normalized,
      type: 'WIFI',
      wifi: {
        ssid: values.get('S') ?? '',
        authentication: values.get('T') ?? '',
        password: values.get('P') ?? '',
      },
    }
  }

  if (/^https?:\/\//i.test(normalized)) return { raw: normalized, type: 'URL' }
  return { raw: normalized, type: 'TEXT' }
}
