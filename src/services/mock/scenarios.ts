import type { ScanResult } from '@/types/api'

export const demoScenarios: Record<string, ScanResult> = {
  safe: {
    verdict: 'SAFE',
    score: 0,
    summary: 'Domain signed with valid Apple SSL Certificate. Verified identity across global registries.',
    ssl: 'Valid TLS 1.3',
    domainAge: '27 Years',
    redirects: 'Direct Link',
    reputation: 'Trusted',
    resolvedUrl: 'https://apple.com/security/overview',
  },
  phishing: {
    verdict: 'DANGEROUS',
    score: 98,
    summary: 'Phishing Typosquat Detected: Impersonating PayPal to steal login credentials over unencrypted HTTP.',
    ssl: 'Insecure HTTP',
    domainAge: '3 Days',
    redirects: 'Suspicious Domain',
    reputation: 'Blacklisted (16/90)',
    resolvedUrl: 'http://login.paypa1-security-check.com/verify?account_id=982',
  },
  wifi: {
    verdict: 'SUSPICIOUS',
    score: 70,
    summary: 'Potential Rogue Access Point: Open Wi-Fi AP signature matches untrusted hotspot profile.',
    ssl: 'N/A',
    domainAge: 'Unverified AP',
    redirects: 'N/A',
    reputation: 'Untrusted AP',
    resolvedUrl: 'SSID: Free_Airport_WiFi | Protocol: WPA',
  },
}

export const demoPayloads = {
  safe: 'https://apple.com/security/overview',
  phishing: 'http://login.paypa1-security-check.com/verify',
  wifi: 'WIFI:S:Free_Airport_WiFi;T:WPA;P:hack123;;',
} as const

export function getDemoResult(raw: string): ScanResult {
  const match = Object.entries(demoPayloads).find(([, payload]) => payload === raw)
  if (match) return demoScenarios[match[0]]

  const isHttp = /^http:\/\//i.test(raw)
  const isUrl = /^https?:\/\//i.test(raw)
  return {
    verdict: isHttp ? 'SUSPICIOUS' : 'SAFE',
    score: isHttp ? 45 : 10,
    summary: isUrl
      ? 'Demo mode is enabled. No live threat analysis has been performed.'
      : 'Text payload decoded. Review it carefully before taking action.',
    ssl: isHttp ? 'Insecure HTTP' : isUrl ? 'HTTPS' : 'N/A',
    domainAge: 'Unavailable',
    redirects: 'Not checked',
    reputation: 'Demo mode',
    resolvedUrl: raw,
  }
}
