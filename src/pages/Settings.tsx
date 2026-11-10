import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, Shield } from 'lucide-react'
import { ListGroup } from '@/components/ui/ListGroup'
import { Switch } from '@/components/ui/Switch'
import { checkApiHealth, isMockMode } from '@/services/api/client'
import { useSettingsStore } from '@/store/settings'

export function Settings({ onToast }: { onToast: (message: string) => void }) {
  const settings = useSettingsStore()
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  useEffect(() => {
    let active = true
    void checkApiHealth()
      .then(() => active && setApiStatus('connected'))
      .catch(() => active && setApiStatus('offline'))
    return () => {
      active = false
    }
  }, [])

  const change = (key: 'urlShortenerUnfurl' | 'blockInsecureHttp' | 'safeBrowsingApi', value: boolean) => {
    settings.setSetting(key, value)
    onToast('Rule settings saved')
  }

  return (
    <div className="ios-scroll h-full space-y-5 overflow-y-auto p-5 pt-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-white/60">Threat engine &amp; security policies</p>
      </header>
      <ListGroup title="Threat Protection">
        <SettingRow label="Zero-Auto Action" description="Always preview payload before launching">
          <Switch checked disabled label="Zero-Auto Action" />
        </SettingRow>
        <SettingRow label="URL Shortener Unfurl" description="Resolve shortlinks & examine destination">
          <Switch
            checked={settings.urlShortenerUnfurl}
            onChange={(value) => change('urlShortenerUnfurl', value)}
            label="URL Shortener Unfurl"
          />
        </SettingRow>
        <SettingRow label="Block Insecure HTTP" description="Flag unencrypted website protocols">
          <Switch
            checked={settings.blockInsecureHttp}
            onChange={(value) => change('blockInsecureHttp', value)}
            label="Block Insecure HTTP"
          />
        </SettingRow>
      </ListGroup>
      <ListGroup title="Intelligence Sources">
        <SettingRow
          label="Safe Browsing API"
          description="Real-time threat database lookup"
          icon={<Shield size={19} className="text-ios-accent" />}
        >
          <Switch
            checked={settings.safeBrowsingApi}
            onChange={(value) => change('safeBrowsingApi', value)}
            label="Safe Browsing API"
          />
        </SettingRow>
      </ListGroup>
      <ListGroup title="App">
        <SettingRow label="Demo Mode" description="Show sample QR payloads on Scanner">
          <Switch
            checked={settings.demoMode}
            onChange={(value) => {
              settings.setDemoMode(value)
              onToast(value ? 'Demo mode enabled' : 'Demo mode disabled')
            }}
            label="Demo Mode"
          />
        </SettingRow>
        <div className="flex items-center justify-between gap-3 p-3.5">
          <div className="flex items-center gap-3">
            <Activity
              size={18}
              className={
                apiStatus === 'connected'
                  ? 'text-ios-safe'
                  : apiStatus === 'offline'
                    ? 'text-ios-danger'
                    : 'text-ios-warning'
              }
            />
            <div>
              <div className="text-sm font-semibold text-white">Back-end Connection</div>
              <div className="text-[11px] text-white/60">
                {`API ${apiStatus === 'checking' ? 'checking…' : apiStatus}${isMockMode ? ' · Demo responses' : ''}`}
              </div>
            </div>
          </div>
          <span
            className={`h-2 w-2 rounded-full ${apiStatus === 'connected' ? 'bg-ios-safe' : apiStatus === 'offline' ? 'bg-ios-danger' : 'bg-ios-warning animate-pulse'}`}
          />
        </div>
      </ListGroup>
      <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/60">
        Camera scanning requires a secure HTTPS connection (or localhost). Allow camera access when prompted.
      </p>
    </div>
  )
}

function SettingRow({
  label,
  description,
  icon,
  children,
}: {
  label: string
  description: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-[11px] text-white/60">{description}</div>
        </div>
      </div>
      {children}
    </div>
  )
}
