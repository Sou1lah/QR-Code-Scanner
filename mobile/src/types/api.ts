export type PayloadType = 'URL' | 'WIFI' | 'TEXT'
export type Verdict = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'

export interface ScanSettings {
  urlShortenerUnfurl: boolean
  blockInsecureHttp: boolean
  safeBrowsingApi: boolean
}

export interface ScanResult {
  verdict: Verdict
  score: number
  summary: string
  ssl: string
  domainAge: string
  redirects: string
  reputation: string
  resolvedUrl: string
}

export interface HistoryItem {
  id: string
  timestamp: number
  raw: string
  result: ScanResult
}
