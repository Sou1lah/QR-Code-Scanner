import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { usePathname } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  AppState,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import type { BarcodeScanningResult } from 'expo-camera'
import {
  ActionButton,
  AppIcon,
  AppText,
  Chip,
  colors,
  GlassButton,
  GlassCard,
  images,
  PermissionCard,
  radius,
  Screen,
  ScreenHeader,
  SectionTitle,
  useTabBarSpace,
  VerdictBadge,
  withAlpha,
  type IconName,
  type Tone,
} from '@/ui'
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
  const tabBarSpace = useTabBarSpace()
  const [permission, requestPermission, getPermission] = useCameraPermissions()
  const { settings, addHistoryItem, isDark, toggleTheme } = useAppState()
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const scanLock = useRef(false)

  const laserAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void getPermission()
      }
    })
    return () => {
      subscription.remove()
    }
  }, [getPermission])

  // Continuous scanning laser animation
  useEffect(() => {
    if (!cameraEnabled || !permission?.granted || resultOpen) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [cameraEnabled, laserAnim, permission?.granted, resultOpen])

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 230],
  })

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
        Alert.alert('Scan failed', error instanceof Error ? error.message : 'Unable to analyze this QR payload.')
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
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ScreenHeader
          title="AMANE DZ"
          leading={<Image source={images.brandMark} style={styles.brandMark} />}
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              onPress={toggleTheme}
              hitSlop={8}
              style={({ pressed }) => [
                styles.themeToggle,
                isDark ? styles.themeToggleDark : styles.themeToggleLight,
                pressed && styles.pressedThemeToggle,
              ]}
            >
              <AppIcon
                name={isDark ? 'moon' : 'sunny'}
                size={16}
                color={isDark ? '#70B7FF' : '#FF9F0A'}
              />
              <AppText variant="caption" style={[styles.themeToggleText, { color: isDark ? '#F2F5FF' : '#0F172A' }]}>
                {isDark ? 'Dark' : 'Light'}
              </AppText>
            </Pressable>
          }
        />

        {settings.demoMode && (
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <SectionTitle>Test QR Payloads</SectionTitle>
              <AppText variant="label" style={styles.demoLabel}>DEMO MODE</AppText>
            </View>
            <View style={styles.demoButtons}>
              <DemoButton title="Apple.com" icon="safe" tone="success" onPress={() => void inspect(demoPayloads.safe)} />
              <DemoButton title="Phishing" icon="danger" tone="danger" onPress={() => void inspect(demoPayloads.phishing)} />
              <DemoButton title="Wi-Fi" icon="wifi" tone="warning" onPress={() => void inspect(demoPayloads.wifi)} />
            </View>
          </View>
        )}

        <View style={styles.scannerArea}>
          {!permission?.granted ? (
            <PermissionCard
              title="Camera access needed"
              message="Allow camera access to scan QR codes on your device."
              actionLabel="Allow Camera"
              onAction={() => {
                void requestPermission().then((res) => {
                  if (res && !res.granted && res.canAskAgain === false) {
                    void Linking.openSettings().catch((error: unknown) =>
                      Alert.alert(
                        'Unable to open settings',
                        error instanceof Error ? error.message : 'Open camera permissions in system settings.',
                      ),
                    )
                  }
                }).catch((error: unknown) =>
                  Alert.alert(
                    'Camera permission failed',
                    error instanceof Error ? error.message : 'Unable to request camera access.',
                  ),
                )
              }}
              onOpenSettings={() => {
                void Linking.openSettings().catch((error: unknown) =>
                  Alert.alert(
                    'Unable to open settings',
                    error instanceof Error ? error.message : 'Open camera permissions in system settings.',
                  ),
                )
              }}
            />
          ) : (
            <>
              {/* Confined QR Code Camera Viewfinder */}
              <View style={[styles.viewfinder, !isDark && styles.viewfinderLight]}>
                {isActive && cameraEnabled ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchEnabled}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={resultOpen || scanning ? undefined : handleBarcode}
                  />
                ) : (
                  <View style={styles.cameraPausedWrap}>
                    <AppIcon name="camera" size={38} color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'} />
                    <AppText
                      variant="caption"
                      color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}
                      style={styles.cameraPausedText}
                    >
                      Camera is paused
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setCameraEnabled(true)}
                      style={styles.resumeCameraBtn}
                    >
                      <AppIcon name="camera" size={14} color="#FFFFFF" />
                      <AppText variant="label" color="#FFFFFF">Open Camera</AppText>
                    </Pressable>
                  </View>
                )}

                {/* Viewfinder corner accents */}
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />

                  {/* Animated scanning laser line */}
                  {isActive && cameraEnabled && !resultOpen && (
                    <Animated.View
                      style={[
                        styles.animatedLaserWrap,
                        { transform: [{ translateY: laserTranslateY }] },
                      ]}
                    >
                      <View style={styles.laserBeam} />
                      <View style={styles.laserGlow} />
                    </Animated.View>
                  )}
                </View>
              </View>

              <Chip
                icon={scanning ? 'pulse' : 'scanner'}
                label={scanning ? 'Analyzing payload…' : cameraEnabled ? 'Align QR code within frame' : 'Camera is closed'}
                tone={scanning ? 'accent' : 'neutral'}
                style={styles.statusPill}
              />
            </>
          )}
        </View>

        <View style={styles.controls}>
          <GlassButton
            label="Light"
            icon={torchEnabled ? 'flashOn' : 'flash'}
            onPress={() => setTorchEnabled((enabled) => !enabled)}
            disabled={!permission?.granted || !cameraEnabled}
            style={styles.controlButton}
          />
          <GlassButton
            label={cameraEnabled ? 'Close Cam' : 'Open Cam'}
            icon={cameraEnabled ? 'close' : 'camera'}
            onPress={() => {
              setCameraEnabled((prev) => {
                if (prev) setTorchEnabled(false)
                return !prev
              })
            }}
            disabled={!permission?.granted}
            style={styles.controlButton}
          />
          <GlassButton
            label="Image"
            icon="image"
            onPress={() => void chooseImage()}
            style={styles.controlButton}
          />
        </View>
      </View>

      <Modal visible={resultOpen && result !== null} transparent animationType="slide" onRequestClose={closeResult}>
        {result && (
          <View style={styles.modalBackdrop}>
            <GlassCard
              rounded="xl"
              intensity={60}
              style={[
                styles.resultSheet,
                !isDark && styles.resultSheetLight,
              ]}
            >
              <View style={[styles.sheetHandle, !isDark && styles.sheetHandleLight]} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resultHeading}>
                  <View style={styles.resultCopy}>
                    <VerdictBadge verdict={result.verdict} size="large" />
                    <AppText variant="heading" style={[styles.resultTitle, !isDark && { color: '#0F172A' }]}>
                      {resultTitle[result.verdict]}
                    </AppText>
                    <AppText variant="caption" color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}>
                      Risk score: {result.score}/100
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityLabel="Close result"
                    onPress={closeResult}
                    hitSlop={12}
                    style={[styles.closeButton, !isDark && styles.closeButtonLight]}
                  >
                    <AppIcon name="close" size={20} color={isDark ? colors.textMuted : '#0F172A'} />
                  </Pressable>
                </View>

                <AppText variant="body" style={[styles.summary, !isDark && { color: '#1E293B' }]}>
                  {result.summary}
                </AppText>

                <GlassCard style={styles.payloadCard}>
                  <View style={styles.payloadHeader}>
                    <AppText variant="label" color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}>
                      DECODED PAYLOAD
                    </AppText>
                    <Pressable accessibilityRole="button" onPress={() => void copyPayload()} style={styles.copyButton}>
                      <AppIcon name="copy" size={13} color={colors.accent} />
                      <AppText variant="caption" color={colors.accent} style={{ fontWeight: '700' }}>
                        Copy
                      </AppText>
                    </Pressable>
                  </View>
                  <AppText selectable variant="body" style={[styles.payloadText, !isDark && { color: '#0F172A' }]}>
                    {payload}
                  </AppText>
                </GlassCard>

                <SectionTitle>Security diagnostics</SectionTitle>
                <View style={styles.diagnostics}>
                  <Diagnostic label="SSL State" value={result.ssl} icon="lock" />
                  <Diagnostic label="Domain Age" value={result.domainAge} icon="globe" />
                  <Diagnostic label="Redirects" value={result.redirects} icon="link" />
                  <Diagnostic label="Reputation" value={result.reputation} icon="shield" />
                </View>

                <GlassCard style={styles.destination}>
                  <View style={styles.destinationHeader}>
                    <AppIcon name="link" size={14} color={colors.accent} />
                    <AppText variant="label" color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}>
                      RESOLVED DESTINATION
                    </AppText>
                  </View>
                  <AppText selectable variant="body" style={styles.destinationText}>
                    {result.resolvedUrl || 'Not available'}
                  </AppText>
                </GlassCard>

                <ActionButton
                  icon={result.verdict === 'DANGEROUS' ? 'shield' : 'open'}
                  title={result.verdict === 'DANGEROUS' ? 'Block & Protect Device' : 'Open Link'}
                  onPress={() => void openPayload()}
                />
                <View style={styles.dismiss}>
                  <ActionButton icon="close" title="Dismiss Preview" secondary onPress={closeResult} />
                </View>
              </ScrollView>
            </GlassCard>
          </View>
        )}
      </Modal>
    </Screen>
  )
}

function DemoButton({ title, icon, tone, onPress }: { title: string; icon?: IconName; tone: Tone; onPress: () => void }) {
  return <Chip label={title} icon={icon} tone={tone} onPress={onPress} style={styles.demoButton} />
}

function Diagnostic({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  const { isDark } = useAppState()
  return (
    <GlassCard style={styles.diagnostic}>
      <View style={styles.diagnosticHeader}>
        <AppIcon name={icon} size={14} color={colors.accent} />
        <AppText variant="caption" color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}>
          {label}
        </AppText>
      </View>
      <AppText variant="label" style={[styles.diagnosticValue, !isDark && { color: '#0F172A' }]}>
        {value}
      </AppText>
    </GlassCard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeToggleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  themeToggleLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  themeToggleText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pressedThemeToggle: {
    opacity: 0.72,
  },
  demoSection: {
    zIndex: 1,
    gap: 8,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scannerArea: {
    zIndex: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderLight: {
    borderColor: 'rgba(0, 0, 0, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cameraPausedWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  cameraPausedText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  resumeCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    marginTop: 6,
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
    borderTopLeftRadius: 18,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  animatedLaserWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 18,
    justifyContent: 'center',
  },
  laserBeam: {
    width: '100%',
    height: 2.5,
    backgroundColor: colors.accent,
    borderRadius: 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  laserGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: withAlpha(colors.accent, 0.22),
    borderRadius: 8,
  },
  statusPill: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  controls: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 8,
  },
  controlButton: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  resultSheet: {
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: 'rgba(12, 18, 44, 0.95)',
  },
  resultSheetLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 18,
    borderRadius: 4,
    backgroundColor: '#545B69',
  },
  sheetHandleLight: {
    backgroundColor: '#CBD5E1',
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
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summary: {
    marginBottom: 14,
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
  payloadText: {
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
  diagnosticValue: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
  },
  destination: {
    gap: 7,
    marginBottom: 16,
    padding: 12,
  },
  destinationText: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  dismiss: {
    marginTop: 9,
  },
})
