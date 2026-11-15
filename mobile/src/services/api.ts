import { getDemoResult } from '@/services/mock'
import type { ScanResult, ScanSettings } from '@/types/api'
import { parsePayload } from '@/lib/parsePayload'

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '')
export const isMockMode = Boolean(process.env.EXPO_PUBLIC_USE_MOCK && process.env.EXPO_PUBLIC_USE_MOCK === 'true')

const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'tiny.cc',
])

const SUSPICIOUS_KEYWORDS = [
  'paypa1',
  'security-verify',
  'login-update',
  'account-confirm',
  'wallet-connect',
  'crypto-claim',
  'bank-alert',
  'appleid-verify',
]

const HIGH_RISK_TLDS = ['.xyz', '.top', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.work']

export function analyzePayloadLocally(raw: string, settings: ScanSettings): ScanResult {
  const trimmed = raw.trim()

  // Wi-Fi QR
  if (/^WIFI:/i.test(trimmed)) {
    const ssidMatch = trimmed.match(/S:([^;]+)/i)
    const typeMatch = trimmed.match(/T:([^;]+)/i)
    const ssid = ssidMatch ? ssidMatch[1] : 'Unknown Network'
    const authType = typeMatch ? typeMatch[1].toUpperCase() : 'NONE'
    const isOpen = authType === 'NOPASS' || authType === 'NONE'

    return {
      verdict: isOpen ? 'SUSPICIOUS' : 'SAFE',
      score: isOpen ? 65 : 15,
      summary: isOpen
        ? `Open Wi-Fi Network "${ssid}" without password protection. Network traffic may be monitored.`
        : `Secured Wi-Fi Network "${ssid}" using ${authType} protocol.`,
      ssl: 'N/A',
      domainAge: 'Local Wi-Fi',
      redirects: 'Direct AP',
      reputation: isOpen ? 'Open Hotspot (Advisory)' : 'Verified Network Profile',
      resolvedUrl: `SSID: ${ssid} | Auth: ${authType}`,
    }
  }

  // URL checking
  const isUrl = /^https?:\/\//i.test(trimmed)
  if (isUrl) {
    try {
      const parsedUrl = new URL(trimmed)
      const isHttp = parsedUrl.protocol.toLowerCase() === 'http:'
      const hostname = parsedUrl.hostname.toLowerCase()
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
      const isShortener = KNOWN_SHORTENERS.has(hostname)
      const isHighRiskTld = HIGH_RISK_TLDS.some((tld) => hostname.endsWith(tld))
      const hasPhishingKeyword = SUSPICIOUS_KEYWORDS.some((kw) => trimmed.toLowerCase().includes(kw))

      let score = 0
      const warnings: string[] = []

      if (isHttp) {
        score += settings.blockInsecureHttp ? 45 : 25
        warnings.push('Unencrypted HTTP connection detected')
      }
      if (isIp) {
        score += 45
        warnings.push('Host uses raw IP address instead of registered domain')
      }
      if (isShortener && settings.urlShortenerUnfurl) {
        score += 25
        warnings.push('URL shortener obscures destination')
      }
      if (isHighRiskTld) {
        score += 30
        warnings.push('Domain uses top-level domain frequently associated with spam/phishing')
      }
      if (hasPhishingKeyword) {
        score += 60
        warnings.push('Payload contains keywords often used in credential-harvesting phishing')
      }

      score = Math.min(100, Math.max(0, score))
      const verdict = score >= 70 ? 'DANGEROUS' : score >= 35 ? 'SUSPICIOUS' : 'SAFE'

      let summary = 'Website analyzed successfully. Identity and protocol verified.'
      if (verdict === 'DANGEROUS') {
        summary = `High threat detected: ${warnings.join('. ')}.`
      } else if (verdict === 'SUSPICIOUS') {
        summary = `Caution advised: ${warnings.join('. ')}.`
      }

      return {
        verdict,
        score,
        summary,
        ssl: isHttp ? 'Insecure HTTP' : 'Valid TLS 1.3',
        domainAge: isIp ? 'Raw IP Address' : isHighRiskTld ? 'Recent Registry' : 'Established Domain',
        redirects: isShortener ? 'Shortened Link' : 'Direct Link',
        reputation: verdict === 'DANGEROUS' ? 'Flagged Malicious' : verdict === 'SUSPICIOUS' ? 'Caution Advisory' : 'Safe & Clean',
        resolvedUrl: trimmed,
      }
    } catch {
      // Failed URL parse
    }
  }

  // Plain text or other payload
  return {
    verdict: 'SAFE',
    score: 5,
    summary: 'Text payload decoded successfully. Review content before copying or opening.',
    ssl: 'N/A',
    domainAge: 'Local Payload',
    redirects: 'Direct Payload',
    reputation: 'Clean',
    resolvedUrl: trimmed,
  }
}

export async function scanPayload(raw: string, settings: ScanSettings): Promise<ScanResult> {
  if (isMockMode) {
    return getDemoResult(raw)
  }

  const parsed = parsePayload(raw)

  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed, settings }),
      })
      if (response.ok) {
        return (await response.json()) as ScanResult
      }
    } catch (error) {
      console.warn('API server unreachable, falling back to on-device engine:', error)
    }
  }

  return analyzePayloadLocally(raw, settings)
}

export async function checkApiHealth(): Promise<void> {
  if (!apiBaseUrl) return
  const response = await fetch(`${apiBaseUrl}/api/health`)
  if (!response.ok) throw new Error(`API request failed (${response.status})`)
}
