import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card, colors, PageHeader, Screen, SectionTitle, ToggleRow } from '@/components/ui'
import { useAppState } from '@/context/AppContext'
import { checkApiHealth, isMockMode } from '@/services/api'
import type { ScanSettings } from '@/types/api'

type ApiStatus = 'checking' | 'connected' | 'offline'

export default function SettingsScreen() {
  const { settings, setSetting, setDemoMode } = useAppState()
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    let active = true
    void checkApiHealth()
      .then(() => active && setApiStatus('connected'))
      .catch(() => active && setApiStatus('offline'))
    return () => {
      active = false
    }
  }, [])

  const change = (key: keyof ScanSettings, value: boolean) => setSetting(key, value)

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Settings" subtitle="Threat engine & security policies" />

        <SectionTitle>Threat protection</SectionTitle>
        <Card style={styles.section}>
          <ToggleRow
            label="Zero-Auto Action"
            description="Always preview payload before launching"
            value
            onValueChange={() => {}}
            disabled
          />
          <ToggleRow
            label="URL Shortener Unfurl"
            description="Resolve shortlinks & examine destination"
            value={settings.urlShortenerUnfurl}
            onValueChange={(value) => change('urlShortenerUnfurl', value)}
          />
          <ToggleRow
            label="Block Insecure HTTP"
            description="Flag unencrypted website protocols"
            value={settings.blockInsecureHttp}
            onValueChange={(value) => change('blockInsecureHttp', value)}
          />
        </Card>

        <SectionTitle>Intelligence sources</SectionTitle>
        <Card style={styles.section}>
          <ToggleRow
            label="Safe Browsing API"
            description="Real-time threat database lookup"
            value={settings.safeBrowsingApi}
            onValueChange={(value) => change('safeBrowsingApi', value)}
          />
        </Card>

        <SectionTitle>App</SectionTitle>
        <Card style={styles.section}>
          <ToggleRow
            label="Demo Mode"
            description="Show sample QR payloads on Scanner"
            value={settings.demoMode}
            onValueChange={setDemoMode}
          />
          <View style={styles.statusRow}>
            {apiStatus === 'checking' ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: apiStatus === 'connected' ? colors.safe : colors.danger },
                ]}
              />
            )}
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>Back-end connection</Text>
              <Text style={styles.statusDescription}>
                API {apiStatus}{isMockMode ? ' · Demo responses' : ''}
              </Text>
            </View>
          </View>
        </Card>
        <Text style={styles.note}>
          Camera access is requested on-device before scanning. QR payloads are shown for review and are never opened automatically.
        </Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 20,
  },
  statusRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusCopy: {
    gap: 4,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  statusDescription: {
    color: colors.muted,
    fontSize: 11,
  },
  note: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 3,
  },
})
