import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { usePathname } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { BarcodeScanningResult } from 'expo-camera'
import { ActionButton, Card, colors, Screen, SectionTitle, VerdictBadge } from '@/components/ui'
import { useAppState } from '@/context/AppContext'
import { parsePayload } from '@/lib/parsePayload'
import { demoPayloads } from '@/services/mock'
import { scanPayload } from '@/services/api'
import type { ScanResult } from '@/types/api'

const resultTitle = {
  SAFE: 'Safe & Verified Payload',
  SUSPICIOUS: 'Caution Advisory Required',
  DANGEROUS: 'Malicious Threat Detected',
} as const

export default function ScannerScreen() {
  const pathname = usePathname()
  const isActive = pathname === '/'
  const [permission, requestPermission] = useCameraPermissions()
  const { settings, addHistoryItem } = useAppState()
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const scanLock = useRef(false)

  const inspect = useCallback(
    async (raw: string) => {
      if (scanLock.current) return
      const parsed = parsePayload(raw)
      if (!parsed.raw) {
        Alert.alert('Nothing to inspect', 'This QR code did not contain a payload.')
        return
      }

      scanLock.current = true
      setPayload(parsed.raw)
      setScanning(true)
      try {
        const scanResult = await scanPayload(parsed.raw, settings)
        setResult(scanResult)
        setResultOpen(true)
        addHistoryItem(parsed.raw, scanResult)
      } catch (error) {
        scanLock.current = false
        Alert.alert(
          'Scan failed',
          error instanceof Error ? error.message : 'Unable to analyze this QR payload.',
        )
      } finally {
        setScanning(false)
      }
    },
    [addHistoryItem, settings],
  )

  const handleBarcode = useCallback(
    (event: BarcodeScanningResult) => {
      void inspect(event.data)
    },
    [inspect],
  )

  const chooseImage = async () => {
    try {
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
      })
      if (selection.canceled) return
      const codes = await scanFromURLAsync(selection.assets[0].uri, ['qr'])
      if (codes.length === 0) {
        Alert.alert('No QR code found', 'Choose an image that contains a visible QR code.')
        return
      }
      void inspect(codes[0].data)
    } catch (error) {
      Alert.alert('Image scan failed', error instanceof Error ? error.message : 'Unable to scan this image.')
    }
  }

  const closeResult = () => {
    setResultOpen(false)
    scanLock.current = false
  }

  const openPayload = async () => {
    if (!result) return
    if (result.verdict === 'DANGEROUS') {
      Alert.alert('Blocked for your safety', 'This payload was marked dangerous and was not opened.')
      return
    }
    if (!/^https?:\/\//i.test(result.resolvedUrl)) {
      Alert.alert('Payload ready for review', result.resolvedUrl || payload)
      return
    }
    try {
      await Linking.openURL(result.resolvedUrl)
    } catch (error) {
      Alert.alert('Unable to open link', error instanceof Error ? error.message : 'The link could not be opened.')
    }
  }

  const copyPayload = async () => {
    try {
      await Clipboard.setStringAsync(payload)
      Alert.alert('Copied', 'Payload copied to clipboard.')
    } catch (error) {
      Alert.alert('Copy failed', error instanceof Error ? error.message : 'Clipboard access is unavailable.')
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {isActive && permission?.granted && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchEnabled}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={resultOpen || scanning ? undefined : handleBarcode}
          />
        )}
        <View pointerEvents="none" style={styles.cameraTint} />

        <View style={styles.header}>
          <Text style={styles.brand}>AMANE <Text style={styles.brandAccent}>DZ</Text></Text>
          <View style={styles.securePill}><Text style={styles.secureText}>QR SAFETY SCANNER</Text></View>
        </View>

        {settings.demoMode && (
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <SectionTitle>Test QR Payloads</SectionTitle>
              <Text style={styles.demoLabel}>DEMO MODE</Text>
            </View>
            <View style={styles.demoButtons}>
              <DemoButton title="Apple.com" tone={colors.safe} onPress={() => void inspect(demoPayloads.safe)} />
              <DemoButton title="Phishing" tone={colors.danger} onPress={() => void inspect(demoPayloads.phishing)} />
              <DemoButton title="Wi-Fi" tone={colors.warning} onPress={() => void inspect(demoPayloads.wifi)} />
            </View>
          </View>
        )}

        <View style={styles.scannerArea}>
          {!permission?.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionDescription}>Allow camera access to scan QR codes on your device.</Text>
              <ActionButton
                title={permission?.canAskAgain === false ? 'Open phone settings to allow camera' : 'Allow camera'}
                onPress={() => {
                  if (permission?.canAskAgain === false) {
                    Alert.alert('Camera permission blocked', 'Allow camera access for AMANE DZ in your phone settings.')
                  } else {
                    void requestPermission().catch((error: unknown) =>
                      Alert.alert('Camera permission failed', error instanceof Error ? error.message : 'Unable to request camera access.'),
                    )
                  }
                }}
              />
            </View>
          ) : (
            <>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                <View style={styles.scanLine} />
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{scanning ? 'Analyzing payload…' : 'Align QR code within frame'}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Turn torch off' : 'Turn torch on'}
            onPress={() => setTorchEnabled((enabled) => !enabled)}
            disabled={!permission?.granted}
            style={[styles.controlButton, !permission?.granted && styles.controlDisabled]}
          >
            <Text style={[styles.controlIcon, torchEnabled && { color: colors.warning }]}>ϟ</Text>
            <Text style={styles.controlLabel}>Light</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void chooseImage()} style={styles.controlButton}>
            <Text style={styles.controlIcon}>▧</Text>
            <Text style={styles.controlLabel}>Image</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={resultOpen && result !== null} transparent animationType="slide" onRequestClose={closeResult}>
        {result && (
          <View style={styles.modalBackdrop}>
            <View style={styles.resultSheet}>
              <View style={styles.sheetHandle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resultHeading}>
                  <View style={styles.resultCopy}>
                    <VerdictBadge verdict={result.verdict} />
                    <Text style={styles.resultTitle}>{resultTitle[result.verdict]}</Text>
                    <Text style={styles.score}>Risk score: {result.score}/100</Text>
                  </View>
                  <Pressable accessibilityLabel="Close result" onPress={closeResult} hitSlop={12}>
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.summary}>{result.summary}</Text>

                <Card style={styles.payloadCard}>
                  <View style={styles.payloadHeader}>
                    <Text style={styles.detailLabel}>DECODED PAYLOAD</Text>
                    <Pressable accessibilityRole="button" onPress={() => void copyPayload()}>
                      <Text style={styles.copyText}>Copy</Text>
                    </Pressable>
                  </View>
                  <Text selectable style={styles.payloadText}>{payload}</Text>
                </Card>

                <SectionTitle>Security diagnostics</SectionTitle>
                <View style={styles.diagnostics}>
                  <Diagnostic label="SSL State" value={result.ssl} />
                  <Diagnostic label="Domain Age" value={result.domainAge} />
                  <Diagnostic label="Redirects" value={result.redirects} />
                  <Diagnostic label="Reputation" value={result.reputation} />
                </View>
                <Card style={styles.destination}>
                  <Text style={styles.detailLabel}>RESOLVED DESTINATION</Text>
                  <Text selectable style={styles.destinationText}>{result.resolvedUrl || 'Not available'}</Text>
                </Card>
                <ActionButton
                  title={result.verdict === 'DANGEROUS' ? 'Block & Protect Device' : 'Review Payload'}
                  onPress={() => void openPayload()}
                />
                <View style={styles.dismiss}>
                  <ActionButton title="Dismiss Preview" secondary onPress={closeResult} />
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  )
}

function DemoButton({ title, tone, onPress }: { title: string; tone: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.demoButton, { borderColor: `${tone}60` }]}>
      <Text style={[styles.demoButtonText, { color: tone }]}>{title}</Text>
    </Pressable>
  )
}

function Diagnostic({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.diagnostic}>
      <Text style={styles.diagnosticLabel}>{label}</Text>
      <Text style={styles.diagnosticValue}>{value}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: colors.background,
  },
  cameraTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 9, 17, 0.62)',
  },
  header: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandAccent: {
    color: colors.accent,
  },
  securePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#0A84FF55',
    borderRadius: 20,
    backgroundColor: '#0A84FF1A',
  },
  secureText: {
    color: '#70B7FF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  demoSection: {
    zIndex: 1,
    gap: 5,
    marginTop: 18,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoLabel: {
    color: '#70B7FF',
    fontSize: 9,
    fontWeight: '700',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 13,
    backgroundColor: '#10141D',
  },
  demoButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scannerArea: {
    zIndex: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCard: {
    width: '100%',
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: '#10141D',
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  permissionDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  viewfinder: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF45',
    borderRadius: 32,
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: colors.accent,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    width: '84%',
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 9,
  },
  statusPill: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
    borderRadius: 20,
    backgroundColor: '#FFFFFF1A',
  },
  statusText: {
    color: '#E6EAF2',
    fontSize: 11,
    fontWeight: '600',
  },
  controls: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 42,
    paddingBottom: 8,
  },
  controlButton: {
    minWidth: 68,
    alignItems: 'center',
    gap: 3,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  controlIcon: {
    color: colors.text,
    fontSize: 24,
  },
  controlLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000A6',
  },
  resultSheet: {
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#10141D',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 18,
    borderRadius: 4,
    backgroundColor: '#545B69',
  },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  resultCopy: {
    flex: 1,
    gap: 7,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  score: {
    color: colors.muted,
    fontSize: 12,
  },
  closeText: {
    color: colors.muted,
    fontSize: 19,
  },
  summary: {
    marginBottom: 14,
    color: '#D8DCE5',
    fontSize: 13,
    lineHeight: 19,
  },
  payloadCard: {
    marginBottom: 18,
    padding: 13,
  },
  payloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  copyText: {
    color: '#70B7FF',
    fontSize: 11,
    fontWeight: '700',
  },
  payloadText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  diagnostics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  diagnostic: {
    width: '48%',
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  diagnosticLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  diagnosticValue: {
    marginTop: 3,
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  destination: {
    gap: 7,
    marginBottom: 16,
    padding: 12,
  },
  destinationText: {
    color: '#70B7FF',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  dismiss: {
    marginTop: 9,
  },
})
