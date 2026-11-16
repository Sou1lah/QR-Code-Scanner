import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { useIsFocused } from 'expo-router'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  AppState,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Reanimated from 'react-native-reanimated'
import Svg, { Rect } from 'react-native-svg'
import type { BarcodeScanningResult } from 'expo-camera'
import {
  ActionButton,
  AppIcon,
  AppText,
  Chip,
  colors,
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
import { triggerScanResultHaptic } from '@/utils/haptics'

const resultTitle = {
  SAFE: 'Safe & Verified Payload',
  SUSPICIOUS: 'Caution Advisory Required',
  DANGEROUS: 'Malicious Threat Detected',
} as const

const SCAN_READ_DELAY_MS = 1200
const VIEWFINDER_HEIGHT = 270
const LASER_WRAP_HEIGHT = 18

function ScannerScreen() {
  const isFocused = useIsFocused()
  const tabBarSpace = useTabBarSpace()
  const [permission, requestPermission, getPermission] = useCameraPermissions()
  const { settings, addHistoryItem, isDark } = useAppState()
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [reading, setReading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [payload, setPayload] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const scanLock = useRef(false)

  // Active camera flag — mounted only while Home is focused, user-enabled, and permission granted
  const cameraIsOpen = isFocused && cameraEnabled && Boolean(permission?.granted)

  // Guard against double start / double stop
  const openCamera = useCallback(() => {
    if (!permission?.granted || cameraEnabled) return
    setCameraEnabled(true)
  }, [cameraEnabled, permission?.granted])

  const closeCamera = useCallback(() => {
    if (!cameraEnabled) return
    setCameraEnabled(false)
    setTorchEnabled(false)
  }, [cameraEnabled])

  // Stop camera on unmount guard
  useEffect(() => {
    return () => {
      setCameraEnabled(false)
      setTorchEnabled(false)
    }
  }, [])

  // Reanimated scan laser (continuous ping-pong, canceled ONLY on unmount)
  const scanY = useSharedValue(0)
  const scanOpacity = useSharedValue(1)

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(VIEWFINDER_HEIGHT - LASER_WRAP_HEIGHT, { duration: 1800 }),
      -1,
      true,
    )
    return () => {
      cancelAnimation(scanY)
    }
  }, [scanY])

  // Dim it (do not cancel) while a scan is being processed or camera is off
  useEffect(() => {
    if (scanning || !cameraIsOpen) {
      scanOpacity.value = withTiming(0.25, { duration: 250 })
    } else {
      scanOpacity.value = withTiming(1, { duration: 250 })
    }
  }, [cameraIsOpen, scanning, scanOpacity])

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanOpacity.value,
  }))

  // AppState listener — refresh permissions when app comes to foreground
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

  // Task 6 — Full scan flow with reading + checking states
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
      setReading(true)
      setChecking(false)
      try {
        // Step 1: show "Reading QR code…" for at least 1200ms
        await new Promise<void>((resolve) => setTimeout(resolve, SCAN_READ_DELAY_MS))
        setReading(false)
        // Step 2: show "Checking link safety…"
        setChecking(true)
        // Step 3: await scan
        const scanResult = await scanPayload(parsed.raw, settings)
        setChecking(false)
        void triggerScanResultHaptic(scanResult.verdict)
        setResult(scanResult)
        setResultOpen(true)
        addHistoryItem(parsed.raw, scanResult)
      } catch (error) {
        scanLock.current = false
        setChecking(false)
        Alert.alert('Scan failed', error instanceof Error ? error.message : 'Unable to analyze this QR payload.')
      } finally {
        setScanning(false)
        setReading(false)
      }
    },
    [addHistoryItem, settings],
  )

  const handleBarcode = useCallback(
    (event: BarcodeScanningResult) => {
      // Task 5: Drive scan action from active flag; ignore if camera is off, locked, or processing
      if (!cameraIsOpen || scanLock.current || resultOpen || scanning) return
      void inspect(event.data)
    },
    [cameraIsOpen, inspect, resultOpen, scanning],
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
      closeResult()
      Alert.alert('Blocked for your safety', 'This malicious link was blocked from opening.')
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

  // Task 6 — chip label logic
  const chipLabel = reading
    ? 'Reading QR code…'
    : checking
      ? 'Checking link safety…'
      : scanning
        ? 'Analyzing payload…'
        : cameraIsOpen
          ? 'Align QR code within frame'
          : 'Camera is closed'

  return (
    <Screen>
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ScreenHeader
          title="AMANE DZ"
          leading={<Image source={images.brandMark} style={styles.brandMark} />}
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
                {cameraIsOpen ? (
                  <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchEnabled}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={
                      cameraIsOpen && !scanLock.current && !resultOpen && !scanning
                        ? handleBarcode
                        : undefined
                    }
                  />
                ) : (
                  <View style={styles.cameraPausedWrap}>
                    <AppIcon name="camera" size={40} color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'} />
                    <AppText
                      variant="caption"
                      color={isDark ? colors.textMuted : 'rgba(71,85,105,0.85)'}
                      style={styles.cameraPausedText}
                    >
                      Camera is paused
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open camera"
                      onPress={() => {
                        if (permission?.granted) setCameraEnabled(true)
                      }}
                      style={({ pressed }) => [
                        styles.resumeCameraBtn,
                        pressed && styles.resumeCameraBtnPressed,
                      ]}
                    >
                      <AppIcon name="camera" size={15} color="#FFFFFF" />
                      <Text style={styles.resumeCameraBtnText}>OPEN CAMERA</Text>
                    </Pressable>
                  </View>
                )}

                {/* Viewfinder corner accents & watermark guide */}
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {/* Subtle QR guide watermark */}
                  {cameraIsOpen && (
                    <View style={styles.qrWatermarkWrap}>
                      <Svg width={120} height={120} viewBox="0 0 96 96">
                        <Rect x={4} y={4} width={32} height={32} rx={8} fill="none" stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} strokeWidth={4} />
                        <Rect x={12} y={12} width={16} height={16} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={60} y={4} width={32} height={32} rx={8} fill="none" stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} strokeWidth={4} />
                        <Rect x={68} y={12} width={16} height={16} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={4} y={60} width={32} height={32} rx={8} fill="none" stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} strokeWidth={4} />
                        <Rect x={12} y={68} width={16} height={16} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={44} y={12} width={8} height={20} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={44} y={40} width={8} height={16} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={64} y={44} width={24} height={8} rx={4} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={64} y={64} width={10} height={10} rx={5} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={80} y={64} width={10} height={10} rx={5} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={64} y={80} width={10} height={10} rx={5} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                        <Rect x={80} y={80} width={10} height={10} rx={5} fill={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} />
                      </Svg>
                    </View>
                  )}

                  {/* Perfectly rounded corner brackets */}
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />

                  {/* Reanimated scanning laser line — only when camera is active */}
                  {cameraIsOpen && !resultOpen && (
                    <Reanimated.View style={[styles.animatedLaserWrap, laserAnimatedStyle]}>
                      <View style={styles.laserBeam} />
                      <View style={styles.laserGlow} />
                    </Reanimated.View>
                  )}
                </View>
              </View>

              <Chip
                icon={scanning ? 'pulse' : 'scanner'}
                label={chipLabel}
                tone={scanning ? 'accent' : 'neutral'}
                style={styles.statusPill}
              />
            </>
          )}
        </View>

        {/* Centered two-button controls (Light & Image icons only) */}
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Turn off light' : 'Turn on light'}
            onPress={() => setTorchEnabled((enabled) => !enabled)}
            disabled={!cameraIsOpen}
            style={({ pressed }) => [
              styles.iconButton,
              !isDark && styles.iconButtonLight,
              torchEnabled && styles.iconButtonActive,
              !cameraIsOpen && styles.iconButtonDisabled,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <AppIcon
              name={torchEnabled ? 'flashOn' : 'flash'}
              size={22}
              color={torchEnabled ? '#FFFFFF' : isDark ? colors.accent : '#0A84FF'}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan QR from gallery image"
            onPress={() => void chooseImage()}
            style={({ pressed }) => [
              styles.iconButton,
              !isDark && styles.iconButtonLight,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <AppIcon
              name="image"
              size={22}
              color={isDark ? colors.accent : '#0A84FF'}
            />
          </Pressable>
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
                  {/* Task 6 — renamed labels + mapped values */}
                  <Diagnostic
                    label="HTTPS"
                    value={result.ssl === 'Valid SSL' ? 'Protected' : 'Not secured'}
                    icon="lock"
                  />
                  <Diagnostic label="Domain Age" value={result.domainAge} icon="globe" />
                  <Diagnostic label="Redirects" value={result.redirects} icon="link" />
                  <Diagnostic label="Blocklist" value={result.reputation} icon="shield" />
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

                {/* Task 6 — shorter action button label */}
                <ActionButton
                  icon={result.verdict === 'DANGEROUS' ? 'shield' : 'open'}
                  title={result.verdict === 'DANGEROUS' ? 'Block link' : 'Open link'}
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
    width: 270,
    height: 270,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(4, 7, 18, 0.7)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderLight: {
    borderColor: 'rgba(0, 0, 0, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  qrWatermarkWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cameraPausedWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  cameraPausedText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  resumeCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: '#0A84FF',
    marginTop: 10,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  resumeCameraBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  resumeCameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  corner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: '#0A84FF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 28,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 28,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 28,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 28,
  },
  animatedLaserWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: LASER_WRAP_HEIGHT,
    justifyContent: 'center',
  },
  laserBeam: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#0A84FF',
    borderRadius: 2,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  laserGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: 'rgba(10, 132, 255, 0.28)',
    borderRadius: 9,
  },
  statusPill: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'center',
    borderRadius: radius.pill,
  },
  controls: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 16,
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  iconButtonLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  iconButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  iconButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
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

export default memo(ScannerScreen)
